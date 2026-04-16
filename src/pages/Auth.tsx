import { useNavigate } from "react-router-dom";
import { useCallback, useState } from "react";
import { Icon } from "@iconify/react";
import { PhoneAuthForm } from "../features/auth/components/PhoneAuthForm";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";
import { startSSOLogin, SSO_ENABLED } from "@/features/auth/services/ssoService";
import rpLogo from "@/assets/rp-logo.svg";

const API_BASE = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL as string | undefined) || ""
  : "";

interface QuickRole {
  label: string;
  description: string;
  icon: string;
  color: string;
  redirect: string;
  userId: string;
  storeLogin: () => void;
}

export default function Auth() {
  const navigate = useNavigate();
  const { loginAsOwner, login } = useUnifiedAuthStore();
  const [loading, setLoading] = useState<string | null>(null);

  const now = new Date().toISOString();

  const quickLogin = useCallback(
    async (role: QuickRole) => {
      setLoading(role.label);
      try {
        // 1. Получаем JWT cookie через dev-login endpoint
        const resp = await fetch(`${API_BASE}/api/v1/auth/dev-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ user_id: role.userId }),
        });
        const data = await resp.json();
        if (!data.success) {
          console.error("Dev login failed:", data);
          setLoading(null);
          return;
        }
        // 2. Обновляем Zustand store для UI
        role.storeLogin();
        // 3. Навигируем на дашборд
        navigate(role.redirect, { replace: true });
      } catch (e) {
        console.error("Dev login error:", e);
      } finally {
        setLoading(null);
      }
    },
    [navigate],
  );

  const roles: QuickRole[] = [
    {
      label: "Клиент",
      description: "Зарядка авто, баланс, история",
      icon: "solar:user-bold",
      color: "bg-blue-600 hover:bg-blue-700",
      redirect: "/",
      userId: "test-client-001",
      storeLogin: () =>
        login({
          id: "test-client-001",
          email: null,
          phone: "+996700000001",
          name: "Test User",
          balance: 5000,
          status: "active",
          favoriteStations: [],
          createdAt: now,
          updatedAt: now,
        }),
    },
    {
      label: "Оператор",
      description: "Станции региона, сессии, доход",
      icon: "solar:settings-bold",
      color: "bg-emerald-600 hover:bg-emerald-700",
      redirect: "/owner/dashboard",
      userId: "test-operator-001",
      storeLogin: () =>
        loginAsOwner({
          id: "test-operator-001",
          phone: "+996555000001",
          role: "operator",
          is_active: true,
          is_partner: false,
        }),
    },
    {
      label: "Админ",
      description: "Все станции, аналитика, система",
      icon: "solar:shield-bold",
      color: "bg-red-600 hover:bg-red-700",
      redirect: "/admin/dashboard",
      userId: "test-admin-001",
      storeLogin: () =>
        loginAsOwner({
          id: "test-admin-001",
          phone: "+996555000000",
          role: "admin",
          is_active: true,
          is_partner: false,
        }),
    },
    {
      label: "Партнёр",
      description: "Свои станции, выручка, настройки",
      icon: "solar:buildings-bold",
      color: "bg-purple-600 hover:bg-purple-700",
      redirect: "/partner/dashboard",
      userId: "test-partner-001",
      storeLogin: () =>
        loginAsOwner({
          id: "test-partner-001",
          phone: "+996555000002",
          role: "operator",
          is_active: true,
          is_partner: true,
        }),
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex flex-col md:flex-row font-sans selection:bg-red-500/30">

      {/* Left/Top Branding Panel (Split Layout on Desktop) */}
      <div className="relative w-full md:w-5/12 lg:w-1/2 flex flex-col justify-between p-8 bg-zinc-900 border-r border-zinc-800 overflow-hidden md:min-h-screen">
        {/* Decorative Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-zinc-900 to-black pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between w-full">
          <img src={rpLogo} alt="Red Petroleum" className="h-8 md:h-10 w-auto" />
          <button
            aria-label="Назад"
            onClick={() => navigate(-1)}
            className="md:hidden p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            <Icon icon="solar:arrow-left-linear" width={24} />
          </button>
        </div>

        <div className="relative z-10 mt-12 mb-8 md:my-auto">
          <h1 className="text-3xl md:text-5xl font-bold font-display tracking-tight text-white leading-tight mb-4">
            Добро пожаловать в<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">
              Red Charge
            </span>
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-sm leading-relaxed">
            Премиальная сеть зарядных станций для электромобилей. Управляйте балансом, находите станции и заряжайтесь с комфортом.
          </p>
        </div>

        {/* Benefits Row */}
        <div className="relative z-10 hidden md:grid grid-cols-3 gap-4 text-xs font-medium text-zinc-300">
          <div className="flex flex-col gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <Icon icon="solar:history-bold-duotone" width={22} className="text-red-500" />
            <span>История сессий</span>
          </div>
          <div className="flex flex-col gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <Icon icon="solar:heart-bold-duotone" width={22} className="text-red-500" />
            <span>Избранные станции</span>
          </div>
          <div className="flex flex-col gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <Icon icon="solar:wallet-bold-duotone" width={22} className="text-red-500" />
            <span>Система бонусов</span>
          </div>
        </div>
      </div>

      {/* Right/Bottom Auth Container */}
      <div className="flex-1 flex flex-col relative z-20 bg-white dark:bg-[#050507] md:bg-transparent -mt-6 md:mt-0 rounded-t-3xl md:rounded-none">

        {/* Desktop Back Button */}
        <div className="hidden md:flex justify-end p-8">
          <button
            aria-label="Назад"
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            <Icon icon="solar:close-circle-linear" width={28} />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 md:p-8">
          <div className="w-full max-w-sm flex flex-col">

            {/* PhoneAuth Component handles the core logic and OTP screens */}
            <PhoneAuthForm redirectTo="/" />

            {/* SSO for staff */}
            {SSO_ENABLED && (
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    Для сотрудников
                  </span>
                  <div className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
                </div>
                <button
                  type="button"
                  onClick={startSSOLogin}
                  className="w-full h-12 flex items-center justify-center gap-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium text-sm transition-all hover:border-red-500/30 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98]"
                >
                  <Icon icon="solar:shield-keyhole-linear" width={20} />
                  Войти через SSO
                </button>
              </div>
            )}

            {/* Dev Login Section — quick role-based login */}
            {(
              <div className="mt-10 px-1">
                <div className="flex items-center gap-3 mb-4 opacity-50">
                  <div className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Dev Options</span>
                  <div className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {roles.map((role) => (
                    <button
                      key={role.label}
                      type="button"
                      disabled={loading !== null}
                      onClick={() => quickLogin(role)}
                      className={`group relative overflow-hidden flex flex-col p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 transition-all hover:border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)] active:scale-95 ${loading === role.label ? "opacity-60" : ""}`}
                    >
                      <div className={`absolute top-0 right-0 w-16 h-16 blur-2xl rounded-full transition-opacity opacity-0 group-hover:opacity-20 ${role.color.split(" ")[0]}`} />

                      {loading === role.label ? (
                        <Icon icon="svg-spinners:ring-resize" width={20} className="text-zinc-400 mb-2" />
                      ) : (
                        <Icon icon={role.icon} width={20} className="text-zinc-500 dark:text-zinc-400 group-hover:text-red-500 transition-colors mb-2" />
                      )}

                      <div className="text-left z-10">
                        <div className="text-xs font-semibold text-zinc-900 dark:text-white leading-tight mb-0.5">
                          {role.label}
                        </div>
                        <div className="text-[9px] text-zinc-500 dark:text-zinc-500 leading-tight line-clamp-2">
                          {role.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
