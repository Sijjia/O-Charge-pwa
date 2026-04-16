import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";
import { useEffect } from "react";

export function CorporateLoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useUnifiedAuthStore();

  // Если уже авторизован — сразу на dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/corporate/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0E17] flex items-center justify-center p-4 transition-colors">
      {/* Ambient glows */}
      <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] bg-red-600/5 dark:bg-red-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg dark:shadow-red-900/30">
            <Icon icon="solar:buildings-2-linear" width={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-display tracking-tight">
            Корпоративный кабинет
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            Red Petroleum EV Charging
          </p>
        </div>

        {/* Info */}
        <div className="bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 mb-6">
          <div className="flex items-start gap-3">
            <Icon icon="solar:info-circle-linear" width={20} className="text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>Для доступа к корпоративному кабинету войдите через SMS OTP.</p>
              <p>Ваш номер телефона должен быть привязан к корпоративному аккаунту администратором компании.</p>
            </div>
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={() => navigate("/auth/phone", { state: { redirect: "/corporate/dashboard" } })}
          className="w-full h-14 rounded-xl font-semibold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white shadow-lg dark:shadow-red-900/20"
        >
          <Icon icon="solar:phone-linear" width={20} />
          Войти через SMS
        </button>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Для получения доступа обратитесь к менеджеру
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-3 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors flex items-center gap-1.5 mx-auto"
          >
            <Icon icon="solar:alt-arrow-left-linear" width={16} />
            На главную
          </button>
        </div>
      </div>
    </div>
  );
}

export default CorporateLoginPage;
