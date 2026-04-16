/**
 * Owner Authentication Hooks
 * React hooks for owner login, logout, and session management
 *
 * NOTE: useOwnerAuth() now bridges from unified auth store.
 * The legacy ownerAuthStore is only used for login/logout/session operations.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { useOwnerAuthStore } from "../stores/ownerAuthStore";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";
import type { OwnerUser } from "../stores/ownerAuthStore";
import { logger } from "@/shared/utils/logger";

/**
 * Get current owner user — reads from unified auth store.
 * Returns the same shape as legacy ownerAuthStore for backward compatibility.
 */
export function useOwnerAuth() {
  const owner = useUnifiedAuthStore((s) => s.owner);
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  const isInitialized = useUnifiedAuthStore((s) => s.isInitialized);

  const user: OwnerUser | null = owner
    ? {
        id: owner.id,
        email: owner.email || owner.phone || "",
        role: owner.role,
        is_active: owner.is_active,
        stations_count: owner.stations_count,
        locations_count: owner.locations_count,
      }
    : null;

  return {
    user,
    isAuthenticated,
    isLoading: !isInitialized,
    error: null,
  };
}

/**
 * Owner login mutation
 *
 * @example
 * const { mutate: login, isPending, error } = useOwnerLogin();
 *
 * const handleSubmit = (email: string, password: string) => {
 *   login({ email, password }, {
 *     onSuccess: () => navigate('/owner/dashboard'),
 *     onError: (error) => toast.error(error.message)
 *   });
 * };
 */
export function useOwnerLogin() {
  const login = useOwnerAuthStore((state) => state.login);
  const clearError = useOwnerAuthStore((state) => state.clearError);

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      clearError();
      await login(email, password);
    },
    onSuccess: () => {
      logger.info("[useOwnerLogin] Login successful");
    },
    onError: (error) => {
      logger.error("[useOwnerLogin] Login failed", error);
    },
  });
}

/**
 * Owner logout mutation
 *
 * @example
 * const { mutate: logout } = useOwnerLogout();
 *
 * const handleLogout = () => {
 *   logout(undefined, {
 *     onSuccess: () => navigate('/')
 *   });
 * };
 */
export function useOwnerLogout() {
  const logout = useOwnerAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      await logout();
    },
    onSuccess: () => {
      logger.info("[useOwnerLogout] Logout successful");
    },
    onError: (error) => {
      logger.error("[useOwnerLogout] Logout failed", error);
    },
  });
}

/**
 * Owner session management
 *
 * Automatically refreshes session on component mount
 * Use in OwnerProtectedRoute or OwnerLayout
 *
 * @example
 * function OwnerLayout() {
 *   const { isLoading } = useOwnerSession();
 *
 *   if (isLoading) return <Loader />;
 *
 *   return <Outlet />;
 * }
 */
export function useOwnerSession() {
  const refreshSession = useOwnerAuthStore((state) => state.refreshSession);
  const isAuthenticated = useOwnerAuthStore((state) => state.isAuthenticated);

  const { isLoading } = useQuery({
    queryKey: ["owner-session"],
    queryFn: async () => {
      await refreshSession();
      return true;
    },
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  return {
    isLoading,
    isAuthenticated,
  };
}

/**
 * Clear owner authentication error
 */
export function useClearOwnerError() {
  return useOwnerAuthStore((state) => state.clearError);
}
