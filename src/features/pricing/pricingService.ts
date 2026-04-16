import { fetchJson } from "@/api/unifiedClient";
import { z } from "zod";
import {
  DEFAULT_CURRENCY,
  DEFAULT_RATE_PER_KWH,
  CACHE_TTL,
  type PricingResult,
  type SessionCostBreakdown,
  type CachedPricing,
} from "./types";
import { logger } from "../../shared/utils/logger";

// Zod-схема ответа backend GET /api/v1/station/tariff/{station_id}
const StationTariffResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    station_id: z.string(),
    tariff_plan: z.string().nullable(),
    current_rate: z.number(),
    current_period: z.string(),
    next_change_at: z.string().nullable(),
    next_rate: z.number().nullable(),
    currency: z.string(),
    schedule: z.array(
      z.object({
        name: z.string(),
        time: z.string(),
        rate: z.number(),
        tariff_type: z.string(),
        connector_type: z.string(),
      }),
    ),
  }),
});

class PricingService {
  private cache = new Map<string, CachedPricing>();

  /**
   * Рассчитывает текущий тариф для станции через backend API.
   * При ошибке — fallback на getDefaultPricing().
   */
  async calculatePricing(
    stationId: string,
    _connectorType?: string,
    _clientId?: string,
    _powerKw?: number,
  ): Promise<PricingResult> {
    // Проверяем in-memory кэш (5 мин TTL)
    const cached = this.cache.get(stationId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      const response = await fetchJson(
        `/api/v1/station/tariff/${stationId}`,
        { method: "GET", timeoutMs: 5000, retries: 1 },
        StationTariffResponseSchema,
      );

      if (!response.success) {
        return this.getDefaultPricing();
      }

      const { data } = response;

      // Маппинг backend → PricingResult
      const nextChange = data.next_change_at
        ? this.parseTimeToDate(data.next_change_at)
        : null;

      const pricing: PricingResult = {
        rate_per_kwh: data.current_rate,
        rate_per_minute: 0,
        session_fee: 0,
        parking_fee_per_minute: 0,
        currency: data.currency || DEFAULT_CURRENCY,
        active_rule: data.current_period,
        rule_details: {
          type: "backend_tariff",
          tariff_plan: data.tariff_plan,
          schedule: data.schedule,
        },
        time_based: data.next_change_at !== null,
        next_rate_change: nextChange,
      };

      // Кэшируем результат
      this.cache.set(stationId, {
        stationId,
        data: pricing,
        timestamp: Date.now(),
      });

      return pricing;
    } catch (error) {
      logger.error("[PricingService] Error fetching tariff from API:", error);
      return this.getDefaultPricing();
    }
  }

  /**
   * Парсит строку времени "HH:MM" в ближайшую будущую Date
   */
  private parseTimeToDate(timeStr: string): Date | null {
    const parts = timeStr.split(":");
    if (parts.length < 2) return null;

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (isNaN(hours) || isNaN(minutes)) return null;

    const now = new Date();
    const nextChange = new Date(now);
    nextChange.setHours(hours, minutes, 0, 0);

    // Если время уже прошло сегодня, переносим на завтра
    if (nextChange <= now) {
      nextChange.setDate(nextChange.getDate() + 1);
    }

    return nextChange;
  }

  /**
   * Возвращает дефолтный тариф (fallback при недоступности API)
   */
  private getDefaultPricing(): PricingResult {
    return {
      rate_per_kwh: DEFAULT_RATE_PER_KWH,
      rate_per_minute: 0,
      session_fee: 0,
      parking_fee_per_minute: 0,
      currency: DEFAULT_CURRENCY,
      active_rule: "Базовый тариф",
      rule_details: { type: "default" },
      time_based: false,
      next_rate_change: null,
    };
  }

  /**
   * Рассчитывает стоимость сессии
   */
  calculateSessionCost(
    energyKwh: number,
    durationMinutes: number,
    pricing: PricingResult,
  ): SessionCostBreakdown {
    const breakdown: SessionCostBreakdown = {
      energy_cost: 0,
      time_cost: 0,
      session_fee: 0,
      parking_fee: 0,
      base_amount: 0,
      discount_amount: 0,
      final_amount: 0,
      currency: pricing.currency,
    };

    // Расчет по энергии
    if (pricing.rate_per_kwh > 0) {
      breakdown.energy_cost = energyKwh * pricing.rate_per_kwh;
    }

    // Расчет по времени
    if (pricing.rate_per_minute > 0) {
      breakdown.time_cost = durationMinutes * pricing.rate_per_minute;
    }

    // Фиксированная плата за сессию
    if (pricing.session_fee > 0) {
      breakdown.session_fee = pricing.session_fee;
    }

    // Плата за парковку (если есть)
    if (pricing.parking_fee_per_minute > 0) {
      breakdown.parking_fee = durationMinutes * pricing.parking_fee_per_minute;
    }

    // Итоги
    breakdown.base_amount =
      breakdown.energy_cost +
      breakdown.time_cost +
      breakdown.session_fee +
      breakdown.parking_fee;

    breakdown.final_amount = breakdown.base_amount - breakdown.discount_amount;

    return breakdown;
  }

  /**
   * Получает тарифы на день для станции
   */
  async getDayPricingSchedule(
    stationId: string,
    _connectorType?: string,
    _clientId?: string,
  ): Promise<Array<{ time: string; label: string; rate: number }>> {
    // Пробуем получить расписание из API (оно уже в кэше после calculatePricing)
    try {
      const pricing = await this.calculatePricing(stationId);
      const schedule = (pricing.rule_details as Record<string, unknown>)?.["schedule"] as
        | Array<{ name: string; time: string; rate: number }>
        | undefined;

      if (schedule && schedule.length > 0) {
        return schedule.map((item) => ({
          time: item.time.split("-")[0] || item.time,
          label: item.name,
          rate: item.rate,
        }));
      }
    } catch {
      // fallback ниже
    }

    // Fallback: единый тариф на весь день
    return [
      {
        time: "00:00",
        label: "Базовый тариф",
        rate: DEFAULT_RATE_PER_KWH,
      },
    ];
  }

  /**
   * Очищает кэш
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const pricingService = new PricingService();
