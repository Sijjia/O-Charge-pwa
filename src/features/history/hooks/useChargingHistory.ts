import { useQuery } from "@tanstack/react-query";
import { rpApi } from "@/services/rpApi";
import { logger } from "@/shared/utils/logger";
import type {
  ChargingHistoryItem,
  TransactionHistoryItem,
  UsageStatistics,
} from "../types";

/**
 * ChargingSessionData - данные сессии зарядки из rpApi.getChargingHistory()
 * Примечание: API маппит данные в "legacy" формат:
 * - energy (вместо energy_kwh)
 * - created_at (вместо started_at)
 * - stations.locations (вместо station.location)
 */
interface ChargingSessionData {
  id: string;
  station_id: string | null;
  connector_id?: number | null;
  status?: string | null;
  energy: number; // Маппится из energy_kwh
  amount: number;
  created_at: string | null; // Маппится из started_at
  ended_at: string | null;
  connector_type?: string;
  limit_type?: string;
  limit_value?: number;
  max_power_kw?: number | null;
  stations?: {
    model?: string | null;
    locations?: {
      name?: string | null;
      address?: string | null;
    } | null;
  } | null;
}

interface TransactionData {
  id: string;
  transaction_type: string;
  amount: number;
  requested_amount: number;
  balance_before: number | null;
  balance_after: number | null;
  created_at: string | null;
  completed_at?: string | null;
  status?: string | null;
  payment_method?: string | null;
  invoice_id?: string | null;
}

interface StationCounts {
  [stationId: string]: {
    id: string;
    name: string;
    count: number;
  };
}

interface MonthlyGroups {
  [monthKey: string]: {
    month: string;
    sessions: number;
    energy: number;
    cost: number;
  };
}

// Хук для получения истории зарядок
export const useChargingHistory = (limit: number = 50) => {
  return useQuery({
    queryKey: ["charging-history", limit],
    queryFn: async (): Promise<ChargingHistoryItem[]> => {
      try {
        // Получаем историю напрямую через rpApi
        const data = await rpApi.getChargingHistory(limit);

        if (!data || data.length === 0) {
          return [];
        }

        // Преобразуем данные в ChargingHistoryItem
        return data.map((session: ChargingSessionData): ChargingHistoryItem => {
          // Вычисляем duration из created_at и ended_at
          const duration =
            session.created_at && session.ended_at
              ? Math.floor(
                  (new Date(session.ended_at).getTime() -
                    new Date(session.created_at).getTime()) /
                    1000,
                )
              : 0;

          // Вычисляем среднюю и максимальную мощность
          const energyKwh = session.energy || 0;
          const durationHours = duration / 3600;
          const averagePower =
            durationHours > 0 ? energyKwh / durationHours : 0;

          // Нормализуем статус
          let normalizedStatus:
            | "completed"
            | "stopped"
            | "failed"
            | "in_progress";
          if (session.status === "started") {
            // Активная сессия зарядки
            normalizedStatus = "in_progress";
          } else if (
            session.status === "stopped" ||
            session.status === "completed"
          ) {
            normalizedStatus = "completed";
          } else if (
            session.status === "error" ||
            session.status === "failed"
          ) {
            normalizedStatus = "failed";
          } else {
            normalizedStatus = "stopped";
          }

          return {
            id: session.id,
            sessionId: session.id,
            stationId: session.station_id || "",
            stationName: session.stations?.locations?.name || "Станция",
            stationAddress: session.stations?.locations?.address || "",
            connectorId: session.connector_id || 1,
            connectorType: session.connector_type ?? "Type 2",
            startTime: session.created_at || "",
            endTime: session.ended_at || "",
            duration,
            energyConsumed: energyKwh,
            totalCost: session.amount || 0,
            averagePower,
            maxPower: session.max_power_kw ?? averagePower,
            status: normalizedStatus,
            stopReason: undefined,
            limitType: session.limit_type as
              | "energy"
              | "amount"
              | "none"
              | undefined,
            limitValue: session.limit_value,
          };
        });
      } catch (error) {
        logger.error("[useChargingHistory] Failed to fetch charging history", {
          limit,
          error,
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Хук для получения истории транзакций
export const useTransactionHistory = (limit: number = 50) => {
  return useQuery({
    queryKey: ["transaction-history", limit],
    queryFn: async (): Promise<TransactionHistoryItem[]> => {
      try {
        // Получаем историю транзакций напрямую через rpApi
        const data = await rpApi.getTransactionHistory(limit);

        if (!data || data.length === 0) {
          return [];
        }

        // Преобразуем данные в TransactionHistoryItem
        return data.map((tx: TransactionData): TransactionHistoryItem => {
          // Определяем тип и статус транзакции на основе transaction_type
          let type: "topup" | "charge" | "refund" = "charge";
          let status: "success" | "pending" | "failed" = "success";

          if (tx.transaction_type === "balance_topup") {
            type = "topup";
          } else if (tx.transaction_type === "balance_topup_canceled") {
            type = "topup";
            status = "failed"; // Отмененные транзакции
          } else if (tx.transaction_type === "charge_refund") {
            type = "refund";
          }

          // Безопасный парсинг числовых значений
          const parseAmount = (
            value: string | number | null | undefined,
          ): number => {
            if (value === null || value === undefined || value === "") return 0;
            const parsed =
              typeof value === "number" ? value : parseFloat(value);
            return isNaN(parsed) ? 0 : parsed;
          };

          // Генерируем описание из типа транзакции
          const getDescription = (txType: string): string => {
            switch (txType) {
              case "balance_topup":
                return "Пополнение баланса";
              case "balance_topup_canceled":
                return "Отмена пополнения";
              case "charge_payment":
                return "Оплата зарядки";
              case "charge_refund":
                return "Возврат за зарядку";
              default:
                return `Транзакция ${type}`;
            }
          };

          // Маппим payment_method из API к допустимым значениям
          const mapPaymentMethod = (
            method: string | null,
          ): "qr_namba" | "qr_odengi" | "card_obank" | "token" | "admin" | undefined => {
            if (!method) return undefined;
            const normalizedMethod = method.toLowerCase();
            if (
              normalizedMethod === "namba" ||
              normalizedMethod === "qr_namba"
            )
              return "qr_namba";
            if (
              normalizedMethod === "odengi" ||
              normalizedMethod === "qr_odengi"
            )
              return "qr_namba"; // legacy → Namba One
            if (
              normalizedMethod === "obank" ||
              normalizedMethod === "card_obank"
            )
              return "card_obank";
            if (normalizedMethod === "token") return "token";
            if (normalizedMethod === "admin") return "admin";
            return undefined;
          };

          return {
            id: tx.id.toString(),
            type,
            amount: parseAmount(tx.amount),
            balance_before: parseAmount(tx.balance_before),
            balance_after: parseAmount(tx.balance_after),
            timestamp: tx.created_at || new Date().toISOString(),
            description: getDescription(tx.transaction_type),
            status,
            sessionId: undefined, // API не возвращает charging_session_id
            paymentMethod: mapPaymentMethod(tx.payment_method ?? null),
          };
        });
      } catch (error) {
        logger.error(
          "[useTransactionHistory] Failed to fetch transaction history",
          { limit, error },
        );
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Хук для получения статистики использования
export const useUsageStatistics = () => {
  return useQuery({
    queryKey: ["usage-statistics"],
    queryFn: async (): Promise<UsageStatistics> => {
      try {
        // Получаем историю зарядок для расчета статистики
        const chargingHistory = await rpApi.getChargingHistory(100);

        if (!chargingHistory || chargingHistory.length === 0) {
          return {
            totalSessions: 0,
            totalEnergy: 0,
            totalCost: 0,
            totalDuration: 0,
            averageSessionEnergy: 0,
            averageSessionCost: 0,
            averageSessionDuration: 0,
            monthlyData: [],
          };
        }

        // Optimized: Single-pass calculation instead of 5 separate reduce operations
        // Combines: totalEnergy, totalCost, totalDuration, stationCounts, monthlyGroups
        const stats = chargingHistory.reduce(
          (acc, session: ChargingSessionData) => {
            // Total energy and cost
            acc.totalEnergy += session.energy || 0;
            acc.totalCost += session.amount || 0;

            // Total duration (calculate from created_at and ended_at)
            if (session.created_at && session.ended_at) {
              const duration =
                (new Date(session.ended_at).getTime() -
                  new Date(session.created_at).getTime()) /
                1000 /
                60;
              acc.totalDuration += duration;
            }

            // Station counts for favorite station
            const stationId = session.station_id || "unknown";
            if (!acc.stationCounts[stationId]) {
              acc.stationCounts[stationId] = {
                id: stationId,
                name: session.stations?.locations?.name || "Станция",
                count: 0,
              };
            }
            acc.stationCounts[stationId].count++;

            // Monthly groups
            const date = new Date(session.created_at || new Date());
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const monthName = date.toLocaleDateString("ru-RU", {
              month: "long",
              year: "numeric",
            });

            if (!acc.monthlyGroups[monthKey]) {
              acc.monthlyGroups[monthKey] = {
                month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                sessions: 0,
                energy: 0,
                cost: 0,
              };
            }

            acc.monthlyGroups[monthKey].sessions++;
            acc.monthlyGroups[monthKey].energy += session.energy || 0;
            acc.monthlyGroups[monthKey].cost += session.amount || 0;

            return acc;
          },
          {
            totalEnergy: 0,
            totalCost: 0,
            totalDuration: 0,
            stationCounts: {} as StationCounts,
            monthlyGroups: {} as MonthlyGroups,
          },
        );

        const {
          totalEnergy,
          totalCost,
          totalDuration,
          stationCounts,
          monthlyGroups,
        } = stats;

        // Find favorite station
        const stationValues = Object.values(stationCounts) as Array<{
          id: string;
          name: string;
          count: number;
        }>;
        const favoriteStation: {
          id: string;
          name: string;
          count: number;
        } | null =
          stationValues.length > 0
            ? stationValues.reduce((max, station) =>
                station.count > max.count ? station : max,
              )
            : null;

        const monthlyData = Object.values(monthlyGroups).reverse().slice(0, 6);

        return {
          totalSessions: chargingHistory.length,
          totalEnergy,
          totalCost,
          totalDuration,
          averageSessionEnergy:
            chargingHistory.length > 0
              ? totalEnergy / chargingHistory.length
              : 0,
          averageSessionCost:
            chargingHistory.length > 0 ? totalCost / chargingHistory.length : 0,
          averageSessionDuration:
            chargingHistory.length > 0
              ? totalDuration / chargingHistory.length
              : 0,
          favoriteStation: favoriteStation
            ? {
                id: favoriteStation.id,
                name: favoriteStation.name,
                visitsCount: favoriteStation.count,
              }
            : undefined,
          monthlyData: monthlyData as Array<{
            month: string;
            sessions: number;
            energy: number;
            cost: number;
          }>,
        };
      } catch (error) {
        logger.error("[useUsageStatistics] Failed to fetch usage statistics", {
          error,
        });
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 минут
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
