import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { logger } from "@/shared/utils/logger";

interface GuestCompleteData {
  energyKwh: number;
  totalCost: number;
  duration: number;
}

export function GuestCompletePage() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [data, setData] = useState<GuestCompleteData>({
    energyKwh: 0,
    totalCost: 0,
    duration: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      navigate("/", { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/v1/guest/status/${sessionId}`);
        if (res.ok) {
          const result = await res.json();
          setData({
            energyKwh: result.energy_consumed || result.energy_kwh || 0,
            totalCost: result.current_cost || result.total_cost || 0,
            duration: result.duration_seconds || result.duration || 0,
          });
        }
      } catch (err) {
        logger.error("[GuestComplete] Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Cleanup session data
    sessionStorage.removeItem("guestStationCode");
    sessionStorage.removeItem("guestPhone");
    sessionStorage.removeItem("guestPaymentData");
    sessionStorage.removeItem("guestAmount");
  }, [sessionId, navigate]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours} ч ${minutes} мин`;
    return `${minutes} мин`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0E17] flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto" />
          <p className="mt-4 text-zinc-500 dark:text-zinc-400">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 h-screen w-full flex flex-col relative overflow-hidden select-none transition-colors duration-300">
      {/* Ambient Green Glow Top */}
      <div className="fixed top-0 inset-x-0 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[100px] pointer-events-none z-0" />

      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between z-20 shrink-0">
        <div className="w-10" />
        <h1 className="text-sm font-medium tracking-wide text-zinc-400 dark:text-zinc-500 uppercase">
          Чек
        </h1>
        <button
          onClick={() => navigate("/")}
          className="w-10 h-10 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <Icon icon="solar:close-circle-linear" width={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto hide-scroll p-6 flex flex-col items-center relative z-10 w-full max-w-md mx-auto">
        {/* Animation Section */}
        <div className="relative flex flex-col items-center justify-center py-8">
          {/* Particles */}
          <div
            className="absolute w-1 h-1 left-10 top-10 rounded-full bg-emerald-500 opacity-0"
            style={{ animation: "float-up 3s ease-out 0.5s infinite" }}
          />
          <div
            className="absolute w-1.5 h-1.5 right-12 top-6 rounded-full bg-emerald-500 opacity-0"
            style={{ animation: "float-up 4s ease-out 1.2s infinite" }}
          />
          <div
            className="absolute w-1 h-1 left-20 bottom-0 rounded-full bg-emerald-500 opacity-0"
            style={{ animation: "float-up 2.5s ease-out 2s infinite" }}
          />

          <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 animate-success-pulse relative">
            <div className="absolute inset-0 rounded-full border border-emerald-500/20" />
            <svg className="w-12 h-12 text-emerald-500" viewBox="0 0 52 52">
              <circle
                className="checkmark-circle"
                cx="26"
                cy="26"
                r="25"
                fill="none"
                stroke="#10B981"
              />
              <path
                className="checkmark-check"
                fill="none"
                d="M14.1 27.2l7.1 7.2 16.7-16.8"
                strokeWidth="3"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-semibold font-display tracking-tight text-zinc-900 dark:text-white text-center mb-2">
            Зарядка завершена!
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center">
            Спасибо, что выбрали Red Petroleum
          </p>
        </div>

        {/* Receipt Card */}
        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-lg dark:shadow-2xl dark:shadow-black/50 mt-2 relative group">
          <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-[0.03] group-hover:animate-shine left-[120%]" />

          <div className="p-6 flex flex-col items-center gap-6">
            {/* Total Amount */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
                Итого
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-semibold font-display tracking-tighter text-zinc-900 dark:text-white">
                  {data.totalCost.toFixed(2)}
                </span>
                <span className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">сом</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl p-3 border border-zinc-200 dark:border-zinc-800/50 flex flex-col items-center justify-center gap-1">
                <span className="text-zinc-400 dark:text-zinc-500 text-xs">Объем</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold tracking-tight">
                  {data.energyKwh.toFixed(1)}{" "}
                  <span className="text-xs font-normal text-zinc-500">
                    кВтч
                  </span>
                </span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl p-3 border border-zinc-200 dark:border-zinc-800/50 flex flex-col items-center justify-center gap-1">
                <span className="text-zinc-400 dark:text-zinc-500 text-xs">Время</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold tracking-tight">
                  {formatTime(data.duration)}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="w-full flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60">
              <Icon
                icon="solar:smartphone-linear"
                className="text-zinc-500 shrink-0 mt-0.5"
                width={16}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Чек отправлен в SMS на указанный номер телефона
              </p>
            </div>
          </div>
        </div>

        {/* CTA to create account */}
        <div className="w-full mt-8 pb-32">
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 text-center shadow-sm dark:shadow-none">
            <Icon
              icon="solar:user-plus-linear"
              width={28}
              className="text-red-400 mx-auto mb-3"
            />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
              Создайте аккаунт
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
              Получайте баланс, историю зарядок и управляйте картой
            </p>
            <button
              onClick={() => navigate("/auth/phone")}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
            >
              Зарегистрироваться
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="absolute bottom-0 inset-x-0 bg-zinc-50/90 dark:bg-[#0A0E17]/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 p-5 pb-8 z-30">
        <button
          onClick={() => navigate("/")}
          className="w-full py-4 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] rounded-2xl text-white dark:text-black font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          <span>Готово</span>
        </button>
      </div>
    </div>
  );
}

export default GuestCompletePage;
