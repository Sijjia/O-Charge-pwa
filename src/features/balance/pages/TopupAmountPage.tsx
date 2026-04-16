import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useBalance, useQRTopup } from "../hooks/useBalance";
import { Skeleton } from "@/shared/components/SkeletonLoaders";
import { logger } from "@/shared/utils/logger";

const PRESET_AMOUNTS = [
  { value: 200, icon: "solar:leaf-linear", label: "200 сом" },
  { value: 500, icon: "solar:bolt-circle-linear", label: "500 сом" },
  { value: 1000, icon: "solar:battery-charge-linear", label: "1000 сом" },
];

export function TopupAmountPage() {
  const navigate = useNavigate();
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance();
  const { mutateAsync: createQRTopup } = useQRTopup();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(500);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeAmount = isCustom
    ? parseInt(customAmount, 10) || 0
    : selectedAmount || 0;

  const isValid = activeAmount >= 10;

  const handlePresetSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount("");
    setError(null);
  };

  const handleCustomFocus = () => {
    setIsCustom(true);
    setSelectedAmount(null);
  };

  const handlePay = async () => {
    if (!isValid || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await createQRTopup({
        amount: activeAmount,
        description: "Пополнение баланса",
      });

      if (result) {
        // Store QR data for the next page and navigate
        sessionStorage.setItem("topupQRData", JSON.stringify(result));
        sessionStorage.setItem("topupAmount", String(activeAmount));
        navigate("/topup/success", {
          state: { amount: activeAmount, qrData: result },
        });
      }
    } catch (err) {
      logger.error("[TopupAmountPage] Failed to create topup:", err);
      setError("Не удалось создать платёж. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 h-screen w-full flex flex-col relative overflow-hidden select-none transition-colors duration-300">
      {/* Ambient Background */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-red-600/5 dark:bg-red-600/10 blur-[90px] rounded-full pointer-events-none z-0" />

      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center z-20 shrink-0 relative bg-white/80 dark:bg-transparent backdrop-blur-md dark:backdrop-blur-none border-b border-zinc-200 dark:border-transparent transition-colors duration-300">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400 transition-colors shadow-sm dark:shadow-none"
        >
          <Icon icon="solar:arrow-left-linear" width={24} />
        </button>
        <div className="flex-1 text-center pr-10">
          <span className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight">
            Пополнить баланс
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-6 pt-4 pb-32 z-10 w-full max-w-md mx-auto relative overflow-y-auto">
        {/* Balance Card */}
        <div className="mb-8 p-4 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 flex items-center justify-between backdrop-blur-sm shadow-sm dark:shadow-none transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
              <Icon icon="solar:wallet-money-linear" width={22} />
            </div>
            <div>
              <div className="text-xs text-zinc-500 font-medium mb-0.5">
                Ваш баланс
              </div>
              {isBalanceLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <div className="text-lg font-bold font-display text-zinc-900 dark:text-white tracking-tight">
                  {balanceData?.balance ?? 0} сом
                </div>
              )}
            </div>
          </div>
        </div>

        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">
          Выберите сумму
        </label>

        {/* Amount Chips */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetSelect(preset.value)}
              className={`h-14 rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-0.5 group active:scale-95 ${
                selectedAmount === preset.value && !isCustom
                  ? "border border-red-600 bg-red-50 dark:bg-red-500/10"
                  : "border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-sm dark:shadow-none"
              }`}
            >
              <span className="text-base font-semibold text-zinc-900 dark:text-white">
                {preset.value}
              </span>
              <span className="text-[10px] text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400">
                сом
              </span>
            </button>
          ))}
        </div>

        {/* Custom Amount */}
        <div className="relative mt-2">
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">
            Или введите свою
          </label>
          <div className="relative group">
            <input
              type="number"
              inputMode="numeric"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setError(null);
              }}
              onFocus={handleCustomFocus}
              placeholder="800"
              className="w-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-2xl font-semibold px-4 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 font-medium">
              сом
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 ml-1">
            <Icon icon="solar:info-circle-linear" className="text-zinc-400 dark:text-zinc-500" width={14} />
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Минимум: 10 сом</p>
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
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-[#0A0E17]/90 border-t border-zinc-200 dark:border-white/5 z-40 backdrop-blur-sm transition-colors duration-300">
        <button
          onClick={handlePay}
          disabled={!isValid || isLoading}
          className={`w-full h-14 rounded-xl font-semibold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
            !isValid || isLoading
              ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-500 text-white hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Создание платежа...
            </span>
          ) : (
            <>
              <Icon icon="solar:qr-code-linear" width={22} />
              <span>
                {isValid ? `Получить QR-код` : "Выберите сумму"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default TopupAmountPage;
