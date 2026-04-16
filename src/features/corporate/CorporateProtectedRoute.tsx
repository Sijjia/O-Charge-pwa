import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";

export function CorporateProtectedRoute() {
  const { isAuthenticated, isInitialized } = useUnifiedAuthStore((s) => ({
    isAuthenticated: s.isAuthenticated,
    isInitialized: s.isInitialized,
  }));

  const isDemo = isDemoModeActive();

  useEffect(() => {
    if (isDemo && isInitialized && !isAuthenticated) {
      // Demo: Corporate employee from "ООО Азия Карго"
      const now = new Date().toISOString();
      useUnifiedAuthStore.getState().login({
        id: 'demo-corporate-employee-aziya-001',
        email: 'driver@asiacargo.kg',
        phone: '+996555000003',
        name: 'Арслан Жумалиев',
        balance: 50000,
        status: 'active',
        favoriteStations: [],
        createdAt: now,
        updatedAt: now,
      });
    }
  }, [isDemo, isInitialized, isAuthenticated]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center">
        <div className="text-center">
          <Icon
            icon="solar:refresh-linear"
            width={48}
            className="text-red-500 animate-spin mx-auto mb-4"
          />
          <p className="text-zinc-500 dark:text-gray-400">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // In demo mode, allow access after auto-login
  if (isDemo) {
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center">
          <div className="text-center">
            <Icon
              icon="solar:refresh-linear"
              width={48}
              className="text-red-500 animate-spin mx-auto mb-4"
            />
            <p className="text-zinc-500 dark:text-gray-400">Инициализация демо...</p>
          </div>
        </div>
      );
    }
    return <Outlet />;
  }

  // Production mode: Любой авторизованный пользователь может попытаться зайти.
  // Backend endpoints сами проверяют corporate_employees и вернут 403 если нет доступа.
  if (!isAuthenticated) {
    return <Navigate to="/corporate/login" replace />;
  }

  return <Outlet />;
}

export default CorporateProtectedRoute;
