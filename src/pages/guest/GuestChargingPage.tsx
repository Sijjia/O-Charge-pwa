import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { z } from "zod";
import { fetchJson, TransportError } from "@/api/unifiedClient";
import { logger } from "@/shared/utils/logger";

const GuestStatusSchema = z.object({
  energy_consumed: z.number().optional(),
  energy_kwh: z.number().optional(),
  current_cost: z.number().optional(),
  cost_spent: z.number().optional(),
  total_paid: z.number().optional(),
  status: z.string().optional(),
}).passthrough();

const GuestStopSchema = z.object({}).passthrough();

interface GuestChargingStatus {
  energyKwh: number;
  costSpent: number;
  totalPaid: number;
  phone: string;
  status: string;
}

export function GuestChargingPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [data, setData] = useState<GuestChargingStatus>({
    energyKwh: 0,
    costSpent: 0,
    totalPaid: parseInt(sessionStorage.getItem("guestAmount") || "500", 10),
    phone: sessionStorage.getItem("guestPhone") || "",
    status: "charging",
  });
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      navigate("/", { replace: true });
      return;
    }

    // Poll charging status
    const poll = async () => {
      try {
        const result = await fetchJson(
          `/api/v1/guest/status/${sessionId}`,
          { method: "GET", retries: 0 },
          GuestStatusSchema,
        );
        setError(null);

        setData((prev) => ({
          ...prev,
          energyKwh: result.energy_consumed || result.energy_kwh || prev.energyKwh,
          costSpent: result.current_cost || result.cost_spent || prev.costSpent,
          totalPaid: result.total_paid || prev.totalPaid,
          status: result.status || prev.status,
        }));

        if (
          result.status === "completed" ||
          result.status === "stopped" ||
          result.status === "finished"
        ) {
          stopPolling();
          navigate(`/guest/complete/${sessionId}`, { replace: true });
        }
      } catch (err) {
        if (err instanceof TransportError && err.status === 404) {
          setError("Сессия зарядки не найдена");
          stopPolling();
        } else {
          logger.error("[GuestCharging] Poll error:", err);
        }
      }
    };

    poll();
    pollRef.current = setInterval(poll, 5000);

    return () => stopPolling();
  }, [sessionId, navigate, stopPolling]);

  const handleStop = async () => {
    if (isStopping || !sessionId) return;
    setIsStopping(true);

    try {
      await fetchJson(
        `/api/v1/guest/stop/${sessionId}`,
        { method: "POST" },
        GuestStopSchema,
      );
      stopPolling();
      navigate(`/guest/complete/${sessionId}`, { replace: true });
    } catch (err) {
      logger.error("[GuestCharging] Stop error:", err);
      setIsStopping(false);
    }
  };

  const progressPercent =
    data.totalPaid > 0
      ? Math.min((data.costSpent / data.totalPaid) * 100, 100)
      : 0;

  // SVG progress ring: circumference = 2 * PI * 42 = ~264
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (progressPercent / 100) * circumference;

  const maskedPhone = data.phone
    ? data.phone.replace(/(\+996\s?\d{3})\s?\d{3}\s?(\d{3})/, "$1 *** $2")
    : "";

  return (
    <div className="bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 h-screen w-full flex flex-col relative overflow-hidden select-none transition-colors duration-300">
      {/* Ambient */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-red-600/5 dark:bg-red-600/10 blur-[90px] rounded-full pointer-events-none z-0 animate-pulse" />

      {/* Energy Flow Stripes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[0, 0.5, 1.2, 0.8, 1.5, 0.3].map((delay, i) => (
          <div
            key={i}
            className="absolute bg-gradient-to-t from-transparent via-red-600 to-transparent rounded-full opacity-0"
            style={{
              left: `${[48, 52, 35, 65, 42, 58][i]}%`,
              width: `${[3, 2, 3, 3, 3, 3][i]}px`,
              height: `${[150, 200, 120, 140, 180, 160][i]}px`,
              animation: `flow-up-target ${[2, 2.3, 2.5, 2.1, 1.8, 2.2][i]}s infinite linear`,
              animationDelay: `${delay}s`,
              boxShadow: "0 0 15px rgba(220, 38, 38, 0.8)",
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center z-20 shrink-0 relative">
        <button
          onClick={() => navigate("/")}
          className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400 transition-colors backdrop-blur-md shadow-sm dark:shadow-none"
        >
          <Icon icon="solar:arrow-left-linear" width={24} />
        </button>
        <div className="flex-1 text-center pr-10">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            Зарядка идет
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-6 pt-8 pb-32 z-10 w-full max-w-md mx-auto relative overflow-y-auto items-center">
        {/* Error State */}
        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0 mt-0.5" width={18} />
            <div className="flex-1">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={() => navigate("/")}
                className="mt-2 text-xs text-red-400/70 underline hover:text-red-300"
              >
                Вернуться на главную
              </button>
            </div>
          </div>
        )}

        {/* Progress Ring */}
        <div className="relative w-72 h-72 mb-10 flex items-center justify-center">
          <svg
            className="w-64 h-64 transform -rotate-90 relative z-10"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#DC2626"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
              style={{
                filter: "drop-shadow(0 0 8px rgba(220, 38, 38, 0.4))",
              }}
            />
          </svg>

          {/* Inner Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full" />
              <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center relative border border-red-200 dark:border-red-600/30 shadow-[0_0_20px_rgba(220,38,38,0.1)] dark:shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                <Icon
                  icon="solar:bolt-linear"
                  width={32}
                  className="text-red-600 animate-pulse"
                />
              </div>
            </div>
            <div className="flex flex-col items-center mt-1">
              <span className="text-4xl font-bold font-display text-zinc-900 dark:text-white tracking-tighter drop-shadow-lg">
                {data.energyKwh.toFixed(1)}
              </span>
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-[0.2em] mt-1">
                кВтч
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Panel */}
        <div className="w-full bg-white/80 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800/50 relative overflow-hidden z-20 shadow-sm dark:shadow-none">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="flex justify-between items-end mb-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Расход средств</span>
            <div className="text-right">
              <span className="text-lg font-semibold text-zinc-900 dark:text-white font-display">
                {Math.round(data.costSpent)} c
              </span>
              <span className="text-sm text-zinc-500">
                {" "}
                / {data.totalPaid} c
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2.5 w-full bg-zinc-200 dark:bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-300 dark:border-zinc-700/20">
            <div
              className="h-full bg-red-600 rounded-full transition-all duration-1000 relative"
              style={{
                width: `${progressPercent}%`,
                boxShadow: "0 0 12px rgba(220, 38, 38, 0.6)",
              }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/40 blur-[2px]" />
            </div>
          </div>

          {maskedPhone && (
            <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60">
              <Icon
                icon="solar:smartphone-linear"
                className="text-zinc-500 shrink-0 mt-0.5"
                width={16}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Чек придет в SMS на номер{" "}
                <span className="text-zinc-700 dark:text-zinc-300 font-mono">{maskedPhone}</span>{" "}
                после завершения
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-zinc-50 via-zinc-50 dark:from-[#0A0E17] dark:via-[#0A0E17] to-transparent z-40 flex justify-center backdrop-blur-sm">
        <div className="w-full max-w-md">
          <button
            onClick={handleStop}
            disabled={isStopping}
            className="group relative w-full overflow-hidden rounded-xl bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-600/40 p-4 transition-all hover:bg-red-50 dark:hover:bg-red-600/10 active:scale-[0.98] shadow-sm dark:shadow-none"
          >
            <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-center gap-3 text-red-600 group-hover:text-red-500 transition-colors">
              {isStopping ? (
                <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
              ) : (
                <Icon icon="solar:stop-circle-linear" width={22} />
              )}
              <span className="font-semibold text-sm">
                {isStopping ? "Остановка..." : "Остановить"}
              </span>
            </div>
            <div className="mt-1 text-center">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium">
                Без возврата остатка
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default GuestChargingPage;
