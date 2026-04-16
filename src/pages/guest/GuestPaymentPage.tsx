import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";
import { logger } from "@/shared/utils/logger";

const PRESET_AMOUNTS = [
  { value: 200, icon: "solar:leaf-linear", label: "200 сом" },
  { value: 500, icon: "solar:bolt-circle-linear", label: "500 сом" },
  { value: 1000, icon: "solar:battery-charge-linear", label: "1000 сом" },
];

const GuestStartResponseSchema = z.object({
  success: z.boolean(),
  session_id: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  error: z.string().optional().nullable(),
}).passthrough();

export function GuestPaymentPage() {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stationCode = sessionStorage.getItem("guestStationCode") || "";
  const connectorId = parseInt(sessionStorage.getItem("guestConnectorId") || "1", 10);
  const phone = sessionStorage.getItem("guestPhone") || "";

  // Redirect if missing required session data
  useEffect(() => {
    if (!stationCode || !phone) {
      navigate("/", { replace: true });
    }
  }, [stationCode, phone, navigate]);

  const handlePay = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchJson(
        "/api/v1/guest/start",
        {
          method: "POST",
          body: {
            station_id: stationCode,
            connector_id: connectorId,
            phone,
            amount_kgs: selectedAmount,
          },
        },
        GuestStartResponseSchema,
      );

      if (!data.success) {
        setError(data.message || data.error || "Ошибка создания сессии");
        return;
      }

      if (data.session_id) {
        sessionStorage.setItem("guestSessionId", data.session_id);
        sessionStorage.setItem("guestAmount", String(selectedAmount));
        // If payment URL exists in passthrough data, go to payment
        const paymentUrl = (data as Record<string, unknown>)["payment_url"] as string | undefined;
        const qrUrl = (data as Record<string, unknown>)["qr_url"] as string | undefined;
        if (paymentUrl || qrUrl) {
          sessionStorage.setItem("guestPaymentData", JSON.stringify(data));
          navigate("/guest/payment/qr");
        } else {
          navigate(`/guest/charging/${data.session_id}`);
        }
      }
    } catch (err) {
      logger.error("[GuestPayment] Error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      // Replace raw validation messages with user-friendly text
      setError(
        msg.includes("Field required") || msg.includes("validation")
          ? "Ошибка данных. Пожалуйста, попробуйте заново."
          : msg || "Не удалось создать платёж. Попробуйте позже.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 h-screen w-full flex flex-col relative overflow-hidden select-none transition-colors duration-300">
      {/* Ambient Background */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-red-600/5 dark:bg-red-600/10 blur-[90px] rounded-full pointer-events-none z-0" />

      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center z-20 shrink-0 relative">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400 transition-colors backdrop-blur-md shadow-sm dark:shadow-none"
        >
          <Icon icon="solar:arrow-left-linear" width={24} />
        </button>
        <div className="flex-1 text-center pr-10">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-tight">
            Гостевая оплата
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex flex-col px-6 pt-4 pb-36 z-10 w-full max-w-md mx-auto relative overflow-y-auto">
        {/* Icon Header */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-b from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xl dark:shadow-xl flex items-center justify-center relative">
            <div className="absolute inset-0 bg-red-500/10 dark:bg-red-500/20 rounded-full blur-xl" />
            <Icon
              icon="solar:wallet-money-linear"
              width={40}
              className="text-zinc-700 dark:text-zinc-100 relative z-10"
            />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight font-display text-center mb-8">
          Выберите сумму
        </h1>

        {/* Amount Chips Grid */}
        <div className="grid grid-cols-1 gap-3 mb-8">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => {
                setSelectedAmount(preset.value);
                setError(null);
              }}
              className={`relative p-4 rounded-xl transition-all duration-300 flex items-center justify-between group backdrop-blur-sm ${
                selectedAmount === preset.value
                  ? "bg-red-50 dark:bg-red-500/10 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)] dark:shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                  : "bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-zinc-800/40 shadow-sm dark:shadow-none"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedAmount === preset.value
                      ? "bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-400"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  <Icon icon={preset.icon} width={20} />
                </div>
                <span className="text-lg font-semibold font-display">
                  {preset.label}
                </span>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedAmount === preset.value
                    ? "border-red-500 bg-red-500"
                    : "border-zinc-600"
                }`}
              >
                {selectedAmount === preset.value && (
                  <div className="w-2.5 h-2.5 bg-white dark:bg-[#0A0E17] rounded-full" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Warning Alert */}
        <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-50 dark:bg-amber-900/10 p-4">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50" />
          <div className="flex gap-3">
            <div className="shrink-0 pt-0.5">
              <Icon
                icon="solar:danger-triangle-linear"
                className="text-amber-500"
                width={20}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-200/90 mb-1">
                Внимание: Это предоплата
              </h3>
              <p className="text-xs leading-relaxed text-amber-600 dark:text-amber-200/60">
                Неиспользованные средства не возвращаются при гостевой зарядке.
                Пожалуйста, выбирайте сумму внимательно.
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
            <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0" width={16} />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-zinc-50 via-zinc-50 dark:from-[#0A0E17] dark:via-[#0A0E17] to-transparent z-40 flex justify-center backdrop-blur-sm">
        <div className="w-full max-w-md relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
          <button
            onClick={handlePay}
            disabled={isLoading}
            className="relative w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-base transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Создание платежа...
              </span>
            ) : (
              <>
                <Icon icon="solar:card-send-linear" width={20} />
                <span>Оплатить {selectedAmount} сом</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GuestPaymentPage;
