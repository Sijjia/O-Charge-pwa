import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UnifiedUser } from "./types/unified.types";
import type { Owner, UserType } from "./types/auth.types";
import { rpApi } from "@/services/rpApi";
import { logger } from "@/shared/utils/logger";

interface UnifiedAuthState {
  user: UnifiedUser | null;
  owner: Owner | null;
  userType: UserType | null; // "client" | "owner"
  isAuthenticated: boolean;
  isInitialized: boolean;

  login: (user: UnifiedUser) => void;
  loginAsOwner: (owner: Owner) => void;
  logout: () => void;
  setUser: (user: UnifiedUser) => void;
  refreshUser: () => Promise<void>;
  setInitialized: (initialized: boolean) => void;
}

/**
 * Единый auth-store без хранения токенов/TTL на клиенте.
 * Совместим по API с существующим AuthProvider и переходом на cookie-based auth.
 */
export const useUnifiedAuthStore = create<UnifiedAuthState>()(
  persist(
    (set) => ({
      user: null,
      owner: null,
      userType: null,
      isAuthenticated: false,
      isInitialized: false,

      login: (user: UnifiedUser) => {
        import("@/api/authRefresh").then((m) => m.resetRefreshState());
        set({
          user,
          owner: null,
          userType: "client",
          isAuthenticated: true,
          isInitialized: true,
        });
      },

      loginAsOwner: (owner: Owner) => {
        import("@/api/authRefresh").then((m) => m.resetRefreshState());
        logger.debug("[UnifiedAuthStore] Login as owner", {
          email: owner.email,
          role: owner.role,
        });
        // Гибридный подход: НЕ обнуляем user — owner также имеет клиентские данные
        // Синхронизируем user.roles из owner.role для RequireRole
        set((state) => ({
          ...state,
          owner,
          userType: "owner",
          isAuthenticated: true,
          isInitialized: true,
          user: state.user
            ? { ...state.user, roles: [owner.role] as const }
            : state.user,
        }));
      },

      logout: () => {
        logger.debug(
          "[UnifiedAuthStore] Logout called, clearing ALL auth state...",
        );
        set({
          user: null,
          owner: null,
          userType: null,
          isAuthenticated: false,
          isInitialized: true,
        });
        // Очищаем ВСЕ auth-related данные из localStorage
        // Это критично для предотвращения смешивания сессий между пользователями
        try {
          // Основные auth ключи
          localStorage.removeItem("skipped_auth");
          localStorage.removeItem("auth-storage");

          // Очищаем все Supabase auth ключи (если были)
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              // Supabase auth tokens
              if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
                keysToRemove.push(key);
              }
              // Owner session keys
              if (key.includes("owner") && key.includes("session")) {
                keysToRemove.push(key);
              }
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));

          logger.debug(
            "[UnifiedAuthStore] Cleared localStorage keys:",
            keysToRemove.length,
          );
        } catch (e) {
          logger.warn("[UnifiedAuthStore] Error clearing localStorage:", e);
        }

        // Очищаем sessionStorage тоже
        try {
          sessionStorage.clear();
        } catch {
          // ignore
        }
      },

      setUser: (user: UnifiedUser) => {
        set({ user, userType: "client" });
      },

      refreshUser: async () => {
        await rpApi.refreshUserData();
        const user = await rpApi.getCurrentUser();
        if (user) {
          set({ user, isAuthenticated: true, userType: "client" });
        } else {
          set({
            user: null,
            owner: null,
            userType: null,
            isAuthenticated: false,
          });
        }
      },

      setInitialized: (initialized: boolean) => {
        set({ isInitialized: initialized });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        owner: state.owner,
        userType: state.userType,
        isAuthenticated: state.isAuthenticated,
      }),
      skipHydration: true,
    },
  ),
);
