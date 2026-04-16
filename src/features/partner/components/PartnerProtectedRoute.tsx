/**
 * Partner Protected Route
 * Ensures only authenticated partners can access partner panel routes
 * Partner = owner с записью в таблице partners (is_partner === true)
 */

import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";

export function PartnerProtectedRoute() {
  const { owner, userType, isAuthenticated, isInitialized } =
    useUnifiedAuthStore((s) => ({
      owner: s.owner,
      userType: s.userType,
      isAuthenticated: s.isAuthenticated,
      isInitialized: s.isInitialized,
    }));

  const isDemo = isDemoModeActive();

  useEffect(() => {
    if (isDemo && isInitialized && !isAuthenticated) {
      // Demo: Partner Company (АО Бишкек Электро)
      useUnifiedAuthStore.getState().loginAsOwner({
        id: 'demo-partner-company-001',
        phone: '+996555000002',
        role: 'operator',
        is_active: true,
        is_partner: true,
      });
    }
  }, [isDemo, isInitialized, isAuthenticated]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center">
        <div className="text-center">
          <Icon icon="solar:refresh-linear" width={48} className="text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // In demo mode, allow access
  if (isDemo) {
    if (!isAuthenticated || !owner) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center">
          <div className="text-center">
            <Icon icon="solar:refresh-linear" width={48} className="text-red-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Инициализация демо...</p>
          </div>
        </div>
      );
    }
    return <Outlet />;
  }

  // Production mode
  if (!isAuthenticated || userType !== "owner") {
    return <Navigate to="/auth" replace />;
  }

  // Только партнёры (is_partner === true)
  if (!owner?.is_partner) {
    return <Navigate to="/owner/dashboard" replace />;
  }

  return <Outlet />;
}
