import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useQueryClient } from "@tanstack/react-query";
import { useQRTopup, usePaymentMonitoring } from "../hooks/useBalance";
import { safeParseInt } from "../../../shared/utils/parsers";
import { logger } from "@/shared/utils/logger";
import type { NormalizedTopupQRResponse } from "../services/balanceService";

interface QRTopupProps {
  onClose: () => void;
  onSuccess: () => void;
}

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export function QRTopup({ onClose, onSuccess }: QRTopupProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"amount" | "qr" | "success">("amount");
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");
  const [qrData, setQrData] = useState<NormalizedTopupQRResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: createQRTopup } = useQRTopup();
  const { paymentStatus, monitoring, monitorPayment } = usePaymentMonitoring();

  // Check payment status
  useEffect(() => {
    if (paymentStatus?.status === 1 && step === "qr") {
      setStep("success");
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }
  }, [paymentStatus, step, onSuccess]);

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setCustomAmount(value);
      setAmount(safeParseInt(value, 0));
    }
  };

  const handleGenerateQR = async () => {
    if (amount < 10) return;

    setLoading(true);
    setError(null);

    try {
      const result = await createQRTopup({
        amount,
        description: "Пополнение баланса",
      });

      logger.debug("QR Topup API Response:", result);

      if (result) {
        setQrData(result);
        setStep("qr");

        // Start monitoring payment
        monitorPayment(
          result.paymentId,
          () => {
            // Invalidate balance query to refresh UI
            queryClient.invalidateQueries({ queryKey: ["balance"] });

            setStep("success");
            setTimeout(() => {
              onSuccess();
            }, 2000);
          },
          (errorMessage: string) => {
            setError(errorMessage);
          },
        );
      }
    } catch (error) {
      logger.error("QR Topup error:", error);

      // Улучшенная обработка ошибок с детальными сообщениями
      let errorMessage = "Не удалось создать QR код";
      if (error instanceof Error) {
        errorMessage = error.message;

        // Добавляем контекст для специфичных ошибок
        if (error.message.includes("Network request failed")) {
          errorMessage =
            "Ошибка сети. Проверьте подключение к интернету и попробуйте снова.";
        } else if (error.message.includes("timeout")) {
          errorMessage =
            "Превышено время ожидания. Попробуйте снова через несколько секунд.";
        } else if (error.message.includes("validation")) {
          errorMessage =
            "Ошибка проверки данных. Проверьте корректность введенной суммы.";
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeLeft = () => {
    if (!qrData?.expiresAt) return 0;
    const expiresAt = new Date(qrData.expiresAt).getTime();
    const now = new Date().getTime();
    return Math.max(0, Math.floor((expiresAt - now) / 1000));
  };

  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  // Update timer via useEffect to avoid setState in render
  useEffect(() => {
    if (step !== "qr" || timeLeft <= 0) return;
    const timer = setTimeout(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  }, [step, timeLeft]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#111621] rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white font-display">
            {step === "amount" && "Пополнение баланса"}
            {step === "qr" && "Сканируйте QR код"}
            {step === "success" && "Успешно!"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100/50 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300/50 dark:border-zinc-700/50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <Icon icon="solar:close-circle-linear" width={18} />
          </button>
        </div>

        <div className="p-5">
          {/* Amount Selection */}
          {step === "amount" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">
                  Выберите сумму пополнения
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {QUICK_AMOUNTS.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      onClick={() => handleAmountSelect(quickAmount)}
                      className={`py-3 px-4 rounded-xl border font-medium transition-colors ${
                        amount === quickAmount && !customAmount
                          ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20"
                          : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      {quickAmount} сом
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="custom-amount"
                  className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2"
                >
                  Или введите свою сумму
                </label>
                <input
                  type="text"
                  id="custom-amount"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white text-lg font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Сумма в сомах"
                />
                {amount > 0 && amount < 10 && (
                  <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1.5">
                    <Icon icon="solar:danger-triangle-linear" width={14} />
                    Минимальная сумма пополнения: 10 сом
                  </p>
                )}
              </div>

              <div className="bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">
                    К пополнению:
                  </span>
                  <span className="text-xl font-bold text-red-400 font-display">
                    {amount} сом
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
                  <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0" width={16} />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerateQR}
                disabled={amount < 10 || loading}
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
          )}

          {/* QR Code Display */}
          {step === "qr" && qrData && (
            <div className="space-y-5 text-center">
              <div>
                {/* White QR Card */}
                <div className="bg-white p-3 rounded-2xl inline-block shadow-lg mb-3">
                  {qrData.qrCode ? (
                    qrData.qrCode.startsWith("http") ? (
                      <img
                        src={qrData.qrCode}
                        alt="QR код для оплаты"
                        className="w-48 h-48 block"
                      />
                    ) : (
                      <img
                        src={`data:image/png;base64,${qrData.qrCode}`}
                        alt="QR код для оплаты"
                        className="w-48 h-48 block"
                      />
                    )
                  ) : (
                    <div className="w-48 h-48 bg-zinc-100 rounded-lg flex items-center justify-center">
                      <span className="text-zinc-400 text-sm">QR код недоступен</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Сумма: <span className="font-semibold text-zinc-900 dark:text-white">{amount} сом</span>
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-zinc-600 dark:text-zinc-300 text-sm">
                  Сканируйте QR код в приложении Namba One
                </p>

                {/* Timer */}
                <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-full text-xs font-semibold">
                  <Icon icon="solar:clock-circle-linear" width={16} />
                  <span className="tabular-nums tracking-wide">
                    Код действителен: {formatTime(timeLeft)}
                  </span>
                </div>

                {monitoring && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                      <span className="text-blue-400 text-sm">Ожидание оплаты...</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 justify-center">
                    <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0" width={14} />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("amount")}
                  className="flex-1 py-2.5 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Изменить сумму
                </button>
                {qrData.payment_url ? (
                  <a
                    href={qrData.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors text-center inline-flex items-center justify-center gap-1.5"
                  >
                    <Icon icon="solar:link-round-linear" width={16} />
                    Открыть Namba One
                  </a>
                ) : (
                  <button onClick={onClose} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors">
                    Закрыть
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success */}
          {step === "success" && (
            <div className="text-center space-y-5 py-4">
              <div className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto">
                <Icon icon="solar:check-circle-bold-duotone" className="text-emerald-400" width={40} />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2 font-display">
                  Баланс пополнен!
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400">
                  На ваш счет зачислено <span className="text-red-400 font-semibold">{paymentStatus?.amount} сом</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
