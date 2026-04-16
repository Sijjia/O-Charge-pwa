import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { useQRTopup } from "../hooks/useBalance";
import { rpApi } from "@/services/rpApi";
import { useQueryClient } from "@tanstack/react-query";
import { safeParseInt } from "../../../shared/utils/parsers";
import { logger } from "@/shared/utils/logger";
import type { NormalizedTopupQRResponse } from "../services/balanceService";

interface SimpleTopupProps {
  onClose: () => void;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export function SimpleTopup({ onClose }: SimpleTopupProps) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"amount" | "qr" | "success">("amount");
  const [qrData, setQrData] = useState<NormalizedTopupQRResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialDelayRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const { mutateAsync: createQRTopup } = useQRTopup();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const startPaymentStatusPolling = (invoiceId: string) => {
    // Wait 5 seconds before starting to check - give user time to scan QR
    initialDelayRef.current = setTimeout(() => {
      setCheckingPayment(true);

      // Poll every 5 seconds
      pollIntervalRef.current = setInterval(async () => {
        try {
          const status = await rpApi.getPaymentStatus(invoiceId);

          logger.debug("Payment status response:", {
            status: status.status,
            success: status.success,
            invoice_expired: status.invoice_expired,
            paid_amount: status.paid_amount,
          });

          if (status.status === 1 && status.success === true) {
            logger.info(
              "Payment confirmed! Paid amount:",
              status.paid_amount || status.amount,
            );
            stopPolling();
            setStep("success");
            queryClient.invalidateQueries({ queryKey: ["balance"] });
            queryClient.invalidateQueries({
              queryKey: ["transaction-history"],
            });

            // Auto close after 3 seconds
            setTimeout(() => {
              onClose();
            }, 3000);
          } else if (status.status === 2 || status.invoice_expired === true) {
            logger.warn("Payment failed or expired");
            stopPolling();
            setError("Платеж не прошел или срок действия QR кода истек.");
          } else {
            logger.debug("Payment still pending...");
          }
        } catch (error) {
          logger.error("Error checking payment status:", error);
        }
      }, 5000);

      // Stop polling after 5 minutes
      timeoutRef.current = setTimeout(
        () => {
          stopPolling();
          setError(
            "Время ожидания истекло. Если вы оплатили, баланс обновится автоматически.",
          );
        },
        5 * 60 * 1000,
      );
    }, 5000); // Initial 5 second delay
  };

  const stopPolling = () => {
    if (initialDelayRef.current) {
      clearTimeout(initialDelayRef.current);
      initialDelayRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setCheckingPayment(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const handleGenerateQR = async () => {
    const numAmount = safeParseInt(amount, 0);
    if (numAmount < 1) {
      setError("Минимальная сумма пополнения 1 сом");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await createQRTopup({
        amount: numAmount,
        description: "Пополнение баланса",
      });

      if (result) {
        setQrData(result);
        setStep("qr");
        // Start automatic polling for payment status
        startPaymentStatusPolling(result.paymentId);
      }
    } catch (error: unknown) {
      logger.error("QR Generation Error:", error);
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message
          : undefined;
      setError(message || "Не удалось создать QR код");
    } finally {
      setLoading(false);
    }
  };

  const numAmount = safeParseInt(amount, 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#111621] rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white font-display">
            {step === "amount"
              ? "Пополнение баланса"
              : step === "qr"
                ? "QR код для оплаты"
                : "Платеж успешен"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100/50 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300/50 dark:border-zinc-700/50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <Icon icon="solar:close-circle-linear" width={18} />
          </button>
        </div>

        <div className="p-5">
          {step === "amount" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                  Введите сумму пополнения
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white text-lg font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Сумма в сомах"
                  autoFocus
                />
              </div>

              {/* Quick Amounts */}
              <div className="flex gap-2 w-full overflow-x-auto hide-scroll pb-1">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700/50 hover:border-red-500/30 transition-colors active:scale-95"
                  >
                    +{amt}
                  </button>
                ))}
              </div>

              {numAmount > 0 && (
                <div className="bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl p-3 text-center">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">К пополнению: </span>
                  <span className="text-lg font-bold text-red-400 font-display">
                    {numAmount} сом
                  </span>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
                  <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0" width={16} />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerateQR}
                disabled={numAmount < 1 || loading}
                className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-500 dark:disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Генерация QR...
                  </span>
                ) : (
                  "Создать QR код"
                )}
              </button>
            </div>
          ) : step === "qr" ? (
            <div className="space-y-4">
              <div className="text-center">
                {/* QR Code Display */}
                <div className="bg-white p-3 rounded-2xl inline-block shadow-lg mb-3">
                  {qrData?.qrCode ? (
                    <img
                      src={
                        qrData.qrCode.startsWith("http")
                          ? qrData.qrCode
                          : `data:image/png;base64,${qrData.qrCode}`
                      }
                      alt="QR код"
                      className="w-48 h-48 block"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-zinc-100 rounded-lg flex items-center justify-center">
                      <span className="text-zinc-400 text-sm">QR код недоступен</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Сумма: <span className="font-semibold text-zinc-900 dark:text-white">{numAmount} сом</span>
                </p>
                <p className="mt-1.5 text-xs text-zinc-500">
                  Сканируйте QR код в приложении Namba One
                </p>

                {/* Payment status indicator */}
                {checkingPayment && (
                  <div className="mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                    <span className="text-sm text-blue-400">
                      Ожидаем подтверждение платежа...
                    </span>
                  </div>
                )}

                {/* Error message */}
                {error && step === "qr" && (
                  <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                    <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0" width={14} />
                    <p className="text-red-400 text-xs">{error}</p>
                  </div>
                )}

                {/* Payment URL for mobile */}
                {(qrData?.payment_url ||
                  qrData?.link_app ||
                  qrData?.app_link) && (
                    <div className="mt-3">
                      <a
                        href={
                          qrData.payment_url || qrData.link_app || qrData.app_link
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                      >
                        <Icon icon="solar:link-round-linear" width={14} />
                        Открыть в Namba One
                      </a>
                    </div>
                  )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep("amount");
                    setError(null);
                    stopPolling();
                  }}
                  className="flex-1 py-2.5 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Изменить сумму
                </button>
                <button
                  onClick={() => {
                    stopPolling();
                    onClose();
                  }}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          ) : (
            /* Success Screen */
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon icon="solar:check-circle-bold-duotone" className="text-emerald-400" width={40} />
                </div>

                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2 font-display">
                  Баланс успешно пополнен!
                </h3>

                <p className="text-lg text-zinc-500 dark:text-zinc-400">
                  На сумму:{" "}
                  <span className="font-bold text-red-400">
                    {numAmount} сом
                  </span>
                </p>

                <p className="mt-3 text-sm text-zinc-600">
                  Окно закроется автоматически...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
