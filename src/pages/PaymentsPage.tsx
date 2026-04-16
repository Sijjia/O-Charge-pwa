import { useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useBalance } from "@/features/balance/hooks/useBalance";
import { SimpleTopup } from "@/features/balance/components/SimpleTopup";
import { useTransactionHistory } from "@/features/balance/hooks/useTransactionHistory";
import { useUnifiedAuthStore as useAuthStore } from "@/features/auth/unifiedAuthStore";
import { HelpTip } from "@/shared/components/HelpTip";

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: balance } = useBalance();
  const displayBalance = balance?.balance ?? 0;
  const { data: transactions, isLoading: transactionsLoading } =
    useTransactionHistory(20);
  const [showQRTopup, setShowQRTopup] = useState(false);

  // Преобразуем транзакции в формат для отображения
  const paymentHistory = (transactions || []).map((tx) => ({
    id: String(tx.id ?? ""),
    date: tx.created_at ?? null,
    amount: tx.amount ?? tx.requested_amount ?? 0,
    method:
      tx.payment_method === "namba" || tx.payment_method === "odengi"
        ? "Namba One"
        : tx.payment_method || "Неизвестно",
    status:
      (tx.status ?? "unknown") === "approved" || tx.status === "paid"
        ? "success"
        : tx.status === "processing" || tx.status === "pending"
          ? "pending"
          : "failed",
    description:
      tx.transaction_type === "balance_topup"
        ? "Пополнение баланса"
        : tx.transaction_type === "charge_payment"
          ? "Оплата зарядки"
          : "Транзакция",
    transactionType: tx.transaction_type,
  }));

  const formatAmount = (amount: number, type: string) => {
    if (type === "balance_topup") {
      return `+${amount}`;
    }
    return `-${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) return `Сегодня, ${time}`;
    if (isYesterday) return `Вчера, ${time}`;
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="min-h-screen bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 relative overflow-x-hidden transition-colors duration-300 pb-[calc(var(--nav-height)+16px)]"
    >
      {/* Ambient Glows */}
      <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] bg-red-600/10 dark:bg-red-600/15 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center justify-between z-20 relative shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center text-zinc-400 shadow-sm dark:shadow-none">
            <Icon icon="solar:user-linear" width={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 font-medium">
              Добро пожаловать,
            </span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
              {user?.name || "Пользователь"}
            </span>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-white dark:bg-transparent border border-zinc-200 dark:border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400 transition-colors relative shadow-sm dark:shadow-none">
          <Icon icon="solar:bell-linear" width={24} />
          <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0A0E17]" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-8 z-10 relative w-full max-w-md mx-auto">
        {/* Wallet Card (RED) */}
        <div className="relative w-full rounded-3xl p-6 overflow-hidden shadow-2xl shadow-red-900/20 dark:shadow-none group transition-transform active:scale-[0.99]">
          {/* Red Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#D92323] to-[#A31616] z-0" />
          {/* Grain Texture */}
          <div
            className="absolute inset-0 opacity-30 z-0 mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            }}
          />
          {/* Internal Glow */}
          <div className="absolute top-[-50%] right-[-20%] w-64 h-64 bg-white/20 blur-[60px] rounded-full z-0 mix-blend-soft-light" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center py-4 text-white">
            <span className="text-white/80 text-sm font-medium tracking-wide uppercase mb-2 flex items-center gap-1.5">
              Общий баланс
              <div className="text-white hover:text-white/80 transition-colors">
                <HelpTip text="Сумма будет использована в первую очередь для оплаты зарядки. Срок действия баланса не ограничен." />
              </div>
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-bold font-display tracking-tighter drop-shadow-md">
                {displayBalance.toLocaleString("ru-RU")}
              </span>
              <span className="text-xl font-medium text-white/80">сом</span>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-2 gap-3 mt-8 relative z-10">
            <button
              onClick={() => setShowQRTopup(true)}
              className="btn bg-white text-red-700 shadow-lg w-full gap-2"
            >
              <Icon icon="solar:wallet-add-linear" width={20} />
              <span>Пополнить</span>
            </button>
            <button
              onClick={() => navigate("/topup")}
              className="btn bg-black/20 hover:bg-black/30 border border-white/20 text-white backdrop-blur-md w-full gap-2"
            >
              <Icon icon="solar:card-linear" width={20} />
              <span>Карты</span>
            </button>
          </div>
        </div>

        {/* Quick Topup Chips */}
        <div className="flex items-center gap-2.5 overflow-x-auto hide-scroll -mt-4 pb-2 px-1">
          {[500, 1000, 2000, 5000].map((amount) => (
            <button
              key={amount}
              onClick={() => setShowQRTopup(true)}
              className="btn btn-secondary shrink-0 text-sm font-bold shadow-sm"
            >
              + {amount} сом
            </button>
          ))}
        </div>

        {/* Transaction History */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight">
              Последние операции
            </h2>
            <button
              onClick={() => navigate("/history")}
              className="text-xs text-red-600 dark:text-red-500 font-medium hover:opacity-80 transition-colors"
            >
              Все
            </button>
          </div>

          {transactionsLoading ? (
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-3xl p-8 backdrop-blur-sm shadow-sm dark:shadow-none">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
                <p className="text-sm text-zinc-500">Загрузка...</p>
              </div>
            </div>
          ) : paymentHistory.length === 0 ? (
            <div className="card flex flex-col items-center text-center rounded-3xl p-8">
              <div className="relative w-24 h-24 mb-4">
                <div className="absolute inset-0 bg-red-100 dark:bg-red-500/10 rounded-full animate-pulse-glow" />
                <div className="absolute inset-2 bg-red-200 dark:bg-red-500/20 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center text-red-600 dark:text-red-500">
                  <Icon icon="solar:wallet-money-bold-duotone" width={48} />
                </div>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">История пуста</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[250px] leading-relaxed mb-6">
                У вас пока не было транзакций. Пополните баланс, чтобы начать пользоваться зарядными станциями.
              </p>
              <button
                onClick={() => setShowQRTopup(true)}
                className="w-full btn btn-primary py-3.5 text-sm"
              >
                Пополнить баланс
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-3xl p-1 overflow-hidden backdrop-blur-sm shadow-sm dark:shadow-none transition-colors">
              {paymentHistory.map((payment, index) => {
                const isCharge = payment.transactionType === "charge_payment";
                const isFailed = payment.status === "failed";
                const isPending = payment.status === "pending";

                // Icon and colors based on transaction type and status
                let iconName = "solar:card-recive-linear";
                let iconColorClass = "text-emerald-600 dark:text-emerald-500";
                let bgColorClass =
                  "bg-emerald-100/50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20";
                let amountColorClass = "text-emerald-600 dark:text-emerald-400";

                if (isCharge) {
                  iconName = "solar:bolt-linear";
                  iconColorClass = "text-red-600 dark:text-red-500";
                  bgColorClass = "bg-red-100/50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20";
                  amountColorClass = "text-zinc-900 dark:text-zinc-200";
                }

                if (isPending) {
                  iconName = "solar:clock-circle-linear";
                  iconColorClass = "text-yellow-500";
                  bgColorClass = "bg-yellow-100/50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/20";
                  amountColorClass = "text-yellow-600 dark:text-yellow-400";
                }

                if (isFailed) {
                  iconName = "solar:close-circle-linear";
                  iconColorClass = "text-zinc-400";
                  bgColorClass = "bg-zinc-100 border-zinc-200 dark:bg-zinc-700/30 dark:border-zinc-700/50";
                  amountColorClass = "text-zinc-400";
                }

                return (
                  <div key={payment.id}>
                    <div
                      className={`group flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-2xl transition-colors cursor-pointer ${isFailed ? "opacity-60" : ""
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full ${bgColorClass} border flex items-center justify-center ${iconColorClass} group-hover:scale-110 transition-transform`}
                        >
                          <Icon icon={iconName} width={20} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                            {payment.description}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {formatDate(payment.date)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-semibold font-display ${amountColorClass} tracking-tight`}
                      >
                        {formatAmount(
                          payment.amount,
                          payment.transactionType,
                        )}{" "}
                        сом
                      </span>
                    </div>
                    {/* Divider (not after last item) */}
                    {index < paymentHistory.length - 1 && (
                      <div className="h-px w-[80%] mx-auto bg-zinc-100 dark:bg-zinc-800/50" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* QR Topup Modal */}
      {showQRTopup && <SimpleTopup onClose={() => setShowQRTopup(false)} />}
    </div>
  );
}
