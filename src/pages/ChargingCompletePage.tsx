import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { rpApi } from "../services/rpApi";
import { supabase } from "@/shared/config/supabase";
import { logger } from "@/shared/utils/logger";
import { useAuthStatus } from "@/features/auth/hooks/useAuth";
import { ConfettiEffect } from "@/shared/components/ConfettiEffect";

interface ChargingCompleteData {
  sessionId: string;
  evBatterySoc?: number;
  energyDelivered: number;
  duration: number;
  totalCost: number;
  stationId: string;
  startTime?: string;
  endTime?: string;
  refundAmount?: number;
  newBalance?: number;
}

export const ChargingCompletePage = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  useAuthStatus();
  const [sessionData, setSessionData] = useState<ChargingCompleteData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      navigate("/");
      return;
    }

    const fetchSessionData = async () => {
      try {
        // Сначала проверяем сохраненные данные из sessionStorage
        const savedData = sessionStorage.getItem("lastChargingData");
        let useSavedData = false;

        // Читаем результат остановки (содержит refund_amount, new_balance)
        const stopResultRaw = sessionStorage.getItem("chargingStopResult");
        let stopResult: { refund_amount?: number; new_balance?: number } | null = null;
        if (stopResultRaw) {
          try { stopResult = JSON.parse(stopResultRaw); } catch { /* ignore */ }
          sessionStorage.removeItem("chargingStopResult");
        }

        if (savedData) {
          const parsed = JSON.parse(savedData);
          // Проверяем, что данные валидны (не нули) - иначе запросим с сервера
          const hasValidData =
            (parsed.energyConsumedKwh && parsed.energyConsumedKwh > 0) ||
            (parsed.currentAmount && parsed.currentAmount > 0);

          if (hasValidData) {
            setSessionData({
              sessionId: sessionId,
              evBatterySoc: parsed.evBatterySoc,
              energyDelivered: parsed.energyConsumedKwh || 0,
              duration: parsed.duration || 0,
              totalCost: parsed.currentAmount || 0,
              stationId: parsed.stationId || "",
              startTime: parsed.startTime,
              endTime: parsed.endTime,
              refundAmount: stopResult?.refund_amount,
              newBalance: stopResult?.new_balance,
            });
            useSavedData = true;
          }
          sessionStorage.removeItem("lastChargingData");
        }

        // Если нет сохраненных данных или они невалидны - получаем с сервера
        if (!useSavedData) {
          const response = await rpApi.getChargingStatus(sessionId);

          if (response.success && response.session) {
            setSessionData({
              sessionId: sessionId,
              evBatterySoc: response.session.ev_battery_soc ?? undefined,
              energyDelivered: response.session.energy_consumed || 0,
              duration: (response.session.charging_duration_minutes ?? 0) * 60,
              totalCost: response.session.current_cost || 0,
              stationId: response.session.station_id || "",
              startTime: response.session.start_time ?? undefined,
              endTime: response.session.stop_time ?? undefined,
            });
          }
        }
      } catch (error) {
        logger.error("Error fetching session data:", error);
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();

    // Очищаем активную сессию из localStorage
    localStorage.removeItem("activeChargingSession");
  }, [sessionId, navigate]);

  const handleDownloadPdf = async () => {
    if (!sessionId || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const base = (import.meta.env["VITE_API_URL"] as string | undefined) || "";
      const url = `${base}/api/v1/charging/receipt/${sessionId}`;
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const resp = await fetch(url, { headers });
      if (!resp.ok) throw new Error("PDF generation failed");
      const blob = await resp.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `receipt_${sessionId.slice(0, 8)}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      logger.error("[ChargingComplete] PDF download failed:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} ч ${minutes} мин`;
    }
    return `${minutes} мин`;
  };

  const handleShare = async () => {
    try {
      if ('share' in navigator) {
        await navigator.share({
          title: "Зарядка завершена",
          text: `Я зарядил свой электромобиль на станции Red Petroleum!\nОбъем: ${sessionData?.energyDelivered.toFixed(1)} кВтч\nСтоимость: ${sessionData?.totalCost.toFixed(0)} сом`,
        });
      } else {
        logger.info("Web Share API not supported");
      }
    } catch (e) {
      logger.error("Share failed", e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0E17] flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-zinc-500 dark:text-zinc-400">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0E17] flex flex-col items-center justify-center px-6 transition-colors duration-300">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Icon icon={loadError ? "solar:danger-triangle-linear" : "solar:file-corrupted-linear"} width={28} className="text-zinc-400 dark:text-zinc-500" />
          </div>
          <p className="text-lg font-medium text-zinc-800 dark:text-zinc-300 mb-2">
            {loadError ? "Не удалось загрузить данные" : "Данные сессии не найдены"}
          </p>
          <p className="text-sm text-zinc-500 mb-6">
            {loadError
              ? "Зарядка завершена, но чек временно недоступен. Данные появятся в истории."
              : "Сессия не найдена или уже обработана."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/history")}
              className="flex-1 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              История
            </button>
            <button
              onClick={() => navigate("/stations")}
              className="flex-1 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              К станциям
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 h-screen w-full flex flex-col relative overflow-hidden select-none transition-colors duration-300">
      <ConfettiEffect />
      {/* Ambient Green Glow Top */}
      <div className="fixed top-0 inset-x-0 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[100px] pointer-events-none z-0" />

      {/* Header (Minimal) */}
      <div className="px-4 pt-10 pb-2 flex items-center justify-between z-20 shrink-0">
        <div className="w-10" />
        <h1 className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
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
      <div className="flex-1 overflow-y-auto hide-scroll px-5 pb-40 flex flex-col items-center relative z-10 w-full max-w-md mx-auto">
        {/* Animation Section */}
        <div className="relative flex flex-col items-center justify-center py-4">
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

          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 animate-success-pulse relative">
            <div className="absolute inset-0 rounded-full border border-emerald-500/20" />
            <svg className="w-9 h-9 text-emerald-500" viewBox="0 0 52 52">
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

          <h2 className="text-xl font-semibold font-display tracking-tight text-zinc-900 dark:text-white text-center mb-1">
            Зарядка завершена!
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs text-center">
            Спасибо, что выбрали Red Petroleum
          </p>
        </div>

        {/* Receipt Card */}
        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xl shadow-zinc-200/50 dark:shadow-black/50 relative group transition-colors duration-300">
          {/* Gradient Shine */}
          <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-[0.03] group-hover:animate-shine left-[120%]" />

          <div className="p-5 flex flex-col items-center gap-4">
            {/* Total Amount */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">
                Итого
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold font-display tracking-tighter text-zinc-900 dark:text-white">
                  {sessionData.totalCost.toFixed(2)}
                </span>
                <span className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">сом</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl p-3 border border-zinc-100 dark:border-zinc-800/50 flex flex-col items-center justify-center gap-1 transition-colors">
                <span className="text-zinc-500 text-xs">Объем</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold tracking-tight">
                  {sessionData.energyDelivered.toFixed(1)}{" "}
                  <span className="text-xs font-normal text-zinc-500">
                    кВтч
                  </span>
                </span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl p-3 border border-zinc-100 dark:border-zinc-800/50 flex flex-col items-center justify-center gap-1 transition-colors">
                <span className="text-zinc-500 text-xs">Время</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold tracking-tight">
                  {formatTime(sessionData.duration)}
                </span>
              </div>
            </div>

            {/* Dashed Divider */}
            <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800 border-t border-dashed border-zinc-300 dark:border-zinc-700" />

            {/* Refund Row */}
            {(sessionData.refundAmount ?? 0) > 0 && (
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Icon icon="solar:card-recive-linear" width={18} />
                  </div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Возврат резерва
                  </span>
                </div>
                <span className="text-sm font-semibold text-emerald-400 font-display">
                  +{(sessionData.refundAmount ?? 0).toFixed(2)} сом
                </span>
              </div>
            )}

            {/* Download PDF & Share row */}
            <div className="w-full flex gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="flex-1 flex items-center justify-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 transition-all group/btn disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Icon
                    icon={isDownloadingPdf ? "solar:loading-linear" : "solar:file-text-linear"}
                    className={`text-zinc-500 dark:text-zinc-400 ${isDownloadingPdf ? "animate-spin" : ""}`}
                    width={18}
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {isDownloadingPdf ? "Загрузка..." : "Скачать PDF"}
                  </span>
                </div>
              </button>

              {'share' in navigator && (
                <button
                  onClick={handleShare}
                  className="w-12 shrink-0 flex items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 transition-all"
                  aria-label="Поделиться чеком"
                >
                  <Icon icon="solar:share-linear" className="text-zinc-500 dark:text-zinc-400" width={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom spacing for sticky CTA */}
        <div className="pb-32" />
      </div>

      {/* Sticky Bottom CTA */}
      <div className="absolute bottom-0 inset-x-0 bg-white/90 dark:bg-[#0A0E17]/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 p-5 z-30 transition-colors duration-300"
        style={{ paddingBottom: "calc(var(--nav-height, 0px) + env(safe-area-inset-bottom, 0px) + 0.5rem)" }}>
        <button
          onClick={() => navigate("/")}
          className="w-full py-4 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] rounded-2xl text-white dark:text-black font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
        >
          <span>На главную</span>
        </button>
      </div>
    </div>
  );
};
