import { useState } from "react";
import { Icon } from "@iconify/react";
import { useTopupCorporateBalance } from "../hooks/useAdminCorporate";

interface Props {
  groupId: string;
  companyName: string;
  currentBalance: number;
  onClose: () => void;
}

export function CorporateTopupModal({ groupId, companyName, currentBalance, onClose }: Props) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const topupMutation = useTopupCorporateBalance();

  const handleSubmit = async () => {
    setError("");
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setError("Укажите корректную сумму");
      return;
    }

    try {
      await topupMutation.mutateAsync({
        id: groupId,
        amount: num,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось пополнить баланс");
    }
  };

  const inputCls = "w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Пополнение баланса</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <Icon icon="solar:close-linear" width={20} className="text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-3">
            <p className="text-xs text-zinc-500 mb-1">Компания</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">{companyName}</p>
            <p className="text-xs text-zinc-500 mt-1">Текущий баланс: <span className="font-medium text-zinc-700 dark:text-zinc-300">{currentBalance.toLocaleString()} KGS</span></p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
              <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0 mt-0.5" width={16} />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Сумма (KGS) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
              placeholder="10000"
              min={1}
              step={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Описание</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputCls}
              placeholder="Оплата по счету №..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={topupMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {topupMutation.isPending && <Icon icon="solar:refresh-linear" width={16} className="animate-spin" />}
            Пополнить
          </button>
        </div>
      </div>
    </div>
  );
}
