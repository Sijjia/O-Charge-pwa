import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { rpApi } from "@/services/rpApi";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";
import { logger } from "@/shared/utils/logger";

type PaymentState = "pending" | "success" | "failed";

export function TopupSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    amount?: number;
    qrData?: { invoice_id?: string; qr_url?: string; qr_code?: string; payment_url?: string; link_app?: string };
  } | null;
  const amount = state?.amount || 0;
  const qrData = state?.qrData;
  const invoiceId = qrData?.invoice_id;
  const qrUrl = qrData?.qr_url || qrData?.qr_code || "";
  const paymentUrl = qrData?.payment_url || qrData?.link_app || "";

  const isDemoPayment = invoiceId?.startsWith("demo-");
  const { user, login } = useUnifiedAuthStore();

  const [paymentState, setPaymentState] = useState<PaymentState>(
    invoiceId && !isDemoPayment ? "pending" : isDemoPayment ? "pending" : "success",
  );
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Демо-режим: авто-подтверждение через 2 секунды + обновление баланса
  useEffect(() => {
    if (!isDemoPayment) return;
    const timer = setTimeout(() => {
      setPaymentState("success");
      // Обновляем баланс в Zustand
      if (user && amount > 0) {
        login({ ...user, balance: (user.balance || 0) + amount });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isDemoPayment, amount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!invoiceId || isDemoPayment) return;

    // Start polling for payment status
    const startPolling = () => {
      pollRef.current = setInterval(async () => {
        try {
          const result = await rpApi.getPaymentStatus(invoiceId);
          if (result.status === 1 || result.status_text === "paid") {
            stopPolling();
            setPaymentState("success");
          } else if (result.status === 2 || result.status_text === "failed") {
            stopPolling();
            setPaymentState("failed");
          }
        } catch (err) {
          logger.error("[TopupSuccess] Poll error:", err);
        }
      }, 4000);
    };

    const timeout = setTimeout(startPolling, 3000);

    // Timeout after 5 min
    const maxTimeout = setTimeout(() => {
      stopPolling();
      if (paymentState === "pending") {
        setPaymentState("failed");
      }
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(timeout);
      clearTimeout(maxTimeout);
      stopPolling();
    };
  }, [invoiceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Pending state - show QR code
  if (paymentState === "pending") {
    return (
      <div className="bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 h-screen w-full flex flex-col relative overflow-hidden select-none transition-colors duration-300">
        <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none z-0" />

        {/* Header */}
        <div className="px-5 pt-6 pb-2 flex items-center justify-between z-20 shrink-0">
          <button
            onClick={() => { stopPolling(); navigate(-1); }}
            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm dark:shadow-none"
          >
            <Icon icon="solar:arrow-left-linear" width={24} />
          </button>
          <span className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight">
            Оплата Namba One
          </span>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 z-10 w-full max-w-md mx-auto">
          {/* Payment Card */}
          <div className="w-full bg-white dark:bg-zinc-900 rounded-[32px] p-1 shadow-xl shadow-zinc-200/40 dark:shadow-none border border-zinc-200 dark:border-zinc-800 transition-all duration-300 overflow-hidden">
            {/* Amount */}
            <div className="pt-8 pb-4 flex flex-col items-center text-center px-6">
              <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">К оплате</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-display tracking-tighter text-zinc-900 dark:text-white">{amount}</span>
                <span className="text-xl font-semibold text-zinc-400 dark:text-zinc-500">сом</span>
              </div>
            </div>

            {/* QR Section */}
            <div className="bg-zinc-50 dark:bg-black/20 rounded-[28px] border border-zinc-100 dark:border-zinc-800/50 p-8 flex flex-col items-center gap-6 mx-2 mb-2 transition-colors duration-300">
              <p className="text-center text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-[200px] leading-relaxed">
                Отсканируйте QR-код приложением банка
              </p>
              <div className="relative bg-white p-2 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
            {isDemoPayment ? (
              <div className="w-48 h-48 bg-zinc-100 rounded-lg flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-blue-400/30 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-zinc-600 text-sm font-medium">Демо-оплата...</span>
              </div>
            ) : qrUrl ? (
              <img
                src={qrUrl.startsWith("http") ? qrUrl : `data:image/png;base64,${qrUrl}`}
                alt="QR код для оплаты"
                className="w-48 h-48 block"
              />
            ) : (
              <div className="w-48 h-48 bg-zinc-100 rounded-lg flex items-center justify-center">
                <span className="text-zinc-400 text-sm">QR код недоступен</span>
              </div>
            )}
              </div>

              {/* Timer */}
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-2 rounded-full text-xs font-semibold border border-red-100/50 dark:border-red-500/10 transition-colors duration-300">
                <Icon icon="solar:clock-circle-linear" width={16} />
                <span className="tabular-nums tracking-wide">
                  {isDemoPayment ? "Тестовая оплата..." : "Ожидание оплаты..."}
                </span>
              </div>
            </div>
          </div>

          {paymentUrl && (
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-red-500 hover:text-red-400 text-sm font-medium transition-colors"
            >
              <Icon icon="solar:link-round-linear" width={14} />
              Открыть в Namba One
            </a>
          )}
        </div>
      </div>
    );
  }

  // Failed state
  if (paymentState === "failed") {
    return (
      <div className="bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 h-screen w-full flex flex-col items-center justify-center px-6 select-none transition-colors duration-300">
        <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-6">
          <Icon icon="solar:close-circle-linear" className="text-red-500" width={36} />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">Платёж не прошёл</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-8">
          Попробуйте снова или выберите другой способ оплаты
        </p>
        <div className="w-full max-w-sm flex gap-3">
          <button
            onClick={() => navigate("/topup")}
            className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors"
          >
            Попробовать снова
          </button>
          <button
            onClick={() => navigate("/balance")}
            className="flex-1 py-3.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 h-screen w-full flex flex-col relative overflow-hidden select-none transition-colors duration-300">
      {/* Ambient Glow */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-64 h-64 bg-red-500/20 dark:bg-red-500/40 blur-[100px] rounded-full" />
      </div>

      {/* Main Content */}
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 pb-20">
        {/* Success Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-white/10 flex items-center justify-center relative backdrop-blur-sm z-10 shadow-lg dark:shadow-none transition-colors duration-300">
            <Icon icon="solar:check-circle-linear" className="text-green-500" width={48} />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Баланс пополнен!</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Транзакция прошла успешно</p>
        </div>

        {/* Amount (Red) */}
        {amount > 0 && (
          <div className="mb-8">
            <div className="text-5xl font-semibold tracking-tighter text-red-500 flex items-center justify-center gap-1">
              <span>+{amount}</span>
              <span className="text-2xl font-medium mt-3">сом</span>
            </div>
          </div>
        )}

        {/* New Balance Card */}
        <div className="w-full max-w-xs">
          <div className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between shadow-sm dark:shadow-none transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700/50 flex items-center justify-center text-zinc-500 dark:text-zinc-300 transition-colors duration-300">
                <Icon icon="solar:wallet-linear" width={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide">Зачислено</span>
                <span className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">+{amount} сом</span>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="bg-zinc-50 dark:bg-[#0A0E17] border-t border-zinc-200 dark:border-white/5 p-4 z-30 transition-colors duration-300">
        <button
          onClick={() => navigate("/")}
          className="w-full h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-base rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <span>На главную</span>
        </button>
      </div>
    </div>
  );
}

export default TopupSuccessPage;
