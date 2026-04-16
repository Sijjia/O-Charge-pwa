import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { secureStorage } from "@/lib/platform/secureStorage";
import { rpApi } from "@/services/rpApi";
import { logger } from "@/shared/utils/logger";

const ACTIVE_SESSION_KEY = "activeChargingSession";

interface ActiveSession {
  sessionId: string;
  stationId?: string;
  status?: string;
  energyKwh?: number;
  amount?: number;
}

/**
 * Хук для отслеживания активной сессии зарядки.
 * Используется для показа индикатора в навигации и быстрого доступа к процессу зарядки.
 */
export function useActiveChargingSession() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Загружаем сохранённый sessionId при инициализации
  // Читаем из обоих источников: localStorage (быстрый доступ) и secureStorage (persistence)
  useEffect(() => {
    const loadActiveSession = async () => {
      try {
        // Сначала проверяем localStorage (синхронно, быстро)
        const localStorageSession = localStorage.getItem(ACTIVE_SESSION_KEY);
        if (localStorageSession) {
          setActiveSessionId(localStorageSession);
          logger.debug(
            "[useActiveChargingSession] Loaded from localStorage:",
            localStorageSession,
          );
          return;
        }

        // Fallback на secureStorage
        const result = await secureStorage.get(ACTIVE_SESSION_KEY);
        if (result.success && result.data) {
          setActiveSessionId(result.data);
          // Синхронизируем обратно в localStorage
          localStorage.setItem(ACTIVE_SESSION_KEY, result.data);
          logger.debug(
            "[useActiveChargingSession] Loaded from secureStorage:",
            result.data,
          );
        }
      } catch (error) {
        logger.error(
          "[useActiveChargingSession] Failed to load active session:",
          error,
        );
      }
    };

    loadActiveSession();
  }, []);

  // Проверяем статус сессии через API
  const { data: sessionStatus, isLoading } = useQuery({
    queryKey: ["active-charging-session", activeSessionId],
    queryFn: async () => {
      if (!activeSessionId) return null;

      try {
        const status = await rpApi.getChargingStatus(activeSessionId);
        return status;
      } catch (error) {
        logger.warn(
          "[useActiveChargingSession] Failed to get session status:",
          error,
        );
        // Если сессия не найдена, очищаем
        await clearActiveSession();
        return null;
      }
    },
    enabled: !!activeSessionId,
    refetchInterval: 30000, // Проверяем каждые 30 секунд
    staleTime: 10000,
    retry: 1,
  });

  // Проверяем, активна ли сессия (не завершена)
  const isSessionActive = useCallback(() => {
    if (!sessionStatus?.session) return false;

    const activeStatuses = [
      "preparing",
      "starting",
      "charging",
      "syncing",
      "started",
    ];
    return activeStatuses.includes(
      sessionStatus.session.status?.toLowerCase() || "",
    );
  }, [sessionStatus]);

  // Очистка активной сессии (из обоих storage)
  const clearActiveSession = useCallback(async () => {
    try {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      localStorage.removeItem("activeChargingStationId");
      await secureStorage.remove(ACTIVE_SESSION_KEY);
      setActiveSessionId(null);
      logger.debug("[useActiveChargingSession] Cleared active session");
    } catch (error) {
      logger.error(
        "[useActiveChargingSession] Failed to clear active session:",
        error,
      );
    }
  }, []);

  // Сохранение новой активной сессии (в оба storage)
  const setActiveSession = useCallback(
    async (sessionId: string, stationId?: string) => {
      try {
        localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
        if (stationId) {
          localStorage.setItem("activeChargingStationId", stationId);
        }
        await secureStorage.set(ACTIVE_SESSION_KEY, sessionId);
        setActiveSessionId(sessionId);
        logger.debug(
          "[useActiveChargingSession] Set active session:",
          sessionId,
        );
      } catch (error) {
        logger.error(
          "[useActiveChargingSession] Failed to set active session:",
          error,
        );
      }
    },
    [],
  );

  // Автоматически очищаем, если сессия завершена
  useEffect(() => {
    if (sessionStatus?.session && !isSessionActive()) {
      clearActiveSession();
    }
  }, [sessionStatus, isSessionActive, clearActiveSession]);

  const activeSession: ActiveSession | null =
    activeSessionId && isSessionActive()
      ? {
          sessionId: activeSessionId,
          stationId: sessionStatus?.session?.station_id,
          status: sessionStatus?.session?.status,
          energyKwh:
            sessionStatus?.session?.energy_kwh ||
            sessionStatus?.session?.energy_consumed ||
            0,
          amount:
            sessionStatus?.session?.current_amount ||
            sessionStatus?.session?.current_cost ||
            0,
        }
      : null;

  return {
    activeSession,
    hasActiveSession: !!activeSession,
    isLoading,
    setActiveSession,
    clearActiveSession,
  };
}
