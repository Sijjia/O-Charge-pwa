import { useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuthStatus } from "@/features/auth/hooks/useAuth";
import { useActiveChargingSession } from "@/features/charging/hooks/useActiveChargingSession";

interface NavItem {
  path: string;
  label: string;
  iconActive: string;
  iconInactive: string;
  authRequired?: boolean;
}

const navItems: NavItem[] = [
  {
    path: "/",
    label: "Карта",
    iconActive: "solar:map-point-bold",
    iconInactive: "solar:map-point-linear",
  },
  {
    path: "/history",
    label: "История",
    iconActive: "solar:history-bold",
    iconInactive: "solar:history-linear",
    authRequired: true,
  },
  {
    path: "/payments",
    label: "Баланс",
    iconActive: "solar:wallet-bold",
    iconInactive: "solar:wallet-linear",
    authRequired: true,
  },
  {
    path: "/profile",
    label: "Профиль",
    iconActive: "solar:user-bold",
    iconInactive: "solar:user-linear",
  },
];

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStatus();
  const { activeSession, hasActiveSession } = useActiveChargingSession();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const updateNavHeight = () => {
      const height = nav.offsetHeight;
      document.documentElement.style.setProperty("--nav-height", `${height}px`);
    };

    const observer = new ResizeObserver(updateNavHeight);
    observer.observe(nav);
    updateNavHeight();

    return () => observer.disconnect();
  }, []);

  // Hide navigation on auth pages
  if (location.pathname.startsWith("/auth")) {
    return null;
  }

  const handleChargingClick = () => {
    if (activeSession?.sessionId) {
      navigate(`/charging-process/${activeSession.sessionId}`, {
        state: { stationId: activeSession.stationId },
      });
    }
  };

  return (
    <nav
      ref={navRef}
      aria-label="Основная навигация"
      className="fixed left-0 right-0 bottom-0 z-50 bg-white dark:bg-zinc-950/90 backdrop-blur-2xl border-t border-zinc-200/50 dark:border-zinc-800/50 transition-colors duration-500 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] pb-[env(safe-area-inset-bottom)]"
    >
      {/* Active charging banner */}
      {hasActiveSession && (
        <div
          className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 cursor-pointer shadow-lg relative overflow-hidden"
          onClick={handleChargingClick}
        >
          <div className="absolute inset-0 bg-white/10 w-full h-full animate-pulse z-0" />
          <div className="flex items-center justify-between max-w-md mx-auto relative z-10">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Icon icon="solar:bolt-bold" width={20} className="text-white" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
              </div>
              <span className="text-white text-sm font-semibold tracking-wide">
                Идёт зарядка
              </span>
            </div>
            <div className="flex items-center gap-3 text-white text-sm">
              {activeSession?.energyKwh !== undefined && (
                <span className="font-medium opacity-90">{activeSession.energyKwh.toFixed(2)} кВт·ч</span>
              )}
              {activeSession?.amount !== undefined && (
                <span className="font-bold bg-white/20 px-2 py-0.5 rounded-md">
                  {activeSession.amount.toFixed(0)} сом
                </span>
              )}
              <Icon icon="solar:alt-arrow-right-line-duotone" width={20} className="opacity-80" />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end h-[72px] w-full max-w-md mx-auto px-2 pb-2">
        <NavItem item={navItems[0]!} location={location} isAuthenticated={isAuthenticated} />
        <NavItem item={navItems[1]!} location={location} isAuthenticated={isAuthenticated} />

        {/* Central FAB for QR/Charging */}
        <div className="relative -top-5 flex flex-col items-center z-10">
          <Link
            to="/qr-scanner"
            className="flex items-center justify-center w-14 h-14 bg-red-600 rounded-full text-white shadow-[0_8px_20px_-4px_rgba(220,38,38,0.6)] hover:bg-red-700 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <Icon icon="solar:scanner-line-duotone" width={28} />
          </Link>
          <span className="text-[10px] font-medium tracking-wide mt-1.5 text-zinc-500 dark:text-zinc-400">
            Зарядка
          </span>
        </div>

        <NavItem item={navItems[2]!} location={location} isAuthenticated={isAuthenticated} />
        <NavItem item={navItems[3]!} location={location} isAuthenticated={isAuthenticated} />
      </div>
    </nav>
  );
}

// Sub-component for nav items
function NavItem({ item, location, isAuthenticated }: { item: NavItem, location: any, isAuthenticated: boolean }) {
  const isActive = item.path === "/"
    ? location.pathname === "/"
    : location.pathname.startsWith(item.path);

  let target = item.path;
  if (item.authRequired && !isAuthenticated) {
    target = `${item.path}?auth=required`;
  }

  return (
    <Link
      to={target}
      aria-current={isActive ? "page" : undefined}
      aria-label={item.label}
      className={`flex flex-col items-center justify-center gap-1.5 w-[20%] transition-all duration-300 group active:scale-90 ${isActive
        ? "text-red-600"
        : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
        }`}
    >
      <div className="relative flex items-center justify-center h-8">
        <Icon
          icon={isActive ? item.iconActive : item.iconInactive}
          width={24}
          className={`transition-all duration-300 ${isActive ? "scale-110 drop-shadow-md" : "group-active:scale-90"}`}
        />
        {isActive && (
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-600 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.6)]" />
        )}
      </div>
      <span className={`text-[10px] tracking-wide transition-all ${isActive ? "font-semibold" : "font-medium"}`}>
        {item.label}
      </span>
    </Link>
  );
}
