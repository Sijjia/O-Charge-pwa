/**
 * Улучшенный auth store с повышенной безопасностью
 * Временное решение до миграции на HttpOnly cookies
 */

import { create } from "zustand";
import { useEffect, useCallback } from "react";
import type { UnifiedUser } from "./types/unified.types";
import {
  SecureTokenStorage,
  SecurityMonitor,
  XSSDetector,
} from "../../utils/tokenSecurity";
import { supabase } from "../../shared/config/supabase";
import { logger } from "@/shared/utils/logger";
import { fetchJson, z } from "@/api/unifiedClient";

interface SecureAuthState {
  user: UnifiedUser | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  lockoutTimeRemaining: number;

  // Actions
  login: (user: UnifiedUser, token?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
  unlockAccount: () => void;
}

export const useSecureAuthStore = create<SecureAuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLocked: false,
  lockoutTimeRemaining: 0,

  login: async (user: UnifiedUser, token?: string) => {
    // Проверяем блокировку
    if (SecurityMonitor.isLocked()) {
      set({
        isLocked: true,
        lockoutTimeRemaining: SecurityMonitor.getLockoutTimeRemaining(),
      });
      throw new Error(
        "Account temporarily locked due to multiple failed attempts",
      );
    }

    // Санитизация данных пользователя
    const sanitizedUser: UnifiedUser = {
      ...user,
      name: XSSDetector.sanitize(user.name ?? "User"),
      email: XSSDetector.sanitize(user.email ?? ""),
      phone: user.phone ? XSSDetector.sanitize(user.phone) : null,
    };

    // Сохраняем токен безопасно (теперь async)
    if (token) {
      await SecureTokenStorage.setToken(token);
    }

    SecurityMonitor.reset(); // Сбрасываем счетчик при успешном входе

    set({
      user: sanitizedUser,
      isAuthenticated: true,
      isLocked: false,
      lockoutTimeRemaining: 0,
    });
  },

  logout: async () => {
    // Очищаем токен (теперь async)
    await SecureTokenStorage.clearToken();

    // Cookie-режим/PROD: выход через backend
    if (
      import.meta.env.PROD ||
      (import.meta.env["VITE_AUTH_MODE"] as string) === "cookie"
    ) {
      try {
        await fetchJson(
          "/api/v1/auth/logout",
          { method: "POST" },
          z.object({ success: z.boolean() }).passthrough(),
        );
      } catch {
        // ignore
      }
    } else {
      // Supabase режим
      try {
        await supabase.auth.signOut();
      } catch (error) {
        logger.error("Supabase signout error:", error);
      }
    }

    set({
      user: null,
      isAuthenticated: false,
      isLocked: false,
      lockoutTimeRemaining: 0,
    });
  },

  checkAuth: async () => {
    try {
      // Cookie-режим/PROD: берём профиль с бэкенда
      if (
        import.meta.env.PROD ||
        (import.meta.env["VITE_AUTH_MODE"] as string) === "cookie"
      ) {
        const prof = await fetchJson(
          "/api/v1/profile",
          { method: "GET" },
          z
            .object({
              success: z.boolean(),
              client_id: z.string().optional(),
              user_id: z.string().optional(),
              user_type: z.string().optional(),
              email: z.string().nullable().optional(),
              phone: z.string().nullable().optional(),
              name: z.string().nullable().optional(),
              balance: z.number().nullable().optional(),
              role: z.string().optional(),
              status: z.string().optional(),
            })
            .passthrough(),
        );
        const d = prof as Record<string, unknown>;
        const uid = d["client_id"] || d["user_id"] || d["id"];
        if (!d["success"] || !uid) {
          await get().logout();
          return;
        }
        const unifiedUser: UnifiedUser = {
          id: String(uid),
          email: XSSDetector.sanitize(String(d["email"] || "")),
          phone: d["phone"] ? XSSDetector.sanitize(String(d["phone"])) : null,
          name: XSSDetector.sanitize((d["name"] as string) || "User"),
          balance:
            typeof d["balance"] === "number" ? (d["balance"] as number) : 0,
          status: "active",
          favoriteStations: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ user: unifiedUser, isAuthenticated: true });
        return;
      }

      // Supabase режим (legacy)
      const token = await SecureTokenStorage.getToken();
      if (!token || SecureTokenStorage.isTokenExpired()) {
        await get().logout();
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        await get().logout();
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: clientData } = await supabase
          .from("clients")
          .select("*")
          .eq("id", user.id)
          .single();
        if (clientData) {
          const unifiedUser: UnifiedUser = {
            id: clientData.id,
            email: XSSDetector.sanitize(clientData.email),
            phone: clientData.phone
              ? XSSDetector.sanitize(clientData.phone)
              : null,
            name: XSSDetector.sanitize(clientData.name || "User"),
            balance: clientData.balance || 0,
            status: "active" as const,
            favoriteStations: [],
            createdAt: clientData.created_at,
            updatedAt: new Date().toISOString(),
          };
          set({ user: unifiedUser, isAuthenticated: true });
          SecureTokenStorage.refreshTokenExpiry();
        }
      }
    } catch (error) {
      logger.error("Auth check failed:", error);
      await get().logout();
    }
  },

  refreshToken: async () => {
    try {
      if (
        import.meta.env.PROD ||
        (import.meta.env["VITE_AUTH_MODE"] as string) === "cookie"
      ) {
        // В cookie-режиме refresh делает сервер; клиент просто триггерит
        await fetchJson(
          "/api/v1/auth/refresh",
          { method: "POST" },
          z.object({ success: z.boolean() }).passthrough(),
        ).catch(() => {});
        await get().checkAuth();
        return;
      }
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();
      if (error || !session) {
        await get().logout();
        return;
      }
      if (session.access_token) {
        await SecureTokenStorage.setToken(session.access_token);
      }
      await get().checkAuth();
    } catch (error) {
      logger.error("Token refresh failed:", error);
      await get().logout();
    }
  },

  unlockAccount: () => {
    if (SecurityMonitor.getLockoutTimeRemaining() === 0) {
      SecurityMonitor.reset();
      set({
        isLocked: false,
        lockoutTimeRemaining: 0,
      });
    }
  },
}));

/**
 * Hook для автоматической проверки и обновления токенов
 */
export const useTokenAutoRefresh = () => {
  const { checkAuth, refreshToken } = useSecureAuthStore();

  // Проверяем auth при монтировании
  useEffect(() => {
    void checkAuth();

    // Проверяем токен каждую минуту
    const interval = setInterval(() => {
      if (SecureTokenStorage.isTokenExpired()) {
        void refreshToken();
      } else {
        // Обновляем время жизни при активности
        SecureTokenStorage.refreshTokenExpiry();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [checkAuth, refreshToken]);
};

/**
 * Hook для обработки неудачных попыток входа
 */
export const useAuthAttemptMonitor = () => {
  const { isLocked, lockoutTimeRemaining, unlockAccount } =
    useSecureAuthStore();

  const recordFailedAttempt = useCallback(() => {
    SecurityMonitor.recordFailedAttempt();

    if (SecurityMonitor.isLocked()) {
      useSecureAuthStore.setState({
        isLocked: true,
        lockoutTimeRemaining: SecurityMonitor.getLockoutTimeRemaining(),
      });
    }
  }, []);

  // Таймер для автоматической разблокировки
  useEffect(() => {
    if (!isLocked) return;

    const timer = setTimeout(() => {
      unlockAccount();
    }, lockoutTimeRemaining);

    return () => clearTimeout(timer);
  }, [isLocked, lockoutTimeRemaining, unlockAccount]);

  return {
    isLocked,
    lockoutTimeRemaining,
    recordFailedAttempt,
  };
};
