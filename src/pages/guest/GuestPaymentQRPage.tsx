import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { fetchJson, z } from "@/api/unifiedClient";
import { logger } from "@/shared/utils/logger";

export function GuestPaymentQRPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const paymentDataStr = sessionStorage.getItem("guestPaymentData");
  const paymentData = paymentDataStr ? JSON.parse(paymentDataStr) : null;
  const amount = sessionStorage.getItem("guestAmount") || "0";

  const qrUrl = paymentData?.qr_url || paymentData?.qr_code || "";
  const paymentUrl =
    paymentData?.payment_url || paymentData?.link_app || paymentData?.app_link || "";
  const invoiceId = paymentData?.invoice_id || paymentData?.payment_id || "";

  useEffect(() => {
    if (!paymentData) {
      navigate("/guest/payment", { replace: true });
      return;
    }

    // Start polling for payment status after 5s
    const timeout = setTimeout(() => {
      setCheckingPayment(true);

      pollRef.current = setInterval(async () => {
        try {
          const data = await fetchJson(
            `/api/v1/guest/payment-status/${invoiceId}`,
            { method: "GET" },
            z.object({
              status: z.union([z.string(), z.number()]),
              session_id: z.string().optional(),
            }),
          );

          const isPaid = data.status === "paid" || data.status === 1 || String(data.status) === "1";
          if (isPaid) {
            stopPolling();
            if (data.session_id) {
              navigate(`/guest/charging/${data.session_id}`, { replace: true });
            }
          } else if (data.status === "failed" || data.status === 2) {
            stopPolling();
            setError("Платёж не прошёл. Попробуйте снова.");
          }
        } catch (err) {
          logger.error("[GuestPaymentQR] Poll error:", err);
        }
      }, 5000);
    }, 5000);

    // Stop after 5 min
    const maxTimeout = setTimeout(() => {
      stopPolling();
      setError("Время ожидания истекло. Попробуйте снова.");
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(timeout);
      clearTimeout(maxTimeout);
      stopPolling();
    };
  }, [invoiceId, navigate]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setCheckingPayment(false);
  };

  return (
    <div className="bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 h-screen w-full flex flex-col relative overflow-hidden select-none transition-colors duration-300">
      {/* Ambient */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-red-600/5 dark:bg-red-600/10 blur-[90px] rounded-full pointer-events-none z-0" />

      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center z-20 shrink-0 relative">
        <button
          onClick={() => {
            stopPolling();
            navigate(-1);
          }}
          className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400 transition-colors shadow-sm dark:shadow-none"
        >
          <Icon icon="solar:arrow-left-linear" width={24} />
        </button>
        <div className="flex-1 text-center pr-10">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-tight">
            Оплата
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-6 pt-8 z-10 w-full max-w-md mx-auto relative">
        {/* QR Code Display */}
        <div className="bg-white p-4 rounded-2xl shadow-lg dark:shadow-2xl mb-6 border border-zinc-200 dark:border-transparent">
          {qrUrl ? (
            <img
              src={
                qrUrl.startsWith("http")
                  ? qrUrl
                  : `data:image/png;base64,${qrUrl}`
              }
              alt="QR код для оплаты"
              className="w-56 h-56 block"
            />
          ) : (
            <div className="w-56 h-56 bg-zinc-100 rounded-lg flex items-center justify-center">
              <span className="text-zinc-400 text-sm">QR код недоступен</span>
            </div>
          )}
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
          Сумма:{" "}
          <span className="font-semibold text-zinc-900 dark:text-white">{amount} сом</span>
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-6">
          Сканируйте QR код в приложении Namba One
        </p>

        {/* Payment status */}
        {checkingPayment && !error && (
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4">
            <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            <span className="text-sm text-blue-400">
              Ожидаем подтверждение платежа...
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 w-full">
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0" width={16} />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
            <button
              onClick={() => {
                stopPolling();
                navigate("/guest/payment", { replace: true });
              }}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {/* Payment URL link */}
        {paymentUrl && (
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
          >
            <Icon icon="solar:link-round-linear" width={14} />
            Открыть в Namba One
          </a>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-5 pb-8 z-30 w-full max-w-md mx-auto flex gap-3">
        <button
          onClick={() => {
            stopPolling();
            navigate(-1);
          }}
          className="flex-1 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Назад
        </button>
        <button
          onClick={() => {
            stopPolling();
            navigate("/");
          }}
          className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}

export default GuestPaymentQRPage;
