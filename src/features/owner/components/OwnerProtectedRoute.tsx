/**
 * Owner Protected Route Component
 * Ensures only authenticated owners can access owner dashboard routes
 */

import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";
import type { OwnerRole } from "@/features/auth/types/auth.types";

/**
 * Проверка роли owner
 */
function hasOwnerRole(
  role: OwnerRole | undefined,
  allowed: ReadonlyArray<OwnerRole>,
): boolean {
  if (!role) return false;
  return allowed.includes(role);
}

/**
 * Protected route wrapper for owner dashboard
 *
 * Checks authentication state and redirects to login if not authenticated
 * Shows loading state while checking session
 *
 * @example
 * <Route element={<OwnerProtectedRoute />}>
 *   <Route path="/owner/dashboard" element={<OwnerDashboard />} />
 * </Route>
 */
export function OwnerProtectedRoute() {
  const { owner, userType, isAuthenticated, isInitialized } =
    useUnifiedAuthStore((s) => ({
      owner: s.owner,
      userType: s.userType,
      isAuthenticated: s.isAuthenticated,
      isInitialized: s.isInitialized,
    }));

  const isDemo = isDemoModeActive();

  // useEffect MUST be called before any conditional returns (Rules of Hooks)
  useEffect(() => {
    if (isDemo && isInitialized && !isAuthenticated) {
      // Demo: Regional Operator for Bishkek city
      useUnifiedAuthStore.getState().loginAsOwner({
        id: 'demo-regional-operator-bishkek-001',
        phone: '+996555000001',
        role: 'operator',
        is_active: true,
        is_partner: false,
      });
    }
  }, [isDemo, isInitialized, isAuthenticated]);

  // Show loading state while checking authentication
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center">
        <div className="text-center">
          <Icon icon="solar:refresh-linear" width={48} className="text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-gray-400">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  if (isDemo) {
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center">
          <div className="text-center">
            <Icon icon="solar:refresh-linear" width={48} className="text-red-500 animate-spin mx-auto mb-4" />
            <p className="text-zinc-500 dark:text-gray-400">Инициализация демо...</p>
          </div>
        </div>
      );
    }
    return <Outlet />;
  }

  // Redirect to main auth page if not authenticated
  // Unified auth - единая форма входа для всех пользователей
  if (!isAuthenticated || userType !== "owner") {
    return <Navigate to="/auth" replace />;
  }

  // Партнёр → редирект на partner panel
  if (owner?.is_partner) {
    return <Navigate to="/partner/dashboard" replace />;
  }

  // Role-based access (operator/admin/superadmin)
  const allowed: ReadonlyArray<OwnerRole> = ["operator", "admin", "superadmin"];
  if (!owner || !hasOwnerRole(owner.role, allowed)) {
    return <Navigate to="/" replace />;
  }

  // Render protected content
  return <Outlet />;
}
