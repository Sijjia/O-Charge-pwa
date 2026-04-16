import { useEffect, useState, useRef, useCallback } from "react";
import { rpApi } from "@/services/rpApi";
import { logger } from "@/shared/utils/logger";
import { usePageVisibility } from "@/shared/hooks/usePageVisibility";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";
// Supabase Realtime НЕ используется для charging status (по примеру Voltera)
// Realtime подписка с неверными полями (energy_consumed вместо energy) затирала данные polling

// Состояния процесса зарядки (соответствуют статусам БД)
export const ChargingStates = {
  STARTED: "started", // Зарядка активна
  STOPPED: "stopped", // Зарядка остановлена
  ERROR: "error", // Ошибка зарядки
  // Дополнительные статусы для UI (не из БД)
  PREPARING: "preparing", // Подготовка (после RemoteStart)
  CHARGING: "charging", // Идет зарядка (алиас для started)
  SUSPENDED: "suspended", // Приостановлена
  FINISHING: "finishing", // Завершение
  COMPLETED: "completed", // Завершена (алиас для stopped)
} as const;

export type ChargingStatus =
  (typeof ChargingStates)[keyof typeof ChargingStates];

export interface ChargingData {
  sessionId: string;
  status: string; // Backend может вернуть любой статус, используем string для гибкости
  stationId: string;
  ocppTransactionId?: number;

  // Данные из MeterValues
  meterCurrent: number; // Wh - текущее значение счетчика
  meterStart: number; // Wh - начальное значение
  energyConsumedKwh: number; // кВт·ч - потребленная энергия

  // Расчетные данные
  currentAmount: number; // сом - текущая стоимость
  chargingPower?: number; // кВт - мощность зарядки
  duration: number; // секунды - длительность

  // Прогресс (если есть лимит)
  progressPercent?: number; // % - для лимитированной зарядки
  limitValue?: number; // кВт·ч или сом - установленный лимит
  limitType?: "energy" | "amount" | "none";

  // Данные электромобиля
  evBatterySoc?: number; // % - уровень заряда батареи EV (если доступно)

  // Тариф
  ratePerKwh?: number; // сом/кВт·ч - тариф из сессии (с учётом ночной скидки)

  // Статус станции
  stationOnline: boolean;

  // Timestamps (для страницы завершения)
  startTime?: string;
  endTime?: string;
}

interface UseChargingStatusPollingOptions {
  pollInterval?: number;
  onStatusChange?: (status: string) => void; // string для гибкости
  onError?: (error: Error) => void;
  onComplete?: (data: ChargingData) => void;
  initialStationId?: string; // Добавляем для передачи stationId из ChargingPage
}

const POLL_INTERVAL = 5000; // 5 секунд - быстрое обновление UI

export const useChargingStatusPolling = (
  sessionId: string | null,
  options: UseChargingStatusPollingOptions = {},
) => {
  const {
    pollInterval = POLL_INTERVAL,
    onStatusChange,
    onError,
    onComplete,
    initialStationId = "", // Пустая строка - stationId получим из API
  } = options;

  const isPageVisible = usePageVisibility();
  const [chargingData, setChargingData] = useState<ChargingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<string | null>(null); // string для гибкости
  const lastValidDataRef = useRef<ChargingData | null>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Сохраняем callbacks в ref чтобы избежать пересоздания эффекта
  const callbacksRef = useRef({ onStatusChange, onError, onComplete });
  useEffect(() => {
    callbacksRef.current = { onStatusChange, onError, onComplete };
  }, [onStatusChange, onError, onComplete]);

  // Основной эффект для polling
  useEffect(() => {
    if (!sessionId) return;

    // Demo mode: simulate charging data locally without API calls
    if (isDemoModeActive()) {
      const demoStartTime = parseInt(sessionStorage.getItem("demo_charging_start") || String(Date.now()));
      const demoStation = sessionStorage.getItem("demo_charging_station") || initialStationId || "demo-st";
      const DEMO_TARIFF = 12; // сом/кВтч
      const DEMO_POWER = 22; // кВт (AC charger)

      setIsLoading(false);

      const demoPoll = () => {
        const elapsed = (Date.now() - demoStartTime) / 1000; // seconds
        const energyKwh = Math.round((DEMO_POWER * (elapsed / 3600)) * 100) / 100;
        const amount = Math.round(energyKwh * DEMO_TARIFF * 100) / 100;
        const durationSec = Math.floor(elapsed);

        const data: ChargingData = {
          sessionId,
          status: ChargingStates.CHARGING,
          stationId: demoStation,
          meterCurrent: energyKwh * 1000,
          meterStart: 0,
          energyConsumedKwh: energyKwh,
          currentAmount: amount,
          chargingPower: DEMO_POWER * (0.85 + Math.random() * 0.15),
          duration: durationSec,
          stationOnline: true,
          startTime: new Date(demoStartTime).toISOString(),
        };

        lastValidDataRef.current = data;
        setChargingData(data);
        setError(null);
      };

      demoPoll();
      intervalRef.current = setInterval(demoPoll, 2000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }

    // Сохраняем sessionId в localStorage для восстановления
    localStorage.setItem("activeChargingSession", sessionId);

    // Сбрасываем время старта для новой сессии
    sessionStartTimeRef.current = Date.now();

    // Создаем стабильную функцию для интервала
    const pollFunction = async () => {
      try {
        const response = await rpApi.getChargingStatus(sessionId);

        if (response.success && response.session) {
          // DEBUG: Log raw response data to understand what backend returns
          logger.info(
            "[useChargingStatusPolling] Raw API response session:",
            JSON.stringify(response.session, null, 2),
          );

          const newData: ChargingData = {
            sessionId: response.session.id || sessionId,
            status: response.session.status || "preparing",
            stationId: response.session.station_id || "",
            ocppTransactionId:
              response.session.ocpp_transaction_id ?? undefined,

            // Данные из последнего MeterValues с защитой от null
            meterCurrent: response.session.meter_current || 0,
            meterStart: response.session.meter_start || 0,
            energyConsumedKwh:
              response.session.energy_kwh ||
              response.session.energy_consumed ||
              0,

            // Расчетные данные
            currentAmount:
              response.session.current_amount ||
              response.session.current_cost ||
              0,
            chargingPower: response.session.power_kw || 0,
            duration:
              response.session.duration_seconds ||
              (response.session.charging_duration_minutes || 0) * 60,

            // Прогресс (null -> undefined)
            progressPercent:
              response.session.progress_percent ||
              response.session.limit_percentage,
            limitValue: response.session.limit_value ?? undefined,
            limitType: response.session.limit_type ?? undefined,

            // Тариф из сессии (с учётом ночной скидки)
            ratePerKwh: response.session.rate_per_kwh ?? undefined,

            // Данные электромобиля (null -> undefined)
            evBatterySoc: response.session.ev_battery_soc ?? undefined,

            // Статус станции
            stationOnline: response.session.station_online ?? true,

            // Timestamps (для страницы завершения)
            startTime: response.session.start_time ?? undefined,
            endTime: response.session.stop_time ?? undefined,
          };

          // DEBUG: Log mapped data
          logger.info("[useChargingStatusPolling] Mapped newData:", {
            energyConsumedKwh: newData.energyConsumedKwh,
            currentAmount: newData.currentAmount,
            chargingPower: newData.chargingPower,
            duration: newData.duration,
            status: newData.status,
          });

          // Сохраняем как последние валидные данные
          lastValidDataRef.current = newData;
          setChargingData(newData);
          setError(null);

          // Проверяем изменение статуса
          if (lastStatusRef.current !== newData.status) {
            lastStatusRef.current = newData.status;
            callbacksRef.current.onStatusChange?.(newData.status);

            // Если зарядка завершена
            if (
              newData.status === ChargingStates.COMPLETED ||
              newData.status === ChargingStates.STOPPED
            ) {
              callbacksRef.current.onComplete?.(newData);
              // Останавливаем polling
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
          }
        } else {
          // Backend вернул success: false
          throw new Error("Failed to get charging status");
        }
      } catch (err) {
        // AbortError — ожидаемое поведение при отмене запроса, не логируем
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        const error = err instanceof Error ? err : new Error("Unknown error");
        const timeSinceStart = Date.now() - sessionStartTimeRef.current;
        const isInitialPeriod = timeSinceStart < 10000; // Первые 10 секунд

        // Проверяем HTTP статус ошибки (поддержка TransportError и Axios)
        const responseStatus =
          (err as { status?: number })?.status || // TransportError формат
          (err as { response?: { status?: number } })?.response?.status; // Axios fallback

        // 404 - сессия не найдена, очищаем localStorage
        if (responseStatus === 404) {
          logger.warn("Сессия не найдена (404), очищаем localStorage");
          localStorage.removeItem("activeChargingSession");
          localStorage.removeItem("activeChargingStationId");
          setError(error);
          // Останавливаем polling
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        // Если это 500 ошибка в первые 10 секунд - это нормально (OCPP еще не связан)
        if (responseStatus === 500 && isInitialPeriod) {
          logger.debug("Ожидание связывания OCPP транзакции с сессией...");

          // Показываем состояние "Подготовка" без ошибки
          if (!lastValidDataRef.current) {
            setChargingData({
              sessionId: sessionId,
              status: ChargingStates.PREPARING,
              stationId: initialStationId,
              ocppTransactionId: undefined,
              meterCurrent: 0,
              meterStart: 0,
              energyConsumedKwh: 0,
              currentAmount: 0,
              chargingPower: 0,
              duration: 0,
              stationOnline: true,
            });
          }
          setError(null); // Не показываем ошибку пользователю
        } else {
          // Для других ошибок или после 10 секунд - обычная обработка
          logger.error("Charging status fetch error:", error);
          setError(error);
          // Не вызываем onError callback для предотвращения лишних логов
          // callbacksRef.current.onError?.(error);

          // При ошибке используем последние валидные данные
          if (lastValidDataRef.current) {
            setChargingData({
              ...lastValidDataRef.current,
              stationOnline: false,
            });
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Показываем начальное состояние "Подготовка" только если нет сохранённых данных
    // НЕ сбрасываем isLoading - ждём первого ответа от API
    if (!lastValidDataRef.current) {
      setChargingData({
        sessionId: sessionId,
        status: ChargingStates.PREPARING,
        stationId: initialStationId,
        ocppTransactionId: undefined,
        meterCurrent: 0,
        meterStart: 0,
        energyConsumedKwh: 0,
        currentAmount: 0,
        chargingPower: 0,
        duration: 0,
        stationOnline: true,
      });
    }

    // Первый запрос СРАЗУ (без задержки) - быстрое получение актуального статуса
    pollFunction();

    // Запускаем polling после первого запроса
    // По Voltera: всегда 5 секунд, Realtime - дополнительный бонус, не замена
    intervalRef.current = setInterval(pollFunction, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sessionId, pollInterval, initialStationId]);

  // Supabase Realtime подписка УДАЛЕНА (по примеру Voltera)
  // Причина: Realtime использовала неверные поля (energy_consumed вместо energy),
  // что затирало корректные данные из HTTP polling нулями.
  // HTTP polling достаточен и работает стабильно (5 секунд интервал).

  // Очистка localStorage при завершении
  useEffect(() => {
    if (
      chargingData?.status === ChargingStates.COMPLETED ||
      chargingData?.status === ChargingStates.STOPPED
    ) {
      localStorage.removeItem("activeChargingSession");
    }
  }, [chargingData?.status]);

  // Ручная остановка polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Ручной запрос статуса
  const refetch = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await rpApi.getChargingStatus(sessionId);

      if (response.success && response.session) {
        const newData: ChargingData = {
          sessionId: response.session.id || sessionId,
          status: response.session.status || "preparing",
          stationId: response.session.station_id || "",
          ocppTransactionId: response.session.ocpp_transaction_id ?? undefined,

          // Данные из последнего MeterValues с защитой от null
          meterCurrent: response.session.meter_current || 0,
          meterStart: response.session.meter_start || 0,
          energyConsumedKwh:
            response.session.energy_kwh ||
            response.session.energy_consumed ||
            0,

          // Расчетные данные
          currentAmount:
            response.session.current_amount ||
            response.session.current_cost ||
            0,
          chargingPower: response.session.power_kw || 0,
          duration:
            response.session.duration_seconds ||
            (response.session.charging_duration_minutes || 0) * 60,

          // Прогресс (null -> undefined)
          progressPercent:
            response.session.progress_percent ||
            response.session.limit_percentage,
          limitValue: response.session.limit_value ?? undefined,
          limitType: response.session.limit_type ?? undefined,

          // Данные электромобиля (null -> undefined)
          evBatterySoc: response.session.ev_battery_soc ?? undefined,

          // Статус станции
          stationOnline: response.session.station_online ?? true,

          // Timestamps (для страницы завершения)
          startTime: response.session.start_time ?? undefined,
          endTime: response.session.stop_time ?? undefined,
        };

        // Сохраняем как последние валидные данные
        lastValidDataRef.current = newData;
        setChargingData(newData);
        setError(null);

        // Проверяем изменение статуса
        if (lastStatusRef.current !== newData.status) {
          lastStatusRef.current = newData.status;
          callbacksRef.current.onStatusChange?.(newData.status);

          // Если зарядка завершена
          if (
            newData.status === ChargingStates.COMPLETED ||
            newData.status === ChargingStates.STOPPED
          ) {
            callbacksRef.current.onComplete?.(newData);
            // Останавливаем polling
            stopPolling();
          }
        }
      } else {
        // Backend вернул success: false
        throw new Error("Failed to get charging status");
      }
    } catch (err) {
      const error = err as Error;
      logger.error("Charging status fetch error:", error);
      setError(error);
      callbacksRef.current.onError?.(error);

      // При ошибке используем последние валидные данные
      if (lastValidDataRef.current) {
        setChargingData({
          ...lastValidDataRef.current,
          stationOnline: false,
        });
      }
    }
  }, [sessionId, stopPolling]);

  // Page Visibility API: останавливаем/возобновляем polling при переключении вкладок
  useEffect(() => {
    if (!sessionId) return;

    // Если страница не видна - останавливаем interval
    if (!isPageVisible && intervalRef.current) {
      logger.debug("[useChargingStatusPolling] Page hidden, pausing polling");
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Если страница снова видима - возобновляем interval
    if (isPageVisible && !intervalRef.current && sessionId) {
      logger.debug("[useChargingStatusPolling] Page visible, resuming polling");
      // Немедленно делаем refetch при возврате на страницу
      refetch();
      // По Voltera: всегда 5 секунд polling
      intervalRef.current = setInterval(() => {
        refetch();
      }, pollInterval);
    }
  }, [isPageVisible, sessionId, pollInterval, refetch]);

  return {
    chargingData,
    isLoading,
    error,
    refetch,
    stopPolling,
    isPolling: intervalRef.current !== null,
  };
};

// Хук для восстановления сессии из localStorage
export const useRestoreChargingSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const savedSessionId = localStorage.getItem("activeChargingSession");
    if (savedSessionId) {
      setSessionId(savedSessionId);
    }
  }, []);

  const clearSession = () => {
    localStorage.removeItem("activeChargingSession");
    setSessionId(null);
  };

  return { sessionId, clearSession };
};
