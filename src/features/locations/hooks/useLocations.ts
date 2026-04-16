import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { rpApi } from "@/services/rpApi";
import { calculateDistance } from "@/shared/utils/geo";
import { logger } from "@/shared/utils/logger";
import { usePageVisibility } from "@/shared/hooks/usePageVisibility";
import { STALE_TIME, REFETCH_INTERVAL } from "@/lib/queryClient";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";
import { getDemoLocations, getDemoStationStatus } from "@/shared/demo/demoData";
import type { Location, StationStatusResponse } from "../../../api/types";

// Helper: добавляет расстояние к локациям
function addDistanceToLocations(
  locations: Location[],
  userLat: number,
  userLng: number,
): Location[] {
  return locations
    .map((location) => {
      if (location.latitude && location.longitude) {
        return {
          ...location,
          distance: calculateDistance(
            userLat,
            userLng,
            location.latitude,
            location.longitude,
          ),
        };
      }
      return location;
    })
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
}

/**
 * Хук для получения списка всех локаций
 *
 * ВАЖНО: WebSocket для локаций ОТКЛЮЧЕН (как в Voltera)
 * Используется только REST API polling для обновлений
 */
export function useLocations(requestGeolocation: boolean = false) {
  const isPageVisible = usePageVisibility();
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // WebSocket ОТКЛЮЧЕН - используем только REST polling (как в Voltera)
  // Backend не имеет WebSocket endpoint для локаций
  const isWebSocketConnected = false;

  // Получаем геолокацию пользователя только если явно запрошено
  useEffect(() => {
    if (requestGeolocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Тихо игнорируем — на iOS Safari kCLErrorLocationUnknown
          // Карта работает и без геолокации пользователя
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 минут — принимаем кешированную позицию
        },
      );
    }
  }, [requestGeolocation]);

  const {
    data: locations,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["locations", { includeStations: true }],
    queryFn: async () => {
      // Demo mode — возвращаем тестовые данные без API
      if (isDemoModeActive()) {
        logger.debug("[useLocations] Demo mode — returning demo locations");
        const demoLocations = getDemoLocations();
        if (userLocation) {
          return addDistanceToLocations(demoLocations, userLocation.lat, userLocation.lng);
        }
        return demoLocations;
      }

      if (import.meta.env.DEV)
        logger.debug("[useLocations] Query function called!");
      const locations = await rpApi.getLocations(true);

      if (import.meta.env.DEV)
        logger.debug("[useLocations] Fetched locations from API", {
          count: locations.length,
          first: locations[0],
        });

      // Добавляем расстояние если есть геолокация
      if (userLocation) {
        return addDistanceToLocations(
          locations,
          userLocation.lat,
          userLocation.lng,
        );
      }

      return locations;
    },
    placeholderData: (prev) => prev, // держим предыдущее значение из кеша (оффлайн-фолбэк)
    retry: (failureCount, error) => {
      // Не повторять при 401/403 (проблема авторизации)
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status?: number }).status;
        if (status === 401 || status === 403) {
          logger.warn(
            "[useLocations] Auth error detected, stopping retries",
            error,
          );
          return false;
        }
      }
      // Максимум 3 попытки для других ошибок
      return failureCount < 3;
    },
    staleTime: STALE_TIME.LOCATIONS, // 5 минут - оптимизировано для WebSocket real-time
    gcTime: 1000 * 60 * 60, // 1 hour - храним в кеше
    refetchInterval: (query) => {
      // Останавливаем автообновление при ошибках авторизации
      if (query.state.error) {
        logger.debug(
          "[useLocations] Refetch interval disabled due to error",
          query.state.error,
        );
        return false;
      }
      // Останавливаем polling когда страница не видна (Page Visibility API)
      if (!isPageVisible) {
        return false;
      }

      // Оптимизация: увеличиваем интервал polling когда WebSocket подключен
      // WebSocket connected: 2 минуты (fallback на случай пропущенных сообщений)
      // WebSocket disconnected: 1 минута (primary data source)
      return isWebSocketConnected
        ? REFETCH_INTERVAL.LOCATIONS_WITH_WS
        : REFETCH_INTERVAL.LOCATIONS_NO_WS;
    },
    refetchIntervalInBackground: false, // НЕ обновлять когда приложение в фоне (экономия батареи)
    refetchOnWindowFocus: true, // Обновлять при возврате в приложение
    refetchOnReconnect: true, // Обновлять при восстановлении сети
  });

  return {
    locations: locations || [],
    isLoading,
    error,
    refetch,
    userLocation,
  };
}

/**
 * Хук для получения детальной информации о локации
 * Note: Backend API не поддерживает отдельный endpoint для одной локации
 * Получаем все локации и фильтруем по ID
 */
export function useLocation(
  locationId: string,
  includeStations: boolean = true,
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["location", locationId, includeStations],
    queryFn: async () => {
      const locations = await rpApi.getLocations(includeStations);
      return locations.find((loc) => loc.id === locationId);
    },
    enabled: !!locationId,
    retry: (failureCount, error) => {
      // Не повторять при 401/403 (проблема авторизации)
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status?: number }).status;
        if (status === 401 || status === 403) return false;
      }
      return failureCount < 3;
    },
    staleTime: STALE_TIME.LOCATIONS, // 5 минут - синхронизировано с useLocations
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchInterval: (query) => {
      // Останавливаем автообновление при ошибках
      // Не нужен частый polling - WebSocket даст real-time обновления
      return query.state.error ? false : REFETCH_INTERVAL.LOCATIONS_WITH_WS;
    },
    refetchIntervalInBackground: false, // НЕ обновлять когда приложение в фоне
    refetchOnWindowFocus: true, // Обновлять при возврате в приложение
    refetchOnReconnect: true,
    placeholderData: () => {
      // Use cached data as placeholder
      return queryClient.getQueryData([
        "location",
        locationId,
        includeStations,
      ]) as Location | undefined;
    },
  });
}

/**
 * Хук для получения статуса станции
 */
export function useStationStatus(stationId: string) {
  // Station status обновляется через WebSocket, но polling нужен как fallback
  return useQuery({
    queryKey: ["station-status", stationId],
    queryFn: async (): Promise<StationStatusResponse> => {
      // Demo mode — возвращаем тестовые данные
      if (isDemoModeActive()) {
        const demoStatus = getDemoStationStatus(stationId);
        if (demoStatus) return demoStatus;
      }
      return await rpApi.getStationStatus(stationId);
    },
    enabled: !!stationId,
    retry: (failureCount, error: any) => {
      if (error?.status === 404 || error?.status === 400) return false;
      return failureCount < 3;
    },
    staleTime: STALE_TIME.STATION_STATUS, // 30 секунд - оптимизировано для WebSocket
    gcTime: 1000 * 60, // 1 минута - короткий кеш для критичных данных
    refetchInterval: isDemoModeActive() ? false : REFETCH_INTERVAL.STATION_STATUS,
  });
}

/**
 * Хук для real-time обновлений локаций
 *
 * ВАЖНО: WebSocket для локаций ОТКЛЮЧЕН (как в Voltera)
 * Backend не имеет отдельного WebSocket endpoint для локаций.
 * Обновления происходят через REST API polling.
 *
 * @deprecated WebSocket для локаций не поддерживается backend'ом
 */
export function useLocationUpdates(_channels: string[] = ["all"]) {
  // WebSocket ОТКЛЮЧЕН - возвращаем заглушку
  return {
    isConnected: false,
    subscriptions: [] as string[],
  };
}

/**
 * Хук для получения станций с обогащением данными локаций
 * Note: Этот хук дублирует логику из features/stations/hooks/useStations.ts
 * Рекомендуется использовать тот вместо этого
 * @deprecated Use features/stations/hooks/useStations instead
 */
export function useStations(requestGeolocation: boolean = false) {
  logger.warn(
    "useStations from useLocations is deprecated. Use features/stations/hooks/useStations instead",
  );

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Получаем геолокацию если запрошено
  useEffect(() => {
    if (requestGeolocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Тихо игнорируем — на iOS Safari kCLErrorLocationUnknown
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        },
      );
    }
  }, [requestGeolocation]);

  const {
    data: stations,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["stations-v3", userLocation],
    queryFn: async () => {
      // Импортируем адаптер
      const { extractStationsFromLocations } = await import(
        "../../stations/types"
      );
      // Получаем все локации со станциями
      const locations = await rpApi.getLocations(true);
      // Извлекаем и обогащаем станции
      return extractStationsFromLocations(locations, userLocation || undefined);
    },
    retry: (failureCount, error) => {
      // Не повторять при 401/403 (проблема авторизации)
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status?: number }).status;
        if (status === 401 || status === 403) return false;
      }
      return failureCount < 3;
    },
    staleTime: 1000 * 30, // 30 seconds - синхронизировано с useLocations
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchInterval: (query) => {
      // Останавливаем автообновление при ошибках
      return query.state.error ? false : 1000 * 30;
    },
    refetchIntervalInBackground: false, // НЕ обновлять когда приложение в фоне
    refetchOnWindowFocus: true, // Обновлять при возврате в приложение
    refetchOnReconnect: true,
  });

  return {
    stations: stations || [],
    isLoading,
    error,
    refetch,
  };
}
