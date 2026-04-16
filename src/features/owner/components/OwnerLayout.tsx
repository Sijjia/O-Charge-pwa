/**
 * Owner Dashboard Layout
 * Main layout component with sidebar navigation
 * Unified design matching AdminLayout
 */

import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { useOwnerAuth } from "../hooks/useOwnerAuth";
import { logger } from "@/shared/utils/logger";
import { RequireRole } from "@/shared/components/RequireRole";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import type { UserRole } from "@/features/auth/types/unified.types";
import rpLogo from "@/assets/rp-logo.svg";
import { APP_VERSION } from "@/lib/versionManager";

interface NavItem {
  to: string;
  icon: string;
  label: string;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      { to: "/owner/dashboard", icon: "solar:widget-2-bold-duotone", label: "Обзор" },
    ],
  },
  {
    title: "Инфраструктура",
    items: [
      { to: "/owner/stations", icon: "solar:charging-socket-bold-duotone", label: "Станции" },
      { to: "/owner/locations", icon: "solar:map-point-bold-duotone", label: "Локации" },
      { to: "/owner/sessions", icon: "solar:bolt-circle-bold-duotone", label: "Сессии" },
    ],
  },
  {
    title: "Бизнес",
    items: [
      { to: "/owner/revenue", icon: "solar:card-transfer-bold-duotone", label: "Доходы" },
      { to: "/owner/tariffs", icon: "solar:tag-price-bold-duotone", label: "Тарифы" },
      { to: "/owner/corporate", icon: "solar:buildings-bold-duotone", label: "Корпоративные" },
    ],
  },
  {
    title: "Система",
    items: [
      { to: "/owner/incidents", icon: "solar:danger-triangle-bold-duotone", label: "Инциденты" },
      { to: "/owner/logs", icon: "solar:document-text-bold-duotone", label: "OCPP Логи" },
      { to: "/owner/operators", icon: "solar:shield-user-bold-duotone", label: "Операторы" },
      { to: "/owner/users", icon: "solar:user-id-bold-duotone", label: "Пользователи" },
    ],
  },
];

const roleMap: Record<string, ReadonlyArray<UserRole>> = {
  "/owner/operators": ["superadmin"],
  "/owner/users": ["superadmin"],
  "/owner/logs": ["admin", "superadmin"],
  "/owner/corporate": ["admin", "superadmin"],
};

const defaultAllowed: ReadonlyArray<UserRole> = ["operator", "admin", "superadmin"];

export function OwnerLayout() {
  const navigate = useNavigate();
  const { user } = useOwnerAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const { useUnifiedAuthStore } = await import("@/features/auth/unifiedAuthStore");
      await fetch(`${import.meta.env.VITE_API_URL || ""}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
      useUnifiedAuthStore.getState().logout();
      logger.info("[OwnerLayout] User logged out successfully");
      navigate("/", { replace: true });
    } catch (error) {
      logger.error("[OwnerLayout] Logout failed", { error });
    }
  };

  const renderNavItems = (onItemClick?: () => void) => (
    <>
      {navGroups.map((group, groupIdx) => (
        <div key={group.title ?? groupIdx}>
          {groupIdx > 0 && (
            <div className="my-2 border-t border-zinc-200 dark:border-zinc-800" />
          )}
          {group.title && (
            <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {group.title}
            </p>
          )}
          {group.items.map((item) => {
            const allowed = roleMap[item.to] ?? defaultAllowed;
            return (
              <RequireRole key={item.to} allowed={allowed}>
                <NavLink
                  to={item.to}
                  end={item.to === "/owner/dashboard"}
                  onClick={onItemClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group ${
                      isActive
                        ? "text-red-600 dark:text-red-500 font-bold bg-gradient-to-r from-red-500/10 to-transparent border-l-4 border-red-600 dark:border-red-500"
                        : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white border-l-4 border-transparent"
                    }`
                  }
                >
                  <Icon icon={item.icon} width={20} className="relative z-10 transition-transform group-hover:scale-110" />
                  <span className="relative z-10">{item.label}</span>
                </NavLink>
              </RequireRole>
            );
          })}
        </div>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-9 h-9 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-600/20">
              <img src={rpLogo} alt="RP Logo" className="w-full h-full object-cover scale-[1.2]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
                Red Charge
              </h1>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider">
                Owner Portal <span className="font-mono text-zinc-300 dark:text-zinc-600">v{APP_VERSION}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
          {renderNavItems()}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex justify-center">
            <ThemeToggle compact />
          </div>

          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
              <Icon icon="solar:user-linear" width={16} className="text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-900 dark:text-white truncate">
                {user?.email}
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 capitalize">
                {user?.role || "operator"}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-blue-600 hover:bg-blue-500/10 rounded-lg transition-colors text-sm"
          >
            <Icon icon="solar:map-bold-duotone" width={18} />
            <span className="font-medium">На карту</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
          >
            <Icon icon="solar:logout-2-bold-duotone" width={18} />
            <span className="font-medium">Выйти</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 z-40">
        <div className="h-full flex items-center justify-between px-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 px-2 py-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors"
          >
            <Icon icon="solar:alt-arrow-left-linear" width={20} />
            <Icon icon="solar:map-linear" width={20} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 overflow-hidden rounded-lg bg-red-600 flex items-center justify-center">
              <img src={rpLogo} alt="RP Logo" className="w-full h-full object-cover scale-[1.2]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-900 dark:text-white">Red Charge</h1>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 -mt-0.5">Owner Portal <span className="font-mono text-zinc-300 dark:text-zinc-600">v{APP_VERSION}</span></p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? (
              <Icon icon="solar:close-linear" width={24} />
            ) : (
              <Icon icon="solar:hamburger-menu-linear" width={24} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 bottom-0 w-[80%] max-w-sm bg-white dark:bg-zinc-950 overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-14 flex items-center justify-between px-5 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-red-600 flex items-center justify-center">
                    <img src={rpLogo} alt="RP Logo" className="w-full h-full object-cover scale-[1.2]" />
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-white">Red Charge</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  <Icon icon="solar:close-square-linear" width={24} />
                </button>
              </div>

              <nav className="px-3 py-4 space-y-0.5">
                {renderNavItems(() => setIsMobileMenuOpen(false))}
              </nav>

              <div className="mx-4 border-t border-zinc-200 dark:border-zinc-800" />

              <div className="p-3 space-y-3">
                <div className="flex justify-center py-2">
                  <ThemeToggle />
                </div>

                <div className="flex items-center gap-3 px-3 py-3 bg-zinc-50 dark:bg-white/5 rounded-xl">
                  <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                    <Icon icon="solar:user-linear" width={20} className="text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 capitalize">
                      {user?.role || "operator"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate("/"); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-blue-600 hover:bg-blue-500/10 rounded-xl transition-colors"
                >
                  <Icon icon="solar:map-bold-duotone" width={20} />
                  <span className="font-medium">На карту</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-red-600 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <Icon icon="solar:logout-2-bold-duotone" width={20} />
                  <span className="font-medium">Выйти</span>
                </button>
              </div>

              <div className="h-8" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="lg:pt-0 pt-14">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
