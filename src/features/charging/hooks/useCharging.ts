import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rpApi } from "@/services/rpApi";
import type {
  StartChargingResponse,
  ChargingStatus,
  StopChargingResponse,
} from "@/api/types";
import { parseConnectorId } from "../../../shared/utils/parsers";
import { logger } from "@/shared/utils/logger";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";

// Состояния сессии зарядки (синхронизировано с backend)
export const ChargingSessionStatus = {
  PREPARING: "preparing" as const, // Подготовка к началу зарядки
  STARTING: "starting" as const, // Запуск зарядки в процессе
  CHARGING: "charging" as const, // Активная зарядка
  STOPPING: "stopping" as const, // Остановка зарядки в процессе
  STOPPED: "stopped" as const, // Зарядка остановлена
  FINISHED: "finished" as const, // Зарядка завершена успешно
  FAULTED: "faulted" as const, // Ошибка зарядки
  SYNCING: "syncing" as const, // Синхронизация с OCPP станцией
} as const;

// Состояния станции OCPP (из стандарта)
export const OCPPConnectorStatus = {
  AVAILABLE: "Available" as const,
  PREPARING: "Preparing" as const,
  CHARGING: "Charging" as const,
  SUSPENDED_EVSE: "SuspendedEVSE" as const,
  SUSPENDED_EV: "SuspendedEV" as const,
  FINISHING: "Finishing" as const,
  RESERVED: "Reserved" as const,
  UNAVAILABLE: "Unavailable" as const,
  FAULTED: "Faulted" as const,
} as const;

export type ChargingSessionStatusType =
  (typeof ChargingSessionStatus)[keyof typeof ChargingSessionStatus];
export type OCPPConnectorStatusType =
  (typeof OCPPConnectorStatus)[keyof typeof OCPPConnectorStatus];

// Start charging mutation
export const useStartCharging = () => {
  const queryClient = useQueryClient();

  return useMutation<
    StartChargingResponse,
    Error,
    {
      station_id: string;
      connector_id: number;
      energy_kwh?: number;
      amount_som?: number;
    }
  >({
    mutationFn: async (data) => {
      return await rpApi.startCharging(
        data.station_id,
        data.connector_id,
        {
          energy_kwh: data.energy_kwh,
          amount_som: data.amount_som,
        },
      );
    },
    onSuccess: () => {
      // Start polling charging status
      queryClient.invalidateQueries({ queryKey: ["charging-status"] });
    },
  });
};

// Stop charging mutation
export const useStopCharging = () => {
  const queryClient = useQueryClient();

  return useMutation<StopChargingResponse, Error, { session_id: string }>({
    mutationFn: async (data) => {
      return await rpApi.stopCharging(data.session_id);
    },
    onSuccess: () => {
      // Update charging status and balance
      queryClient.invalidateQueries({ queryKey: ["charging-status"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
};

// Get charging status with real-time updates
export const useChargingStatus = (sessionId?: string) => {
  return useQuery<ChargingStatus>({
    queryKey: ["charging-status", sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error("Session ID required");
      return await rpApi.getChargingStatus(sessionId);
    },
    enabled: !!sessionId,
    refetchInterval: (query) => {
      // Stop polling if session is finished
      const status = query.state.data?.session?.status;
      if (status === "stopped" || status === "error") {
        return false;
      }
      return 3000; // Update every 3 seconds during active charging
    },
    refetchIntervalInBackground: true,
  });
};

// Current charging session store (for active session tracking)
export const useChargingSession = (() => {
  let currentSessionId: string | null = null;
  const listeners: Set<() => void> = new Set();

  const notify = () => listeners.forEach((listener) => listener());

  return () => ({
    currentSessionId,
    setCurrentSession: (sessionId: string | null) => {
      currentSessionId = sessionId;
      notify();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });
})();

// Main unified charging hook
export const useCharging = () => {
  const startChargingMutation = useStartCharging();
  const stopChargingMutation = useStopCharging();

  const startCharging = async (data: {
    stationId: string;
    connectorId: string;
    energy_kwh?: number;
    amount_som?: number;
  }) => {
    try {
      // Demo mode: simulate charging start
      if (isDemoModeActive()) {
        const demoSessionId = `demo-session-${Date.now()}`;
        logger.debug("[useCharging] Demo mode: starting fake session", { demoSessionId });

        // Save demo session state
        localStorage.setItem("activeChargingSession", demoSessionId);
        localStorage.setItem("activeChargingStationId", data.stationId);
        sessionStorage.setItem("demo_charging_start", Date.now().toString());
        sessionStorage.setItem("demo_charging_station", data.stationId);

        return {
          success: true,
          sessionId: demoSessionId,
          message: "Демо: зарядка запущена",
        };
      }

      // Логируем параметры запуска зарядки для отладки
      logger.debug("[useCharging] Starting charging with params:", {
        stationId: data.stationId,
        connectorId: data.connectorId,
        energy_kwh: data.energy_kwh,
        amount_som: data.amount_som,
      });

      // Шаг 1: Проверяем доступность станции
      const stationStatus = await rpApi.getStationStatus(data.stationId);
      logger.debug("[useCharging] Station status:", {
        available: stationStatus.available_for_charging,
        connectors: stationStatus.connectors?.length,
      });

      // Проверяем доступность станции
      if (!stationStatus.available_for_charging) {
        return {
          success: false,
          sessionId: "",
          message: "Станция недоступна для зарядки",
        };
      }

      // Шаг 2: Запускаем зарядку (backend сам проверит активные сессии)
      const result = await startChargingMutation.mutateAsync({
        station_id: data.stationId,
        connector_id: parseConnectorId(data.connectorId),
        energy_kwh: data.energy_kwh,
        amount_som: data.amount_som,
      });

      // КРИТИЧЕСКИ ВАЖНО: проверяем success в ответе API
      if (result.success === false) {
        logger.error("[useCharging] Start charging failed:", {
          error: result.error,
          message: result.message,
        });
        return {
          success: false,
          sessionId: "",
          message: result.error || result.message || "Ошибка запуска зарядки",
        };
      }

      logger.debug("[useCharging] Charging started successfully:", {
        sessionId: result.session_id,
        message: result.message,
      });

      // Сохраняем sessionId для восстановления сессии после обновления страницы
      if (result.session_id) {
        // Сохраняем в localStorage (для быстрого доступа из UI)
        localStorage.setItem("activeChargingSession", result.session_id);
        localStorage.setItem("activeChargingStationId", data.stationId);

        // Также сохраняем в secureStorage (для persistence)
        const { secureStorage } = await import("@/lib/platform");
        await secureStorage.set("activeChargingSession", result.session_id);
      }

      return {
        success: true,
        sessionId: result.session_id || "",
        message: result.message || "Зарядка запущена успешно",
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      return {
        success: false,
        sessionId: "",
        message: err.message || "Сетевая ошибка запуска зарядки",
      };
    }
  };

  const stopCharging = async (sessionId: string) => {
    try {
      // Demo mode: simulate charging stop
      if (isDemoModeActive()) {
        logger.debug("[useCharging] Demo mode: stopping fake session", { sessionId });

        // Calculate demo session results
        const startTime = parseInt(sessionStorage.getItem("demo_charging_start") || "0");
        const elapsed = startTime ? (Date.now() - startTime) / 1000 : 120;
        const energy = Math.round(elapsed / 5 * 0.1 * 100) / 100; // ~0.1 kWh per 5 sec
        const amount = Math.round(energy * 12 * 100) / 100; // 12 сом/кВтч

        // Clean up
        localStorage.removeItem("activeChargingSession");
        localStorage.removeItem("activeChargingStationId");
        sessionStorage.removeItem("demo_charging_start");
        sessionStorage.removeItem("demo_charging_station");

        return {
          success: true,
          message: "Демо: зарядка остановлена",
          data: {
            success: true,
            message: "Демо: зарядка остановлена",
            session_id: sessionId,
            final_amount: amount,
            energy_kwh: energy,
            duration_seconds: Math.floor(elapsed),
            refund_amount: 0,
          },
        };
      }

      const result = await stopChargingMutation.mutateAsync({
        session_id: sessionId, // API требует session_id согласно документации
      });

      // Очищаем sessionId из storage при остановке
      localStorage.removeItem("activeChargingSession");
      localStorage.removeItem("activeChargingStationId");

      const { secureStorage } = await import("@/lib/platform");
      await secureStorage.remove("activeChargingSession");

      return {
        success: true,
        message: result.message || "Зарядка остановлена",
        data: result, // Возвращаем полный ответ с информацией о возврате
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      return {
        success: false,
        message: err.message || "Ошибка остановки зарядки",
        error: err.message,
      };
    }
  };

  return {
    startCharging,
    stopCharging,
    isStarting: startChargingMutation.isPending,
    isStoppingCharging: stopChargingMutation.isPending,
  };
};
