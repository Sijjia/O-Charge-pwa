import { useEffect } from "react";
import { useUnifiedAuthStore as useAuthStore } from "../unifiedAuthStore";
import { authService } from "../services/authService";
import { fetchJson, z } from "@/api/unifiedClient";
import { logger } from "@/shared/utils/logger";
import type { Owner, Client } from "../types/auth.types";

/**
 * Type guard для проверки что user имеет owner права
 * Гибридный подход: owner = расширенный клиент с доступом к dashboard
 */
function isOwnerUser(user: Client): boolean {
  return user.user_type === "owner";
}

/**
 * Создаёт UnifiedUser из Client данных
 */
function createUnifiedUser(user: Client) {
  return {
    id: user.id,
    email: user.email || null,
    phone: user.phone || null,
    name: user.name || "User",
    balance: user.balance || 0,
    status: "active" as const,
    favoriteStations: [] as string[],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Создаёт Owner из Client данных (для гибридного подхода)
 */
function createOwnerFromClient(user: Client, isPartner = false): Owner {
  return {
    id: user.id,
    email: user.email,
    role: user.role || "operator",
    is_active: user.is_active ?? true,
    is_partner: isPartner,
    stations_count: user.stations_count,
    locations_count: user.locations_count,
  };
}

/**
 * Проверяет, есть ли у пользователя запись партнёра в БД
 */
async function checkIsPartner(): Promise<boolean> {
  try {
    const result = await fetchJson("/api/v1/partner/dashboard", { method: "GET" }, z.object({ success: z.boolean() }).passthrough());
    return result.success === true;
  } catch {
    return false;
  }
}

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Определяем режим аутентификации:
 * - PROD или VITE_AUTH_MODE=cookie → cookie-based auth (backend JWT в httpOnly cookies)
 * - DEV без флага → Supabase Auth (JWT в localStorage)
 */
const isCookieAuthMode = () =>
  import.meta.env.PROD ||
  (import.meta.env["VITE_AUTH_MODE"] as string) === "cookie";

export function AuthProvider({ children }: AuthProviderProps) {
  const { login, loginAsOwner, logout, setInitialized } = useAuthStore();

  useEffect(() => {
    // Rehydrate the store on mount
    useAuthStore.persist.rehydrate();

    // Initialize auth state - проверяем сохраненную сессию
    const initializeAuth = async () => {
      try {
        logger.debug("[AuthProvider] Initializing auth...");
        logger.debug(
          `[AuthProvider] Auth mode: ${isCookieAuthMode() ? "cookie" : "supabase"}`,
        );

        // Если есть демо-пользователь в store — не проверяем бэкенд
        const currentState = useAuthStore.getState();
        if (currentState.isAuthenticated && currentState.user?.id?.startsWith("demo-")) {
          logger.debug("[AuthProvider] Demo user detected, skipping backend check");
          setInitialized(true);
          return;
        }

        // В cookie-режиме: если в store нет сессии, не делаем запрос к backend
        // (избегаем 401 ошибки в консоли при каждом посещении неавторизованным)
        if (isCookieAuthMode() && !currentState.isAuthenticated) {
          logger.debug("[AuthProvider] No prior session, skipping profile check");
          setInitialized(true);
          return;
        }

        const user = await authService.getCurrentUser();
        logger.debug("[AuthProvider] InitializeAuth: Got user:", {
          id: user ? user.id : "null",
          type: user && "user_type" in user ? user.user_type : "unknown",
        });

        if (user) {
          // Гибридный подход: ВСЕГДА создаём unified user для клиентских функций
          if (isOwnerUser(user)) {
            logger.debug(
              "[AuthProvider] InitializeAuth: User is OWNER (hybrid)",
              {
                email: user.email,
                role: user.role,
              },
            );
            // Проверяем партнёра ДО login() чтобы избежать race condition:
            // login() ставит isInitialized=true + userType="client",
            // а OwnerProtectedRoute может среагировать и редиректнуть на /auth
            const isPartner = await checkIsPartner();
            const unifiedUser = createUnifiedUser(user);
            const owner = createOwnerFromClient(user, isPartner);
            // Вызываем синхронно — React 18 батчит оба set() в один рендер
            login(unifiedUser);
            loginAsOwner(owner);
            // НЕ делаем редирект — owner может использовать приложение как клиент
          } else {
            logger.debug("[AuthProvider] InitializeAuth: User is CLIENT");
            const unifiedUser = createUnifiedUser(user);
            login(unifiedUser);
          }
        } else {
          // В cookie-режиме: если профиль не получен — пользователь не авторизован
          // В Supabase-режиме: ждём INITIAL_SESSION event
          if (isCookieAuthMode()) {
            logger.debug(
              "[AuthProvider] InitializeAuth: No user in cookie mode, user not authenticated",
            );
            // Явно сбрасываем состояние если пользователь был в localStorage
            // но сессия на сервере истекла
            logout();
          } else {
            logger.debug(
              "[AuthProvider] InitializeAuth: No user data yet, will wait for INITIAL_SESSION event",
            );
          }
        }
      } catch (error) {
        logger.error("[AuthProvider] Error initializing auth:", error);
        // При ошибке в cookie-режиме — сбрасываем состояние
        if (isCookieAuthMode()) {
          logout();
        }
      } finally {
        // Всегда помечаем как инициализировано
        setInitialized(true);
      }
    };

    initializeAuth();

    // В cookie-режиме НЕ используем Supabase events — они не работают
    // Подписываемся только в Supabase-режиме (DEV без cookie flag)
    if (isCookieAuthMode()) {
      logger.debug(
        "[AuthProvider] Cookie auth mode - skipping Supabase event subscription",
      );
      return;
    }

    // Listen for auth state changes (only in Supabase mode)
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      logger.debug("[AuthProvider] Auth state change:", {
        event,
        userId: session?.user?.id,
        hasSession: !!session,
      });

      if (event === "SIGNED_IN" && session?.user) {
        logger.debug("[AuthProvider] SIGNED_IN event, fetching user data...");

        // Retry механизм для устранения race condition
        let user = await authService.getCurrentUser();
        let retries = 0;
        const maxRetries = 3;

        while (!user && retries < maxRetries) {
          logger.debug(
            `[AuthProvider] SIGNED_IN: Retry ${retries + 1}/${maxRetries}...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 300)); // Ждем 300ms
          user = await authService.getCurrentUser();
          retries++;
        }

        logger.debug(
          "[AuthProvider] SIGNED_IN: Got user:",
          user ? user.id : "null",
        );

        if (user) {
          // Гибридный подход: check partner BEFORE login() to avoid race condition
          if (isOwnerUser(user)) {
            logger.debug("[AuthProvider] SIGNED_IN: User is OWNER (hybrid)");
            const isPartner = await checkIsPartner();
            const unifiedUser = createUnifiedUser(user);
            const owner = createOwnerFromClient(user, isPartner);
            login(unifiedUser);
            loginAsOwner(owner);
          } else {
            logger.debug("[AuthProvider] SIGNED_IN: Logging in user");
            const unifiedUser = createUnifiedUser(user);
            login(unifiedUser);
          }
        } else {
          logger.warn(
            "[AuthProvider] SIGNED_IN: User data not found after retries, cannot login",
          );
        }
      } else if (event === "INITIAL_SESSION") {
        logger.debug("[AuthProvider] INITIAL_SESSION event");
        // INITIAL_SESSION может приходить с или без session
        if (session?.user) {
          logger.debug(
            "[AuthProvider] INITIAL_SESSION: Has session, fetching user data...",
          );
          const user = await authService.getCurrentUser();
          logger.debug(
            "[AuthProvider] INITIAL_SESSION: Got user:",
            user ? user.id : "null",
          );

          if (user) {
            // Check partner BEFORE login() to avoid race condition
            if (isOwnerUser(user)) {
              logger.debug(
                "[AuthProvider] INITIAL_SESSION: User is OWNER (hybrid)",
              );
              const isPartner = await checkIsPartner();
              const unifiedUser = createUnifiedUser(user);
              const owner = createOwnerFromClient(user, isPartner);
              login(unifiedUser);
              loginAsOwner(owner);
            } else {
              logger.debug("[AuthProvider] INITIAL_SESSION: Logging in user");
              const unifiedUser = createUnifiedUser(user);
              login(unifiedUser);
            }
          } else {
            logger.warn(
              "[AuthProvider] INITIAL_SESSION: Session exists but user data not found",
            );
          }
        } else {
          logger.debug("[AuthProvider] INITIAL_SESSION: No session");
        }
      } else if (event === "SIGNED_OUT") {
        logger.debug("[AuthProvider] SIGNED_OUT - clearing state");
        logout();
      } else if (event === "TOKEN_REFRESHED") {
        logger.debug("[AuthProvider] Token refreshed");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [login, loginAsOwner, logout, setInitialized]);

  return <>{children}</>;
}
