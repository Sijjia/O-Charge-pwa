/**
 * Централизованная конфигурация React Query
 *
 * Оптимизировано для работы с:
 * - Backend Redis кешем (TTL 30s для /api/v1/locations)
 * - WebSocket real-time обновлениями
 * - Supabase Realtime подписками
 *
 * Последнее обновление: 2025-11-20
 */

import { QueryClient } from "@tanstack/react-query";
import { logger } from "@/shared/utils/logger";

/**
 * Оптимальные настройки staleTime для разных типов данных
 *
 * ВАЖНО: WebSocket для локаций ОТКЛЮЧЕН (как в Voltera)
 * Backend использует Redis кеш с TTL 30s для локаций/станций.
 * Frontend polling синхронизирован с backend TTL.
 */
export const STALE_TIME = {
  /** Локации и станции - обновляются через REST polling (WebSocket отключен) */
  LOCATIONS: 1000 * 30, // 30 секунд (синхронизировано с backend Redis TTL)

  /** Баланс - обновляется через Supabase Realtime */
  BALANCE: 1000 * 60 * 3, // 3 минуты (Supabase Realtime для обновлений)

  /** Избранные локации - обновляются через Supabase Realtime */
  FAVORITES: 1000 * 60 * 5, // 5 минут (Supabase Realtime для обновлений)

  /** История сессий - редко меняется */
  SESSIONS: 1000 * 60 * 10, // 10 минут

  /** Статус зарядки - критичный, часто обновляется */
  CHARGING_STATUS: 1000 * 10, // 10 секунд

  /** Статус станции - обновляется через WebSocket */
  STATION_STATUS: 1000 * 30, // 30 секунд (fallback если WebSocket не работает)

  /** Профиль пользователя - редко меняется */
  USER_PROFILE: 1000 * 60 * 15, // 15 минут

  /** Платежи - средняя частота обновлений */
  PAYMENTS: 1000 * 60 * 5, // 5 минут
} as const;

/**
 * Оптимальные настройки refetchInterval
 *
 * ВАЖНО: WebSocket для локаций ОТКЛЮЧЕН (как в Voltera)
 * Используется только REST API polling. Backend кеширует данные в Redis на 30 секунд.
 */
export const REFETCH_INTERVAL = {
  /** Локации - polling как основной источник данных (WebSocket отключен) */
  LOCATIONS_WITH_WS: 1000 * 30, // 30 секунд (синхронизировано с backend Redis TTL)
  LOCATIONS_NO_WS: 1000 * 30, // 30 секунд (основной режим работы)

  /** Баланс - Supabase Realtime дает real-time */
  BALANCE_WITH_REALTIME: 1000 * 60 * 5, // 5 минут (fallback)
  BALANCE_NO_REALTIME: 1000 * 60 * 2, // 2 минуты (primary без Realtime)

  /** Статус зарядки - критичный, polling нужен */
  CHARGING_STATUS: 1000 * 5, // 5 секунд

  /** Статус станции - WebSocket дает real-time */
  STATION_STATUS: 1000 * 10, // 10 секунд
} as const;

/**
 * Создание оптимизированного QueryClient
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Дефолтные настройки для всех запросов
        staleTime: STALE_TIME.LOCATIONS, // 5 минут по умолчанию
        gcTime: 1000 * 60 * 60, // 1 час - храним в памяти

        // Refetch стратегии
        refetchOnWindowFocus: false, // ОТКЛЮЧЕНО: мешает вводу в формах, используем manual refetch
        refetchOnReconnect: true, // Обновлять при восстановлении сети
        refetchOnMount: false, // НЕ обновлять при mount если данные fresh

        // Retry логика
        retry: (failureCount, error) => {
          // Не повторять при ошибках авторизации
          const status =
            error instanceof Error && "status" in error
              ? (error as Error & { status: number }).status
              : undefined;

          if (status === 401 || status === 403 || status === 404) {
            logger.debug(
              `[QueryClient] Не повторяем запрос для статуса ${status}`,
            );
            return false;
          }

          // Максимум 3 попытки для других ошибок
          return failureCount < 3;
        },

        // Exponential backoff для retry
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },

      mutations: {
        // Retry для мутаций только в случае сетевых ошибок
        retry: (failureCount, error) => {
          // Проверяем если это сетевая ошибка (Network Error)
          const isNetworkError =
            error instanceof Error &&
            (error.message.includes("Network") ||
              error.message.includes("Failed to fetch"));

          if (isNetworkError && failureCount < 2) {
            logger.debug(
              `[QueryClient] Повторная попытка мутации (${failureCount + 1}/2)`,
            );
            return true;
          }

          return false;
        },

        retryDelay: 1000, // 1 секунда между попытками для мутаций
      },
    },
  });
}

/**
 * Singleton instance для переиспользования
 */
export const queryClient = createQueryClient();

/**
 * Helper функция для определения нужно ли персистить query
 * Используется в App.tsx для PersistQueryClientProvider
 */
export function shouldPersistQuery(queryKey: unknown): boolean {
  if (!Array.isArray(queryKey) || queryKey.length === 0) {
    return false;
  }

  const key = String(queryKey[0]);

  // Персистим только долгоживущие данные
  // ВАЖНО: "balance" НЕ персистим — должен всегда быть свежим из API
  const persistKeys = [
    "locations",
    "location",
    "favorites",
    "user-profile",
    "sessions-history",
  ];

  return persistKeys.some((persistKey) => key.includes(persistKey));
}

/**
 * Helper функция для инвалидации связанных queries
 * Используется при WebSocket/Realtime обновлениях
 */
export function invalidateLocationQueries(
  queryClient: QueryClient,
  locationId?: string,
) {
  // Инвалидируем все queries связанные с локациями
  queryClient.invalidateQueries({ queryKey: ["locations"] });

  if (locationId) {
    queryClient.invalidateQueries({ queryKey: ["location", locationId] });
  }

  logger.debug("[QueryClient] Invalidated location queries", { locationId });
}

/**
 * Helper функция для инвалидации queries станций
 */
export function invalidateStationQueries(
  queryClient: QueryClient,
  stationId: string,
  locationId?: string,
) {
  // Инвалидируем статус станции
  queryClient.invalidateQueries({ queryKey: ["station-status", stationId] });

  // Инвалидируем родительскую локацию
  if (locationId) {
    queryClient.invalidateQueries({ queryKey: ["location", locationId] });
  }

  // Инвалидируем список всех локаций
  queryClient.invalidateQueries({ queryKey: ["locations"] });

  logger.debug("[QueryClient] Invalidated station queries", {
    stationId,
    locationId,
  });
}

/**
 * Helper функция для prefetch критичных данных
 * Используется при навигации для улучшения UX
 */
export async function prefetchCriticalData(
  queryClient: QueryClient,
  fetchFunctions: {
    fetchLocations?: () => Promise<unknown>;
    fetchBalance?: () => Promise<unknown>;
    fetchFavorites?: () => Promise<unknown>;
  },
) {
  const prefetchPromises: Promise<void>[] = [];

  if (fetchFunctions.fetchLocations) {
    prefetchPromises.push(
      queryClient.prefetchQuery({
        queryKey: ["locations"],
        queryFn: fetchFunctions.fetchLocations,
        staleTime: STALE_TIME.LOCATIONS,
      }),
    );
  }

  if (fetchFunctions.fetchBalance) {
    prefetchPromises.push(
      queryClient.prefetchQuery({
        queryKey: ["balance"],
        queryFn: fetchFunctions.fetchBalance,
        staleTime: STALE_TIME.BALANCE,
      }),
    );
  }

  if (fetchFunctions.fetchFavorites) {
    prefetchPromises.push(
      queryClient.prefetchQuery({
        queryKey: ["favorites"],
        queryFn: fetchFunctions.fetchFavorites,
        staleTime: STALE_TIME.FAVORITES,
      }),
    );
  }

  await Promise.all(prefetchPromises);
  logger.info("[QueryClient] Prefetched critical data");
}
