import { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useStationStatus,
  useLocationUpdates,
} from "@/features/locations/hooks/useLocations";
import { useCharging } from "../features/charging/hooks/useCharging";
import { useBalance } from "../features/balance/hooks/useBalance";
import { SimpleTopup } from "../features/balance/components/SimpleTopup";
import { DynamicPricingDisplay } from "../features/pricing/components/DynamicPricingDisplay";
import { type ChargingLimits } from "../features/charging/components/ChargingLimitsSelector";
import { pricingService } from "../features/pricing/pricingService";
import { DEFAULT_RATE_PER_KWH } from "../features/pricing/types";
import { useAuthStatus } from "@/features/auth/hooks/useAuth";
import { useFavorites } from "@/features/favorites/hooks/useFavorites";
import { handleApiError } from "@/services/rpApi";
import { logger } from "@/shared/utils/logger";
import { throttle } from "@/shared/utils/debounce";
import { NotificationService } from "@/shared/utils/notifications";
import { ChargingStatusSkeleton } from "@/shared/components/SkeletonLoaders";
import { useChargingPrechecks } from "@/features/charging/hooks/useChargingPrechecks";
import { queryClient } from "@/lib/queryClient";
import type { StationStatus } from "@/features/pwa/schemas/offlineSchemas";
import { calculateDistance } from "@/shared/utils/geo";
import { GuidedStartModal } from "@/features/charging/components/GuidedStartModal";
import { ActiveBookingBanner } from "@/features/booking/components/ActiveBookingBanner";
import { BookingModal } from "@/features/booking/components/BookingModal";
import { HelpTip } from "@/shared/components/HelpTip";

type ConnectorUI = {
  id: string;
  type?: string | null;
  power?: number | null;
  status: "available" | "occupied" | "error";
};

type StationUI = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: "available" | "offline";
  connectors: ConnectorUI[];
  power?: number | null;
  price?: number | null;
  is_available: boolean;
  location_id?: string;
};

export const ChargingPage = () => {
  const navigate = useNavigate();
  const { stationId } = useParams();
  const [showTopup, setShowTopup] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<string | null>(
    null,
  );
  const [chargingError, setChargingError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [connectorPrices, setConnectorPrices] = useState<
    Record<string, number>
  >({});
  const [chargingLimits, setChargingLimits] = useState<ChargingLimits>({
    type: "amount",
    amount_som: 100,
  });
  const [chargeMode, setChargeMode] = useState<"amount" | "full">("amount");
  const [activeSession, setActiveSession] = useState<string | null>(null);

  const { user } = useAuthStatus();
  const { data: balance } = useBalance();
  const { startCharging, isStarting } = useCharging();
  const { toggleFavorite: toggleFavoriteApi, isFavorite } = useFavorites();
  const [heartbeatKey, setHeartbeatKey] = useState(0); // trigger re-mount to replay animation

  // Throttled setChargingLimits for slider (100ms throttle)
  const throttledSetChargingLimits = useMemo(
    () => throttle((limits: ChargingLimits) => setChargingLimits(limits), 100),
    [],
  );

  // Загружаем статус станции через новый API
  const { data: stationStatus, isLoading, error: stationError } = useStationStatus(stationId || "");

  // Подключаемся к real-time обновлениям для этой станции
  useLocationUpdates(stationId ? [`station:${stationId}`] : []);

  // Проверяем наличие активной сессии зарядки (по Voltera)
  // ВАЖНО: Проверяем через API что сессия реально существует и активна
  useEffect(() => {
    const savedSessionId = localStorage.getItem("activeChargingSession");
    if (!savedSessionId) {
      setActiveSession(null);
      return;
    }

    // Проверяем что сессия реально существует в БД
    const validateSession = async () => {
      try {
        const { rpApi } = await import("@/services/rpApi");
        const response = await rpApi.getChargingStatus(savedSessionId);

        if (response.success && response.session) {
          // Проверяем что сессия активна (не завершена)
          const status = response.session.status;
          if (status === "started" || status === "preparing") {
            setActiveSession(savedSessionId);
          } else {
            // Сессия завершена - очищаем localStorage
            localStorage.removeItem("activeChargingSession");
            localStorage.removeItem("activeChargingStationId");
            setActiveSession(null);
          }
        } else {
          // Сессия не найдена - очищаем localStorage
          localStorage.removeItem("activeChargingSession");
          localStorage.removeItem("activeChargingStationId");
          setActiveSession(null);
        }
      } catch {
        // Ошибка API (404, 500) - очищаем localStorage
        localStorage.removeItem("activeChargingSession");
        localStorage.removeItem("activeChargingStationId");
        setActiveSession(null);
      }
    };

    validateSession();
  }, []);

  // Сохраняем последнюю открытую станцию для оффлайн-прогрева
  useEffect(() => {
    if (stationId) {
      try {
        localStorage.setItem("last_station_id", stationId);
      } catch {
        // ignore storage errors
      }
    }
  }, [stationId]);

  // Оффлайн-фолбэк: берём валидированные данные из кэша, если сеть недоступна
  const cachedStatus =
    !navigator.onLine && stationId
      ? (queryClient.getQueryData(["station-status", stationId]) as
        | StationStatus
        | undefined)
      : undefined;
  const rawStatus =
    (stationStatus as unknown as StationStatus | undefined) ?? cachedStatus;
  const isOfflineFallback =
    !!cachedStatus && !stationStatus && !navigator.onLine;

  // Конвертируем stationStatus в формат для UI (мемоизируем для избежания лишних ререндеров)
  const station: StationUI | null = useMemo(() => {
    if (!rawStatus) return null;

    type BackendConnector = {
      id: string | number;
      type?: string | null;
      power_kw?: number | null;
      available?: boolean;
      status?: "available" | "occupied" | "faulted";
    };
    type BackendStationStatus = StationStatus & {
      station_id?: string;
      serial_number?: string;
      location_name?: string;
      location_address?: string;
      latitude?: number;
      longitude?: number;
      available_for_charging?: boolean;
      tariff_rub_kwh?: number;
      location_id?: string;
      connectors?: BackendConnector[];
    };

    const rs = rawStatus as BackendStationStatus;

    // Валидация обязательных полей
    if (
      (!rs.id && !rs.serial_number) ||
      !rs.location_name ||
      !rs.connectors ||
      rs.connectors.length === 0
    ) {
      logger.error("Invalid station data:", {
        serial_number: rs.serial_number ?? rs.id,
        location_name: rs.location_name,
        connectors_count: rs.connectors?.length,
      });
      return null;
    }

    return {
      id: rs.station_id ?? String(rs.id ?? rs.serial_number),
      name: String(rs.location_name ?? ""),
      address: rs.location_address || "Адрес не указан",
      lat: typeof rs.latitude === "number" ? rs.latitude : 0,
      lng: typeof rs.longitude === "number" ? rs.longitude : 0,
      status: rs.available_for_charging ? "available" : "offline",
      connectors: (rs.connectors || []).map(
        (connector: BackendConnector): ConnectorUI => ({
          id: String(connector.id),
          type: connector.type ?? null,
          power: connector.power_kw ?? null,
          status: connector.available
            ? "available"
            : connector.status === "faulted"
              ? "error"
              : "occupied",
        }),
      ),
      power: Math.max(
        0,
        ...(rs.connectors || []).map((c: BackendConnector) => c.power_kw ?? 0),
      ),
      price: rs.tariff_rub_kwh,
      is_available: rs.available_for_charging ?? false,
      location_id: rs.location_id,
    };
  }, [rawStatus]);

  const loading = isLoading;

  // ETA/Distance
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      () => {
        // ignore errors, ETA unavailable
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 },
    );
  }, []);

  const eta = (() => {
    try {
      if (!station || !station.lat || !station.lng) return null;
      if (userLat == null || userLng == null) return null;
      const km = calculateDistance(userLat, userLng, station.lat, station.lng);
      const avgSpeedKmh = 30; // городская средняя скорость
      const minutes = Math.max(1, Math.round((km / avgSpeedKmh) * 60));
      return { km: Number(km.toFixed(1)), minutes };
    } catch {
      return null;
    }
  })();

  // Booking modal
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Guided Flow modal
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"full" | "amount" | null>(
    null,
  );

  const openGuided = (action: "full" | "amount") => {
    setPendingAction(action);
    setGuidedOpen(true);
  };

  const confirmGuided = async () => {
    setGuidedOpen(false);
    // Определяем лимиты синхронно, чтобы избежать проблемы с асинхронным setState
    const limits: ChargingLimits =
      pendingAction === "full" ? { type: "none" } : chargingLimits;
    setChargingLimits(limits); // Обновляем UI
    await handleStartCharging(limits); // Передаём лимиты напрямую
    setPendingAction(null);
  };

  // Prechecks (non-breaking: только показываем статусы, не блокируем кнопки сверх текущей логики)
  const prechecks = useChargingPrechecks({
    balanceSom: balance?.balance,
    station: station
      ? {
        isAvailable: station.is_available,
        lastHeartbeatAt:
          (stationStatus as unknown as { last_heartbeat_at?: string | null })
            ?.last_heartbeat_at || null,
      }
      : null,
    selectedConnector:
      station && selectedConnector
        ? {
          id: selectedConnector,
          status:
            station.connectors.find((c) => c.id === selectedConnector)
              ?.status === "available"
              ? "available"
              : "occupied",
          powerKw:
            station.connectors.find((c) => c.id === selectedConnector)
              ?.power ?? null,
          type:
            station.connectors.find((c) => c.id === selectedConnector)
              ?.type ?? null,
        }
        : null,
    limits: chargingLimits,
  });

  // Автоматически выбираем первый доступный коннектор
  useEffect(() => {
    if (station && station.connectors.length > 0 && !selectedConnector) {
      const availableConnector = station.connectors.find(
        (c) => c.status === "available",
      );
      if (availableConnector) {
        setSelectedConnector(availableConnector.id);
      } else {
        setSelectedConnector(station.connectors[0]?.id || "1");
      }
    }
  }, [station, selectedConnector]);

  // Загружаем цены для всех коннекторов при загрузке станции
  useEffect(() => {
    const loadPrices = async () => {
      if (!stationId || !rawStatus) return;

      try {
        const prices: Record<string, number> = {};

        // Загружаем цены для каждого коннектора
        type WarmupConnector = { id: string | number; type?: string | null };
        const raw = rawStatus as unknown as { connectors?: WarmupConnector[] };
        for (const connector of raw.connectors || []) {
          const pricing = await pricingService.calculatePricing(
            stationId,
            connector.type ?? undefined,
          );
          prices[connector.id.toString()] = pricing.rate_per_kwh;
        }

        setConnectorPrices(prices);

        // Устанавливаем текущую цену для выбранного коннектора
        if (selectedConnector && prices[selectedConnector]) {
          setCurrentPrice(prices[selectedConnector]);
        }
      } catch (error) {
        logger.error("[ChargingPage] Error loading prices:", error);
      }
    };

    loadPrices();
  }, [stationId, rawStatus, selectedConnector]); // Added selectedConnector as dependency

  // Обновляем текущую цену при изменении выбранного коннектора
  useEffect(() => {
    if (selectedConnector && connectorPrices[selectedConnector]) {
      setCurrentPrice(connectorPrices[selectedConnector]);
    }
  }, [selectedConnector, connectorPrices]);

  const handleStartCharging = async (overrideLimits?: ChargingLimits) => {
    if (!selectedConnector || !station) return;

    // Используем переданные лимиты или текущее состояние
    const effectiveLimits = overrideLimits || chargingLimits;

    // Дополнительная валидация station
    if (!station.id || !station.connectors || station.connectors.length === 0) {
      logger.error("Invalid station data in handleStartCharging:", station);
      setChargingError("Ошибка данных станции. Пожалуйста, обновите страницу.");
      return;
    }

    setChargingError(null);

    // В dev режиме зарядка работает через Vite proxy → localhost:9210
    // Блокируем только если бэкенд не сконфигурирован (нет ни proxy, ни VITE_API_URL)

    try {
      // Проверяем баланс для лимитированной зарядки
      if (
        effectiveLimits.type !== "none" &&
        balance &&
        balance.balance !== null
      ) {
        const requiredBalance = effectiveLimits.estimatedCost || 0;
        if (balance.balance < requiredBalance) {
          setChargingError("Недостаточно средств на балансе");
          return;
        }
      }

      interface ChargingParams {
        stationId: string;
        connectorId: string;
        amount_som?: number;
        energy_kwh?: number;
      }

      const chargingParams: ChargingParams = {
        stationId: station.id,
        connectorId: selectedConnector.split("-").pop() || "1",
      };

      // Добавляем лимиты в зависимости от типа
      if (effectiveLimits.type === "amount") {
        chargingParams.amount_som = effectiveLimits.amount_som;
      } else if (effectiveLimits.type === "energy") {
        chargingParams.energy_kwh = effectiveLimits.energy_kwh;
      }
      // Для типа 'none' (полный бак) не передаём лимиты

      const result = await startCharging(chargingParams);

      // Обрабатываем результат
      if (result && result.success) {
        // Отправляем уведомление о начале зарядки
        NotificationService.notifyChargingStarted(station.id).catch((error) => {
          logger.warn("[ChargingPage] Failed to show notification:", error);
        });

        // Успех - переходим на страницу процесса зарядки
        navigate(`/charging-process/${result.sessionId}`, {
          state: {
            stationId: station.id,
            chargingLimits: effectiveLimits,
          },
        });
      } else if (result) {
        // Неудача - показываем сообщение об ошибке
        const errorMsg =
          result.message || "Не удалось запустить зарядку. Попробуйте снова.";
        setChargingError(errorMsg);

        // Отправляем уведомление об ошибке
        NotificationService.notifyChargingError(station.id, errorMsg).catch(
          (error) => {
            logger.warn(
              "[ChargingPage] Failed to show error notification:",
              error,
            );
          },
        );
      } else {
        // Неожиданный случай - result undefined
        const errorMsg =
          "Произошла ошибка при запуске зарядки. Попробуйте снова.";
        setChargingError(errorMsg);

        // Отправляем уведомление об ошибке
        NotificationService.notifyChargingError(station.id, errorMsg).catch(
          (error) => {
            logger.warn(
              "[ChargingPage] Failed to show error notification:",
              error,
            );
          },
        );
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setChargingError(errorMessage);

      // Отправляем уведомление об ошибке
      if (station?.id) {
        NotificationService.notifyChargingError(station.id, errorMessage).catch(
          (err) => {
            logger.warn(
              "[ChargingPage] Failed to show error notification:",
              err,
            );
          },
        );
      }
    }
  };

  // Быстрый отбой на 404
  const isNotFoundError = stationError && typeof stationError === 'object' && "status" in stationError && stationError.status === 404;

  if (loading && !isNotFoundError) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
        {/* Header */}
        <div className="px-5 pt-6 pb-4 flex items-center justify-between shrink-0 bg-white/80 dark:bg-[#0A0E17]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5 z-20">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 active:scale-95 transition-all hover:text-zinc-900 dark:hover:text-white shadow-sm dark:shadow-none"
          >
            <Icon icon="solar:arrow-left-linear" width={24} />
          </button>
          <h1 className="text-lg font-bold font-display tracking-tight text-zinc-900 dark:text-white">
            Станция
          </h1>
          <div className="w-10" />
        </div>
        <div className="p-4">
          <ChargingStatusSkeleton />
        </div>
      </div>
    );
  }

  if (!station || isNotFoundError) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 relative flex flex-col transition-colors duration-300">
        {/* Header с кнопкой назад */}
        <div className="px-5 pt-6 pb-4 flex items-center justify-between shrink-0 bg-white/80 dark:bg-[#0A0E17]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5 relative z-20">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all"
          >
            <Icon icon="solar:arrow-left-linear" width={24} />
          </button>
          <h1 className="text-lg font-bold font-display tracking-tight absolute left-1/2 -translate-x-1/2">
            Зарядка
          </h1>
          <div className="w-10" />
        </div>

        {/* ПРЕМИАЛЬНЫЙ NOT FOUND */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 -mt-10">
          <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
            <div className="w-[300px] h-[300px] bg-red-500/10 dark:bg-red-500/5 rounded-full blur-[80px]" />
          </div>

          <div className="relative z-10 w-24 h-24 mb-6 rounded-3xl bg-white dark:bg-zinc-900/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-center transform rotate-3">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent rounded-3xl" />
            <Icon
              icon="solar:map-point-wave-bold-duotone"
              width={48}
              className="text-red-500 dark:text-red-400 rotate-[-3deg]"
            />
          </div>

          <h2 className="text-2xl font-bold font-display text-zinc-900 dark:text-white mb-2 text-center">
            Станция не найдена
          </h2>
          <p className="text-base text-zinc-500 dark:text-zinc-400 text-center mb-10 max-w-[280px] font-medium leading-relaxed">
            Похоже, зарядная станция была удалена, перемещена или вы перешли по устаревшей ссылке.
          </p>

          <button
            onClick={() => navigate("/")}
            className="w-full max-w-[280px] py-4 px-6 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-[15px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Icon icon="solar:map-bold" width={20} />
            Вернуться на карту
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 relative flex flex-col transition-colors duration-300 pb-[calc(var(--nav-height)+100px)]"
    >
      {/* Loading Overlay при запуске зарядки */}
      {isStarting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-[100]">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent" />
          <p className="mt-4 text-white text-lg font-bold font-display">
            Запуск зарядки...
          </p>
          <p className="mt-2 text-zinc-400 text-sm">
            Подождите, подключаемся к станции...
          </p>
        </div>
      )}

      {/* Премиальный фон для хидера */}
      <div className="absolute top-0 inset-x-0 h-[120px] bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none z-10" />

      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between shrink-0 bg-white/70 dark:bg-[#0A0E17]/70 backdrop-blur-2xl border-b border-zinc-200/80 dark:border-white/10 z-20 relative transition-colors duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5 pointer-events-none" />
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all shadow-sm dark:shadow-none"
        >
          <Icon icon="solar:arrow-left-linear" width={24} />
        </button>
        <h1 className="text-lg font-bold font-display tracking-tight text-zinc-900 dark:text-white absolute left-1/2 -translate-x-1/2">
          Зарядка
        </h1>
        <div className="flex items-center gap-2">
          {isOfflineFallback && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20 font-semibold">
              Оффлайн
            </span>
          )}
          <button
            onClick={() => {
              if (!user) {
                navigate("/auth");
                return;
              }
              if (station && station.location_id) {
                logger.debug(
                  "Toggling favorite for location:",
                  station.location_id,
                );
                toggleFavoriteApi(station.location_id);
                setHeartbeatKey((k) => k + 1); // trigger heartbeat
              }
            }}
            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center active:scale-95 transition-all shadow-sm dark:shadow-none"
            aria-label="Добавить в избранное"
          >
            <Icon
              key={heartbeatKey}
              icon={
                station &&
                  station.location_id &&
                  isFavorite(station.location_id)
                  ? "solar:heart-bold"
                  : "solar:heart-linear"
              }
              width={20}
              className={[
                station &&
                  station.location_id &&
                  isFavorite(station.location_id)
                  ? "text-red-500"
                  : "text-zinc-400",
                heartbeatKey > 0 ? "animate-heartbeat" : "",
              ].join(" ")}
            />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Active Charging Session Banner */}
        {activeSession && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-red-600/20 to-red-700/10 border border-red-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Icon
                    icon="solar:battery-charge-linear"
                    width={22}
                    className="text-red-400 animate-pulse"
                  />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white text-sm">
                    Зарядка в процессе
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    У вас есть активная сессия
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  navigate(`/charging-process/${activeSession}`);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Вернуться
              </button>
            </div>
          </div>
        )}

        {/* Station Info Card */}
        <div className="mt-5">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold font-display text-zinc-900 dark:text-white tracking-tight mb-1">
                {station.name}
              </h2>
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
                <Icon icon="solar:map-point-linear" width={16} />
                <span>{station.address}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${station.is_available
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-red-500/10 border-red-500/20"
                  }`}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${station.is_available ? "bg-emerald-400" : "bg-red-400"
                      }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${station.is_available ? "bg-emerald-500" : "bg-red-500"
                      }`}
                  />
                </span>
                <span
                  className={`text-[11px] font-bold uppercase tracking-wide ${station.is_available ? "text-emerald-500" : "text-red-500"
                    }`}
                >
                  {station.is_available ? "Доступна" : "Офлайн"}
                </span>
              </div>
              {eta ? (
                <span className="text-xs text-zinc-500 font-medium">
                  {eta.km} км ~ {eta.minutes} мин
                </span>
              ) : (
                <span className="text-xs text-zinc-400">
                  Нет данных о местоположении
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm flex items-center justify-between shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
              <Icon icon="solar:wallet-money-linear" width={22} />
            </div>
            <div>
              <div className="text-xs text-zinc-500 font-medium mb-0.5 flex items-center gap-1">
                Ваш баланс
                <HelpTip text="Средства замораживаются на время зарядки, списываются за фактически потреблённые кВт·ч. Неиспользованный остаток немедленно возвращается." />
              </div>
              <div className="text-lg font-bold font-display text-zinc-900 dark:text-white tracking-tight">
                {(balance?.balance ?? 0).toFixed(2)} KGS
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowTopup(true)}
            className="w-8 h-8 rounded-full bg-red-600/10 flex items-center justify-center text-red-500 hover:bg-red-600/20 transition-colors"
          >
            <Icon icon="solar:add-circle-linear" width={20} />
          </button>
        </div>

        {/* Active Booking Banner */}
        <div className="mt-6">
          <ActiveBookingBanner />
        </div>

        {/* Connectors Section */}
        <div className="mt-8">
          <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Коннекторы
          </h3>
          <div className="space-y-3">
            {station &&
              station.connectors.map((connector) => {
                const isSelected = selectedConnector === connector.id;
                const isAvailable = connector.status === "available";
                const isOccupied = connector.status === "occupied";

                return (
                  <button
                    key={connector.id}
                    onClick={() => setSelectedConnector(connector.id)}
                    disabled={!isAvailable}
                    className={`w-full p-4 rounded-2xl border transition-all text-left ${isSelected
                      ? "border-red-600 bg-white dark:bg-zinc-900/50 shadow-[0_0_0_1px_rgba(220,38,38,0.2)]"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      } ${!isAvailable ? "opacity-60 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"} shadow-sm dark:shadow-none`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected
                            ? "bg-red-600/10 text-red-500"
                            : isAvailable
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                            }`}
                        >
                          <Icon
                            icon={
                              isSelected
                                ? "solar:plug-circle-bold"
                                : "solar:plug-circle-linear"
                            }
                            width={24}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                              {connector.type || "Type 2"}
                            </span>
                            <HelpTip
                              text={(() => {
                                const t = (connector.type || "").toLowerCase();
                                if (t.includes("ccs")) return "CCS2 — европейский стандарт DC-зарядки. Подходит для большинства EV европейских марок.";
                                if (t.includes("gbt") || t.includes("gb/t")) return "GB/T — китайский стандарт. Используется на BYD, Geely, Chery и других китайских EV.";
                                if (t.includes("type 2") || t.includes("type2")) return "Type 2 — европейский стандарт AC-зарядки. Медленнее DC, но очень распространён.";
                                if (t.includes("chd") || t.includes("chademo")) return "CHAdeMO — японский DC-стандарт. Используется на Nissan Leaf, Mitsubishi и др.";
                                return "Проверьте тип разъёма в инструкции к вашему автомобилю.";
                              })()}
                            />
                            <span className="text-zinc-300 dark:text-zinc-600 font-normal">
                              ·
                            </span>
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">
                              {connector.power || station.power || 0} кВт
                            </span>
                          </div>
                          <div
                            className={`text-xs mt-0.5 ${isAvailable
                              ? "text-emerald-500"
                              : isOccupied
                                ? "text-amber-500"
                                : "text-red-500"
                              }`}
                          >
                            {isAvailable
                              ? "Свободен"
                              : isOccupied
                                ? "Занят"
                                : "Ошибка"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-bold text-zinc-900 dark:text-white font-display">
                            {connectorPrices[connector.id] ||
                              station?.price ||
                              DEFAULT_RATE_PER_KWH}{" "}
                            сом
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-500">
                            за кВтч
                          </div>
                        </div>
                        {isAvailable && (
                          <Icon
                            icon={
                              isSelected
                                ? "solar:check-circle-bold"
                                : "solar:circle-linear"
                            }
                            width={24}
                            className={
                              isSelected ? "text-red-500" : "text-zinc-700"
                            }
                          />
                        )}
                        {isOccupied && (
                          <Icon
                            icon="solar:clock-circle-linear"
                            width={24}
                            className="text-amber-500"
                          />
                        )}
                        {connector.status === "error" && (
                          <Icon
                            icon="solar:danger-triangle-linear"
                            width={24}
                            className="text-red-500"
                          />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Dynamic Pricing Display */}
        {selectedConnector && station && (
          <div className="mt-6">
            <DynamicPricingDisplay
              stationId={station.id}
              connectorType={
                station.connectors.find((c) => c.id === selectedConnector)
                  ?.type ?? undefined
              }
            />
          </div>
        )}

        {/* Charging Parameters */}
        {selectedConnector && (
          <div className="mt-8">
            <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-4">
              Параметры зарядки
            </h3>

            {/* Guided prechecks output */}
            {(prechecks.issues.length > 0 ||
              prechecks.warnings.length > 0) && (
                <div className="mb-4 space-y-3">
                  {prechecks.issues.length > 0 && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                      <Icon
                        icon="solar:danger-triangle-linear"
                        width={18}
                        className="text-red-400 shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="text-xs font-semibold text-red-400 mb-1">
                          Проблемы для старта:
                        </p>
                        <ul className="list-disc pl-4 text-xs text-red-400 space-y-0.5">
                          {prechecks.issues.map((msg) => (
                            <li key={msg}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  {prechecks.warnings.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                      <Icon
                        icon="solar:info-circle-linear"
                        width={18}
                        className="text-amber-400 shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="text-xs font-semibold text-amber-400 mb-1">
                          Предупреждения:
                        </p>
                        <ul className="list-disc pl-4 text-xs text-amber-400 space-y-0.5">
                          {prechecks.warnings.map((msg) => (
                            <li key={msg}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {chargingError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <Icon
                  icon="solar:close-circle-linear"
                  width={18}
                  className="text-red-400 shrink-0 mt-0.5"
                />
                <p className="text-xs text-red-400 font-medium leading-relaxed">
                  {chargingError}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {/* Unified Charging Limits Card */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-4">
                {/* Mode Tabs */}
                <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                  <button
                    onClick={() => setChargeMode("amount")}
                    disabled={isStarting}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${chargeMode === "amount"
                      ? "bg-white dark:bg-zinc-700 text-red-500 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      }`}
                  >
                    По сумме
                  </button>
                  <button
                    onClick={() => setChargeMode("full")}
                    disabled={isStarting}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${chargeMode === "full"
                      ? "bg-white dark:bg-zinc-700 text-red-500 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      }`}
                  >
                    До полного
                  </button>
                </div>

                {/* Amount display — only when По сумме */}
                {chargeMode === "amount" && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center text-red-500">
                      <Icon icon="solar:tag-price-linear" width={22} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">Сумма зарядки</div>
                    </div>
                    <div className="text-xl font-bold font-display text-zinc-900 dark:text-white tracking-tight">
                      {chargingLimits.amount_som || 100}
                      <span className="text-sm font-medium text-zinc-500 ml-1">сом</span>
                    </div>
                  </div>
                )}

                {/* Slider and Amount Controls — only when По сумме */}
                {chargeMode === "amount" && (
                  <>
                    {currentPrice && station && (
                      <div className="space-y-3">
                        <input
                          type="range"
                          min="50"
                          max={Math.min(2000, balance?.balance || 0)}
                          step="10"
                          value={chargingLimits.amount_som || 100}
                          onChange={(e) => {
                            const amount = Number(e.target.value);
                            throttledSetChargingLimits({
                              type: "amount",
                              amount_som: amount,
                              estimatedEnergy: amount / currentPrice,
                              estimatedCost: amount,
                              estimatedDuration:
                                (amount /
                                  currentPrice /
                                  (station?.connectors.find(
                                    (c: { id: string }) =>
                                      c.id === selectedConnector,
                                  )?.power ||
                                    station?.power ||
                                    22)) *
                                60,
                            });
                          }}
                          disabled={isStarting}
                          className="w-full h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(220,38,38,0.4)]"
                          style={{
                            background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(((chargingLimits.amount_som || 100) - 50) /
                              (Math.min(2000, balance?.balance || 0) - 50)) *
                              100
                              }%, #3f3f46 ${(((chargingLimits.amount_som || 100) - 50) /
                                (Math.min(2000, balance?.balance || 0) - 50)) *
                              100
                              }%, #3f3f46 100%)`,
                          }}
                        />

                        <div className="flex justify-between text-[11px] text-zinc-500 font-medium">
                          <span>50 сом</span>
                          <span>
                            {Math.min(2000, balance?.balance || 0)} сом (макс)
                          </span>
                        </div>

                        {/* Quick Select Chips */}
                        <div className="flex gap-2 overflow-x-auto">
                          {[100, 200, 500, 1000].map((amount) => (
                            <button
                              key={amount}
                              onClick={() => {
                                const clampedAmount = Math.min(
                                  amount,
                                  balance?.balance || 0,
                                );
                                throttledSetChargingLimits({
                                  type: "amount",
                                  amount_som: clampedAmount,
                                  estimatedEnergy: clampedAmount / currentPrice,
                                  estimatedCost: clampedAmount,
                                  estimatedDuration:
                                    (clampedAmount /
                                      currentPrice /
                                      (station?.connectors.find(
                                        (c: { id: string }) =>
                                          c.id === selectedConnector,
                                      )?.power ||
                                        station?.power ||
                                        22)) *
                                    60,
                                });
                              }}
                              disabled={
                                isStarting || (balance?.balance || 0) < amount
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${(chargingLimits.amount_som || 100) === amount
                                ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40"
                                }`}
                            >
                              {amount}
                            </button>
                          ))}
                        </div>

                        {/* Estimated Info */}
                        <div className="bg-zinc-50 dark:bg-[#0A0E17] rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon
                                icon="solar:bolt-linear"
                                width={14}
                                className="text-zinc-500"
                              />
                              <span className="text-xs text-zinc-400">
                                Энергия
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-zinc-900 dark:text-white font-display">
                              ~
                              {(
                                (chargingLimits.amount_som || 100) / currentPrice
                              ).toFixed(2)}{" "}
                              кВтч
                            </span>
                          </div>
                          <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-700/50" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon
                                icon="solar:clock-circle-linear"
                                width={14}
                                className="text-zinc-500"
                              />
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                Время
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-zinc-900 dark:text-white font-display">
                              ~
                              {Math.round(
                                ((chargingLimits.amount_som || 100) /
                                  currentPrice /
                                  (station?.connectors.find(
                                    (c: { id: string }) =>
                                      c.id === selectedConnector,
                                  )?.power ||
                                    station?.power ||
                                    22)) *
                                60,
                              )}{" "}
                              мин
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {(balance?.balance || 0) <
                      (chargingLimits.amount_som || 100) && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                          <Icon
                            icon="solar:wallet-money-linear"
                            width={16}
                            className="text-red-400 shrink-0 mt-0.5"
                          />
                          <p className="text-[11px] leading-relaxed text-red-400 font-medium">
                            Недостаточно средств на балансе
                          </p>
                        </div>
                      )}
                  </>
                )}

                {/* Full Charge Info — only when До полного */}
                {chargeMode === "full" && (
                  <div className="p-4 bg-emerald-50 dark:bg-green-500/10 border border-emerald-200 dark:border-green-500/20 rounded-xl flex items-start gap-3">
                    <Icon
                      icon="solar:battery-charge-linear"
                      width={20}
                      className="text-emerald-500 dark:text-green-500 shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-green-400">
                        Полная зарядка
                      </p>
                      <p className="text-xs text-emerald-600/80 dark:text-green-400/70 mt-1 leading-relaxed">
                        Зарядка продолжается до полного заряда батареи или до нажатия «Стоп».
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!selectedConnector && (
          <div className="mt-8 p-6 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-center">
            <Icon
              icon="solar:plug-circle-linear"
              width={32}
              className="text-zinc-400 dark:text-zinc-600 mx-auto mb-2"
            />
            <p className="text-sm text-zinc-500">
              Выберите коннектор для начала зарядки
            </p>
          </div>
        )}
      </div>

      {/* Sticky Footer CTA */}
      {selectedConnector && (
        <div className="fixed bottom-0 inset-x-0 bg-white/80 dark:bg-[#0A0E17]/80 backdrop-blur-xl border-t border-zinc-200 dark:border-white/5 p-4 z-30 transition-colors duration-300" style={{ paddingBottom: "calc(var(--nav-height) + 16px)" }}>
          <div className="flex gap-3">
            <button
              className="py-4 px-4 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] rounded-2xl text-zinc-700 dark:text-zinc-300 font-semibold text-sm transition-all flex items-center justify-center gap-2"
              onClick={() => setShowBookingModal(true)}
              disabled={isOfflineFallback || !station?.is_available}
            >
              <Icon icon="solar:clock-circle-bold" width={20} />
              <span>Забронировать</span>
            </button>
            <button
              className="flex-1 py-4 bg-red-600 hover:bg-red-500 active:scale-[0.98] rounded-2xl text-white font-bold text-base shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center gap-2.5 group overflow-hidden relative disabled:opacity-50 disabled:shadow-none"
              onClick={() => openGuided(chargeMode)}
              disabled={
                isStarting ||
                !selectedConnector ||
                !station?.is_available ||
                (chargeMode === "amount" && (balance?.balance || 0) < (chargingLimits.amount_som || 100)) ||
                isOfflineFallback
              }
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Icon
                icon="solar:bolt-circle-bold"
                width={22}
                className="group-hover:scale-110 transition-transform relative z-10"
              />
              <span className="tracking-tight relative z-10">
                {chargeMode === "full"
                  ? "Начать зарядку"
                  : `Начать зарядку (${chargingLimits.amount_som || 100} сом)`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Simple Topup Modal */}
      {showTopup && <SimpleTopup onClose={() => setShowTopup(false)} />}

      {/* Booking Modal */}
      {station && selectedConnector && (
        <BookingModal
          stationId={station.id}
          connectorId={Number(selectedConnector.split("-").pop()) || 1}
          connectorType={station.connectors.find((c) => c.id === selectedConnector)?.type ?? undefined}
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
        />
      )}

      {/* Guided Start Modal */}
      <GuidedStartModal
        open={guidedOpen}
        onClose={() => {
          setGuidedOpen(false);
          setPendingAction(null);
        }}
        onConfirm={confirmGuided}
        issues={prechecks.issues}
        warnings={prechecks.warnings}
        summary={{
          stationName: station?.name,
          stationAddress: station?.address,
          connectorId: selectedConnector,
          connectorType: selectedConnector
            ? station?.connectors.find((c) => c.id === selectedConnector)?.type ?? null
            : null,
          connectorPower: selectedConnector
            ? station?.connectors.find((c) => c.id === selectedConnector)?.power ?? station?.power ?? null
            : null,
          isFullCharge: pendingAction === "full",
          pricePerKwh: currentPrice ?? station?.price ?? null,
          estimatedEnergyKwh:
            pendingAction === "amount" && currentPrice
              ? (chargingLimits.amount_som || 100) / currentPrice
              : null,
          estimatedCostSom:
            pendingAction === "amount"
              ? chargingLimits.amount_som || 100
              : null,
          estimatedDurationMin:
            pendingAction === "amount" && station
              ? ((chargingLimits.amount_som || 100) /
                (currentPrice || station?.price || DEFAULT_RATE_PER_KWH) /
                (station.connectors.find(
                  (c: { id: string }) => c.id === selectedConnector,
                )?.power ||
                  station.power ||
                  22)) *
              60
              : null,
        }}
      />
    </div>
  );
};
