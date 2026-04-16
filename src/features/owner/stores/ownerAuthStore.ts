/**
 * @deprecated Используйте `useUnifiedAuthStore` из `@/features/auth/unifiedAuthStore`.
 * Этот store сохранён для обратной совместимости и будет удалён в будущем.
 *
 * Owner Authentication Store (Zustand)
 * Manages authentication state for station owners/operators
 */

import { create } from 'zustand';
import { logger } from '@/shared/utils/logger';
import { ownerAuthService } from '../services/ownerAuthService';

export type OwnerRole = 'operator' | 'admin' | 'superadmin';

export interface OwnerUser {
  id: string;
  email: string;
  role: OwnerRole;
  is_active: boolean;
  created_at?: string;
  locations_count?: number;
  stations_count?: number;
}

interface OwnerAuthState {
  user: OwnerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

/**
 * Owner Authentication Store
 *
 * Uses Supabase Auth with email/password
 * Session stored in sessionStorage (cleared on browser close)
 */
export const useOwnerAuthStore = create<OwnerAuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  /**
   * Login owner with email and password
   */
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await ownerAuthService.signIn(email, password);

      if (!result.success || !result.owner) {
        throw new Error(result.error || 'Login failed');
      }

      set({
        user: result.owner,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      logger.info('[OwnerAuth] Login successful', {
        email,
        role: result.owner.role,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      logger.error('[OwnerAuth] Login failed', { email, error: errorMessage });

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });

      throw error;
    }
  },

  /**
   * Logout owner
   */
  logout: async () => {
    try {
      await ownerAuthService.signOut();

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      logger.info('[OwnerAuth] Logout successful');
    } catch (error) {
      logger.error('[OwnerAuth] Logout failed', error);
      throw error;
    }
  },

  /**
   * Refresh session and owner data
   */
  refreshSession: async () => {
    try {
      const result = await ownerAuthService.refreshSession();

      if (!result.success || !result.owner) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      set({
        user: result.owner,
        isAuthenticated: true,
      });

      logger.debug('[OwnerAuth] Session refreshed');
    } catch (error) {
      logger.error('[OwnerAuth] Session refresh failed', error);
      set({
        user: null,
        isAuthenticated: false,
      });
    }
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },
}));

/**
 * Initialize owner auth state on app load
 */
export const initializeOwnerAuth = async () => {
  const store = useOwnerAuthStore.getState();
  await store.refreshSession();
};
