import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
// ConfirmDialog убран - по Voltera прямой вызов stopCharging без подтверждения
import { useCharging } from "../features/charging/hooks/useCharging";
import {
  useChargingStatusPolling,
  ChargingStates,
} from "../features/charging/hooks/useChargingStatusPolling";
import { PricingBreakdown } from "../features/pricing/components/PricingBreakdown";
import { pricingService } from "../features/pricing/pricingService";
import type { PricingResult } from "../features/pricing/types";
import { useUnifiedAuthStore as useAuthStore } from "../features/auth/unifiedAuthStore";
import { useToast } from "../shared/hooks/useToast";
import { logAndHandleError } from "../shared/utils/errorHandling";
import { NotificationService } from "@/shared/utils/notifications";
import { logger } from "@/shared/utils/logger";
import { rpApi } from "@/services/rpApi";
import { HelpTip } from "@/shared/components/HelpTip";
// SwipeToStop заменён на обычную кнопку остановки

export const ChargingProcessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams();
  const localSessionId = sessionId || "";

  // Получаем stationId из разных источников (по приоритету)
  // 1. Из state (при навигации)
  // 2. Из localStorage (сохраняется при старте)
  // 3. Будет получено из API при первом polling
  const initialStationId =
    location.state?.stationId ||
    localStorage.getItem("activeChargingStationId") ||
    "";
  const [stationId, setStationId] = useState(initialStationId);

  // States for new UI features
  const [stopConfirmStep, setStopConfirmStep] = useState(0);
  const [prevPower, setPrevPower] = useState(0);
  const [powerTrend, setPowerTrend] = useState<'up' | 'down' | 'stable'>('stable');

  const chargingLimits = location.state?.chargingLimits;
  const [currentPricing, setCurrentPricing] = useState<PricingResult | null>(
    null,
  );
  // showStopConfirm убран - по Voltera прямой вызов без диалога
  const { user } = useAuthStore();
  const toast = useToast();

  // Hooks
  const { stopCharging, isStoppingCharging } = useCharging();

  // Проверяем валидность сессии при загрузке (по Voltera)
  useEffect(() => {
    if (!localSessionId) {
      // Нет sessionId — редирект на главную
      navigate("/", { replace: true });
      return;
    }

    // Если нет stationId — получаем из первого запроса API
    // Это происходит при перезагрузке страницы (state теряется)
    if (!stationId) {
      rpApi
        .getChargingStatus(localSessionId)
        .then((response) => {
          if (response.success && response.session?.station_id) {
            setStationId(response.session.station_id);
            localStorage.setItem(
              "activeChargingStationId",
              response.session.station_id,
            );
          } else {
            // Сессия не найдена - очищаем localStorage и редирект
            localStorage.removeItem("activeChargingSession");
            localStorage.removeItem("activeChargingStationId");
            navigate("/", { replace: true });
          }
        })
        .catch(() => {
          // Ошибка (404, 500) — очищаем localStorage и редирект
          localStorage.removeItem("activeChargingSession");
          localStorage.removeItem("activeChargingStationId");
          navigate("/", { replace: true });
        });
    }
  }, [localSessionId, stationId, navigate]);

  // HTTP polling каждые 5 секунд (по Voltera)
  const { chargingData, isLoading, error, isPolling } =
    useChargingStatusPolling(localSessionId, {
      initialStationId: stationId || undefined,
      onStatusChange: () => {
        // Status changes are handled internally
      },
      onComplete: (data) => {
        // Отправляем уведомление о завершении зарядки
        NotificationService.notifyChargingComplete(
          data.stationId,
          data.energyConsumedKwh,
          data.currentAmount,
        ).catch((error) => {
          logger.warn(
            "[ChargingProcessPage] Failed to show completion notification:",
            error,
          );
        });

        // Сохраняем финальные данные для страницы завершения
        sessionStorage.setItem("lastChargingData", JSON.stringify(data));
        setTimeout(() => {
          navigate(`/charging-complete/${localSessionId}`);
        }, 2000);
      },
      onError: (_err) => {
        // Логируем только если это не начальная ошибка связывания
        // console.error('Polling error:', _err);
      },
    });

  // Загружаем тариф для станции
  useEffect(() => {
    const loadPricing = async () => {
      try {
        const pricing = await pricingService.calculatePricing(
          stationId,
          undefined,
          user?.id,
        );
        setCurrentPricing(pricing);
      } catch (error) {
        const handled = logAndHandleError(
          error,
          "ChargingProcessPage.loadPricing",
        );
        toast.error(handled.message);
      }
    };

    loadPricing();
  }, [stationId, user?.id, toast]);

  // Синхронизируем тариф: бэкенд возвращает актуальный rate_per_kwh (с ночной скидкой)
  useEffect(() => {
    if (chargingData?.ratePerKwh && currentPricing && currentPricing.rate_per_kwh !== chargingData.ratePerKwh) {
      setCurrentPricing(prev => prev ? { ...prev, rate_per_kwh: chargingData.ratePerKwh! } : prev);
    }
  }, [chargingData?.ratePerKwh, currentPricing]);

  // Track Power Trend
  useEffect(() => {
    if (chargingData?.chargingPower !== undefined) {
      if (chargingData.chargingPower > prevPower + 0.5) setPowerTrend('up');
      else if (chargingData.chargingPower < prevPower - 0.5) setPowerTrend('down');
      else setPowerTrend('stable');
      setPrevPower(chargingData.chargingPower);
    }
  }, [chargingData?.chargingPower]);

  // Расчет прогресса
  const calculateProgress = () => {
    if (!chargingData) return 0;

    // Если есть прогресс от backend
    if (chargingData.progressPercent !== undefined) {
      return chargingData.progressPercent;
    }

    // Иначе рассчитываем сами
    if (chargingData.limitType === "energy" && chargingData.limitValue) {
      return Math.min(
        (chargingData.energyConsumedKwh / chargingData.limitValue) * 100,
        100,
      );
    }

    // По умолчанию считаем что цель 10 кВт·ч
    return Math.min((chargingData.energyConsumedKwh / 10) * 100, 100);
  };

  // Форматирование времени с секундами
  const formatTimeWithSeconds = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ETA Calculation
  const getEtaMinutes = () => {
    if (!chargingData?.chargingPower || chargingData.chargingPower <= 0) return null;
    let remainingEnergy = 0;
    if (chargingData.limitType === 'energy' && chargingData.limitValue) {
      remainingEnergy = chargingData.limitValue - chargingData.energyConsumedKwh;
    } else if (chargingData.limitType === 'amount' && chargingData.limitValue && currentPricing) {
      const pricePerKwh = Number(currentPricing.rate_per_kwh) || 0;
      if (pricePerKwh > 0) {
        remainingEnergy = (chargingData.limitValue - chargingData.currentAmount) / pricePerKwh;
      }
    } else if (chargingData.evBatterySoc !== undefined && chargingData.evBatterySoc < 100) {
      // Very rough estimate if we only know SOC and power... assuming ~40kWh battery pack size just to show something
      const remainingSoc = 100 - chargingData.evBatterySoc;
      remainingEnergy = (remainingSoc / 100) * 40;
    }

    if (remainingEnergy > 0) {
      return (remainingEnergy / chargingData.chargingPower) * 60; // hours -> mins
    }
    return null;
  };

  // Остановка зарядки с подтверждением
  const handleStopClick = async () => {
    if (!localSessionId || isStoppingCharging) return;

    // Первый клик — показываем "Подтвердить?"
    if (stopConfirmStep === 0) {
      setStopConfirmStep(1);
      setTimeout(() => setStopConfirmStep(0), 5000);
      return;
    }

    // Второй клик — останавливаем
    setStopConfirmStep(0);
    const result = await stopCharging(localSessionId);

    if (result.success) {
      if (chargingData) {
        sessionStorage.setItem(
          "lastChargingData",
          JSON.stringify(chargingData),
        );
      }
      if (result.data) {
        sessionStorage.setItem(
          "chargingStopResult",
          JSON.stringify(result.data),
        );
      }
      toast.success("Зарядка успешно остановлена");
      navigate(`/charging-complete/${localSessionId}`, { replace: true });
    } else {
      toast.error(result.message || "Не удалось остановить зарядку");
    }
  };

  // Обработка завершения уже в хуке через onComplete

  // SVG gauge constants
  const gaugeRadius = 42;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0E17] flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto spinner" style={{ width: 48, height: 48, borderWidth: 3 }} />
          <p className="mt-4 text-zinc-500 dark:text-zinc-400">Загружаем данные зарядки...</p>
        </div>
      </div>
    );
  }

  // Ошибка загрузки данных
  if (error && !chargingData) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0E17] flex items-center justify-center transition-colors duration-300">
        <div className="text-center px-6">
          <Icon icon="solar:wi-fi-router-minimalistic-linear" className="w-16 h-16 text-orange-500 mx-auto" />
          <p className="mt-4 text-xl text-zinc-800 dark:text-zinc-100">Ошибка получения данных</p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{error.message}</p>
          <button
            onClick={() => navigate("/stations")}
            className="mt-6 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold"
          >
            К станциям
          </button>
        </div>
      </div>
    );
  }

  // Нет данных
  if (!chargingData && !isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0E17] flex items-center justify-center transition-colors duration-300">
        <div className="text-center px-6">
          <Icon icon="solar:close-circle-linear" className="w-16 h-16 text-red-500 mx-auto" />
          <p className="mt-4 text-xl text-zinc-800 dark:text-zinc-100">
            Сессия зарядки не найдена
          </p>
          <button
            onClick={() => navigate("/stations")}
            className="mt-6 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold"
          >
            К станциям
          </button>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();
  const progressOffset = gaugeCircumference * (1 - progress / 100);

  // Показываем кнопку остановки для всех статусов КРОМЕ финальных
  const isCharging =
    chargingData?.status !== ChargingStates.STOPPED &&
    chargingData?.status !== ChargingStates.COMPLETED &&
    chargingData?.status !== ChargingStates.ERROR;

  const displayPercent =
    chargingData?.evBatterySoc !== undefined
      ? Math.round(chargingData.evBatterySoc)
      : Math.round(progress);

  const etaMinutes = getEtaMinutes();

  const statusLabel =
    chargingData?.status === ChargingStates.STARTED ||
      chargingData?.status === ChargingStates.CHARGING
      ? "Зарядка идет..."
      : chargingData?.status === ChargingStates.PREPARING
        ? "Подготовка..."
        : chargingData?.status === ChargingStates.FINISHING
          ? "Завершение..."
          : chargingData?.status === ChargingStates.STOPPED ||
            chargingData?.status === ChargingStates.COMPLETED
            ? "Завершено"
            : chargingData?.status === ChargingStates.ERROR
              ? "Ошибка"
              : "Ожидание...";

  return (
    <div className="bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 h-screen w-full flex flex-col relative overflow-hidden select-none transition-colors duration-300">

      {/* Global Energy Beams Background */}
      {isCharging && (
        <div className="fixed inset-0 z-0 flex justify-center overflow-hidden pointer-events-none opacity-60 dark:opacity-100">
          <div className="w-72 h-full relative beams-mask">
            <div className="energy-beam w-[2px] h-[35vh]" style={{ left: "15%", animation: "rise-up-long 3.5s infinite linear", animationDelay: "0.2s" }} />
            <div className="energy-beam w-[3px] h-[50vh]" style={{ left: "35%", animation: "rise-up-long 4.5s infinite linear", animationDelay: "2.1s" }} />
            <div className="energy-beam w-[4px] h-[65vh]" style={{ left: "50%", transform: "translateX(-50%)", animation: "rise-up-long 4s infinite linear", animationDelay: "1s" }} />
            <div className="energy-beam w-[3px] h-[45vh]" style={{ left: "65%", animation: "rise-up-long 5s infinite linear", animationDelay: "3.2s" }} />
            <div className="energy-beam w-[2px] h-[40vh]" style={{ left: "85%", animation: "rise-up-long 3.8s infinite linear", animationDelay: "1.5s" }} />
            <div className="energy-beam w-[1px] h-[25vh]" style={{ left: "42%", animation: "rise-up-long 2.5s infinite linear", animationDelay: "0.5s" }} />
            <div className="energy-beam w-[1px] h-[30vh]" style={{ left: "58%", animation: "rise-up-long 2.8s infinite linear", animationDelay: "1.8s" }} />
          </div>
        </div>
      )}

      {/* Header Navigation */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between bg-white/80 dark:bg-[#0A0E17]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5 z-20 shrink-0 relative transition-colors duration-300">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all shadow-sm dark:shadow-none"
        >
          <Icon icon="solar:arrow-left-linear" width={24} />
        </button>
        <h1 className="text-lg font-bold font-display tracking-tight text-zinc-900 dark:text-white">Сессия</h1>
        <div className="w-10 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
          <Icon icon="solar:settings-linear" width={24} />
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto hide-scroll p-4 pb-32 flex flex-col items-center relative z-10">

        {/* Gauge Section */}
        <div className="relative w-full max-w-xs aspect-square flex items-center justify-center my-6">

          {/* Background Ripple Effects */}
          {isCharging && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 rounded-full border border-red-600/20 ripple-circle" />
              <div className="w-48 h-48 rounded-full border border-red-600/10 ripple-circle" style={{ animationDelay: "1s" }} />
            </div>
          )}

          {/* SVG Gauge */}
          <svg className="w-72 h-72 neon-svg z-10" viewBox="0 0 100 100">
            {/* Track */}
            <circle
              className="text-zinc-200 dark:text-zinc-800/50"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
              r={gaugeRadius}
              cx="50"
              cy="50"
            />
            {/* Progress */}
            <circle
              className="text-red-600 progress-ring__circle"
              strokeWidth="6"
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={gaugeRadius}
              cx="50"
              cy="50"
              strokeDasharray={gaugeCircumference}
              strokeDashoffset={progressOffset}
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="flex items-baseline gap-1">
              <span className="text-6xl font-bold font-display tracking-tighter text-zinc-900 dark:text-white dark:drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                {displayPercent}
              </span>
              <span className="text-2xl font-medium text-red-500/80">%</span>
            </div>
            {/* Status Badge */}
            <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
              </span>
              <span className="text-xs font-medium text-red-600 dark:text-red-100 tracking-wide uppercase">
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Data Grid */}
        <div className="w-full grid grid-cols-2 gap-3 mt-4 relative z-10">

          {/* Energy */}
          <div className="bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-3 backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <Icon icon="solar:bolt-circle-linear" width={18} />
              <span className="text-xs font-medium flex items-center gap-1">
                Энергия
                <HelpTip text="Количество энергии, которое фактически попало в батарею вашего автомобиля." />
              </span>
            </div>
            <div className="text-xl font-semibold text-zinc-900 dark:text-white font-display tracking-tight">
              {(chargingData?.energyConsumedKwh || 0).toFixed(2)}{" "}
              <span className="text-sm font-medium text-zinc-500 ml-0.5">
                кВтч
                {chargingLimits?.type === "energy" &&
                  chargingLimits.energy_kwh && (
                    <span className="text-zinc-400 dark:text-zinc-600">
                      {" "}/ {chargingLimits.energy_kwh}
                    </span>
                  )}
              </span>
            </div>
          </div>

          {/* Time */}
          <div className="bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-3 backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <Icon icon="solar:clock-circle-linear" width={18} />
              <span className="text-xs font-medium">Время</span>
            </div>
            <div className="text-xl font-semibold text-zinc-900 dark:text-white font-display tracking-tight">
              {formatTimeWithSeconds(chargingData?.duration || 0)}
            </div>
          </div>

          {/* Power */}
          <div className="bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-3 backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                <Icon icon="solar:lightning-linear" width={18} />
                <span className="text-xs font-medium">Мощность</span>
              </div>
              {powerTrend === 'up' && <Icon icon="solar:double-alt-arrow-up-linear" className="text-green-500" width={16} />}
              {powerTrend === 'down' && <Icon icon="solar:double-alt-arrow-down-linear" className="text-orange-500" width={16} />}
              {powerTrend === 'stable' && <Icon icon="solar:arrow-right-linear" className="text-zinc-400" width={14} />}
            </div>
            <div className="text-xl font-semibold text-zinc-900 dark:text-white font-display tracking-tight">
              {(chargingData?.chargingPower || 0).toFixed(1)}{" "}
              <span className="text-sm font-medium text-zinc-500 ml-0.5">кВт</span>
            </div>
          </div>

          {/* Cost */}
          <div className="bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-3 backdrop-blur-sm shadow-sm dark:shadow-none relative overflow-hidden transition-colors duration-300">
            {/* Subtle gradient hint */}
            <div className="absolute -right-4 -top-4 w-12 h-12 bg-red-500/10 blur-xl rounded-full" />
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <Icon icon="solar:wallet-money-linear" width={18} />
              <span className="text-xs font-medium">Стоимость</span>
            </div>
            <div className="text-xl font-semibold text-zinc-900 dark:text-white font-display tracking-tight">
              {(chargingData?.currentAmount || 0).toFixed(2)}{" "}
              <span className="text-sm font-medium text-zinc-500 ml-0.5">
                сом
                {chargingLimits?.type === "amount" &&
                  chargingLimits.amount_som && (
                    <span className="text-zinc-400 dark:text-zinc-600">
                      {" "}/ {chargingLimits.amount_som}
                    </span>
                  )}
              </span>
            </div>
          </div>

        </div>

        {/* Pricing Breakdown */}
        {currentPricing && chargingData && (
          <div className="w-full mt-4 relative z-10">
            <PricingBreakdown
              energyKwh={chargingData.energyConsumedKwh}
              durationMinutes={Math.floor(chargingData.duration / 60)}
              pricing={currentPricing}
              compact={true}
            />
          </div>
        )}

        {/* Charging Limits Info */}
        {chargingLimits && (
          <div className="w-full mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-500/10 relative z-10 transition-colors duration-300">
            <div className="flex items-center gap-2 text-sm text-red-600/70 dark:text-red-200/70">
              <span className="font-medium">Тип зарядки:</span>
              <span>
                {chargingLimits.type === "none" && "Полный бак"}
                {chargingLimits.type === "amount" &&
                  `Лимит ${chargingLimits.amount_som} сом`}
                {chargingLimits.type === "energy" &&
                  `Лимит ${chargingLimits.energy_kwh} кВт\u00B7ч`}
              </span>
            </div>
            {chargingLimits.type !== "none" && (
              <div className="text-xs text-red-400/60 dark:text-red-300/40 mt-1">
                Зарядка остановится автоматически при достижении лимита
              </div>
            )}
          </div>
        )}

        {/* Real-time updates / ETA */}
        <div className="flex flex-col items-center justify-center gap-3 mt-5 relative z-10 w-full">
          {etaMinutes != null && etaMinutes > 0 && chargingData?.status === ChargingStates.CHARGING && (
            <div className="bg-white/80 dark:bg-zinc-900/50 px-4 py-2 rounded-xl text-sm font-medium text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 shadow-sm">
              <Icon icon="solar:history-linear" className="text-blue-500" width={18} />
              Осталось ~{Math.round(etaMinutes)} мин.
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${chargingData?.stationOnline ? "bg-green-500" : "bg-yellow-500"
                }`}
            />
            <span>
              {isPolling ? "Обновление каждые 5 секунд" : "Ожидание данных..."}
              {!chargingData?.stationOnline && " (станция офлайн)"}
            </span>
          </div>
        </div>

        {/* Completion Message */}
        {chargingData?.status === ChargingStates.COMPLETED && (
          <div className="w-full mt-4 bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center relative z-10">
            <p className="text-green-400 font-semibold">Зарядка завершена!</p>
            <p className="text-sm text-green-600 mt-1">Перенаправление...</p>
          </div>
        )}
      </div>

      {/* Sticky Bottom — Stop Button */}
      {isCharging && (
        <div className="absolute bottom-0 inset-x-0 bg-white/90 dark:bg-[#0A0E17]/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 p-5 pb-8 z-30 transition-colors duration-300"
          style={{ paddingBottom: "calc(var(--nav-height, 0px) + env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
        >
          <button
            onClick={handleStopClick}
            disabled={isStoppingCharging}
            className={`w-full h-[56px] rounded-2xl font-semibold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
              isStoppingCharging
                ? "bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                : stopConfirmStep === 1
                  ? "bg-red-700 text-white shadow-lg shadow-red-600/30 animate-pulse"
                  : "bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700"
            }`}
          >
            {isStoppingCharging ? (
              <>
                <Icon icon="solar:stop-circle-bold" width={22} className="animate-spin" />
                Останавливаем...
              </>
            ) : stopConfirmStep === 1 ? (
              <>
                <Icon icon="solar:danger-triangle-bold" width={22} />
                Нажмите ещё раз для подтверждения
              </>
            ) : (
              <>
                <Icon icon="solar:stop-circle-bold" width={22} />
                Остановить зарядку
              </>
            )}
          </button>
        </div>
      )}

      {/* ConfirmDialog убран - по Voltera прямой вызов без подтверждения */}
    </div>
  );
};
