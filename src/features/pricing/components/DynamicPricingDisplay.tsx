import { useEffect, useState, useCallback, useMemo } from "react";
import { Icon } from "@iconify/react";
import { pricingService } from "../pricingService";
import { supabase } from "../../../shared/config/supabase";
import type { PricingResult } from "../types";
import { useUnifiedAuthStore as useAuthStore } from "../../auth/unifiedAuthStore";
import { safeParseInt } from "../../../shared/utils/parsers";
import { logger } from "../../../shared/utils/logger";

interface DynamicPricingDisplayProps {
  stationId: string;
  connectorType?: string;
  compact?: boolean;
}

export function DynamicPricingDisplay({
  stationId,
  connectorType,
  compact = false,
}: DynamicPricingDisplayProps) {
  const [currentPricing, setCurrentPricing] = useState<PricingResult | null>(
    null,
  );
  const [daySchedule, setDaySchedule] = useState<
    Array<{ time: string; label: string; rate: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextChangeIn, setNextChangeIn] = useState<string>("");
  const { user } = useAuthStore();

  const loadCurrentPricing = useCallback(async () => {
    try {
      setIsLoading(true);
      const pricing = await pricingService.calculatePricing(
        stationId,
        connectorType,
        user?.id,
      );
      setCurrentPricing(pricing);
    } catch (error) {
      logger.error("Error loading pricing:", error);
    } finally {
      setIsLoading(false);
    }
  }, [stationId, connectorType, user?.id]);

  const loadDaySchedule = useCallback(async () => {
    try {
      const schedule = await pricingService.getDayPricingSchedule(
        stationId,
        connectorType,
        user?.id,
      );
      setDaySchedule(schedule);
    } catch (error) {
      logger.error("Error loading day schedule:", error);
    }
  }, [stationId, connectorType, user?.id]);

  const updateNextChangeTimer = useCallback(() => {
    if (!currentPricing?.next_rate_change) {
      setNextChangeIn("");
      return;
    }

    const now = new Date();
    const next = new Date(currentPricing.next_rate_change);
    const diff = next.getTime() - now.getTime();

    if (diff <= 0) {
      loadCurrentPricing();
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Оптимизация: обновляем только когда меняется отображаемое значение
    // Если показываем часы - секунды не важны, если минуты - обновляем реже
    let newValue = "";
    if (hours > 0) {
      newValue = `${hours}ч ${minutes}м`;
    } else if (minutes > 0) {
      newValue = `${minutes}м ${seconds}с`;
    } else {
      newValue = `${seconds}с`;
    }

    // Обновляем state только если значение реально изменилось
    setNextChangeIn((prev) => (prev !== newValue ? newValue : prev));
  }, [currentPricing, loadCurrentPricing]);

  useEffect(() => {
    if (!stationId) return;

    // Загружаем текущий тариф
    loadCurrentPricing();

    // Загружаем расписание на день (только в полном режиме)
    if (!compact) {
      loadDaySchedule();
    }

    // Подписываемся на изменения тарифов в реальном времени
    const channel = supabase
      .channel(`pricing-${stationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tariff_rules",
        },
        () => {
          loadCurrentPricing();
          if (!compact) loadDaySchedule();
        },
      )
      .subscribe();

    // Обновляем каждые 5 минут (вместо каждой минуты - снижаем нагрузку)
    const interval = setInterval(() => {
      loadCurrentPricing();
    }, 300000); // 5 минут

    // Обновляем таймер каждые 5 секунд (оптимизация - уменьшает flickering)
    // Функция updateNextChangeTimer использует functional update чтобы избежать лишних re-renders
    const timerInterval = currentPricing?.next_rate_change
      ? setInterval(updateNextChangeTimer, 5000)
      : undefined;

    return () => {
      clearInterval(interval);
      if (timerInterval) clearInterval(timerInterval);
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId, connectorType, compact]);

  // Определяем тренд цены (memoized для предотвращения лишних вычислений)
  const getPriceTrend = useMemo(() => {
    if (!daySchedule.length || !currentPricing) return null;

    const currentHour = new Date().getHours();
    const nextSlot = daySchedule.find((s) => {
      const slotHour = safeParseInt(s.time.split(":")[0], 0);
      return slotHour > currentHour;
    });

    if (!nextSlot) return null;

    if (nextSlot.rate > currentPricing.rate_per_kwh) {
      return { type: "up", rate: nextSlot.rate, time: nextSlot.time };
    } else if (nextSlot.rate < currentPricing.rate_per_kwh) {
      return { type: "down", rate: nextSlot.rate, time: nextSlot.time };
    }

    return null;
  }, [daySchedule, currentPricing]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-zinc-700 rounded-lg"></div>
      </div>
    );
  }

  if (!currentPricing) {
    return null;
  }

  const trend = getPriceTrend;

  // Компактный режим для карточек станций
  if (compact) {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <Icon icon="solar:bolt-linear" width={16} className="text-yellow-500" />
          <span className="text-lg font-bold text-red-500">
            {currentPricing.rate_per_kwh} {currentPricing.currency}/кВт·ч
          </span>
        </div>
        {currentPricing.is_client_tariff && (
          <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-1 rounded-full">
            VIP
          </span>
        )}
      </div>
    );
  }

  // Полный режим для страницы зарядки
  return (
    <div className="space-y-4">
      {/* Текущий тариф */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">
              Текущий тариф
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-red-500">
                {currentPricing.rate_per_kwh}
              </span>
              <span className="text-lg text-gray-400">
                {currentPricing.currency}/кВт·ч
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {currentPricing.active_rule}
            </p>
          </div>

          {currentPricing.is_client_tariff && (
            <div className="bg-purple-500/15 text-purple-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Icon icon="solar:star-shine-linear" width={16} />
              Ваш специальный тариф
            </div>
          )}
        </div>

        {/* Дополнительные сборы */}
        {(currentPricing.session_fee > 0 ||
          currentPricing.rate_per_minute > 0) && (
          <div className="border-t border-zinc-700 pt-3 mt-3 space-y-1">
            {currentPricing.session_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Плата за сессию:</span>
                <span className="font-medium">
                  {currentPricing.session_fee} {currentPricing.currency}
                </span>
              </div>
            )}
            {currentPricing.rate_per_minute > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Поминутная тарификация:</span>
                <span className="font-medium">
                  {currentPricing.rate_per_minute} {currentPricing.currency}/мин
                </span>
              </div>
            )}
          </div>
        )}

        {/* Время до изменения тарифа */}
        {currentPricing.time_based && nextChangeIn && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-zinc-900/50 rounded-lg">
            <Icon icon="solar:clock-circle-linear" width={16} className="text-gray-500" />
            <span className="text-sm text-gray-400">
              Тариф изменится через: <strong>{nextChangeIn}</strong>
            </span>
          </div>
        )}

        {/* Тренд цены */}
        {trend && (
          <div
            className={`flex items-center gap-2 mt-3 p-2 rounded-lg ${
              trend.type === "up" ? "bg-orange-500/10" : "bg-green-500/10"
            }`}
          >
            {trend.type === "up" ? (
              <>
                <Icon icon="solar:graph-up-linear" width={16} className="text-orange-500" />
                <span className="text-sm text-orange-400">
                  Цена повысится до {trend.rate} {currentPricing.currency} в{" "}
                  {trend.time}
                </span>
              </>
            ) : (
              <>
                <Icon icon="solar:graph-down-linear" width={16} className="text-green-500" />
                <span className="text-sm text-green-400">
                  Цена снизится до {trend.rate} {currentPricing.currency} в{" "}
                  {trend.time}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Информация о динамических тарифах */}
      <div className="p-3 bg-blue-500/10 rounded-lg flex items-start gap-2">
        <Icon icon="solar:info-circle-linear" width={16} className="text-blue-500 mt-0.5" />
        <p className="text-sm text-blue-400">
          Тарифы могут изменяться в зависимости от времени суток и дня недели.
          Заряжайте в периоды низких цен для экономии!
        </p>
      </div>
    </div>
  );
}
