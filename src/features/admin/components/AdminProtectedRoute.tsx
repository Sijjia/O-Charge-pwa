import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { Icon } from "@iconify/react";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";
import type { OwnerRole } from "@/features/auth/types/auth.types";

const ALLOWED_ROLES: ReadonlyArray<OwnerRole> = ["admin", "superadmin"];

export function AdminProtectedRoute() {
  const { owner, userType, isAuthenticated, isInitialized } =
    useUnifiedAuthStore((s) => ({
      owner: s.owner,
      userType: s.userType,
      isAuthenticated: s.isAuthenticated,
      isInitialized: s.isInitialized,
    }));

  const isDemo = isDemoModeActive();

  // Auto-login in demo mode
  useEffect(() => {
    if (isDemo && isInitialized && !isAuthenticated) {
      useUnifiedAuthStore.getState().loginAsOwner({
        id: 'demo-system-admin-001',
        phone: '+996555000000',
        role: 'admin',
        is_active: true,
        is_partner: false,
      });
    }
  }, [isDemo, isInitialized, isAuthenticated]);

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

  // In demo mode, allow access if we have owner data after auto-login
  if (isDemo) {
    if (!isAuthenticated && !owner) return <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center"><Icon icon="solar:refresh-linear" width={48} className="text-red-500 animate-spin mx-auto mb-4" /></div>;
    return <Outlet />;
  }

  // In production mode, require full authentication
  if (!isAuthenticated || userType !== "owner") {
    return <Navigate to="/auth" replace />;
  }

  if (!owner || !owner.role || !ALLOWED_ROLES.includes(owner.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
