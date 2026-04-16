import { useState } from "react";
import { Icon } from "@iconify/react";
import { useAddCorporateEmployee } from "../hooks/useAdminCorporate";

interface Props {
  groupId: string;
  onClose: () => void;
}

export function CorporateAddEmployeeModal({ groupId, onClose }: Props) {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("employee");
  const [position, setPosition] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [dailyLimit, setDailyLimit] = useState("");
  const [error, setError] = useState("");
  const addMutation = useAddCorporateEmployee();

  const handleSubmit = async () => {
    setError("");
    if (!userId.trim()) {
      setError("Укажите ID пользователя");
      return;
    }

    try {
      await addMutation.mutateAsync({
        groupId,
        body: {
          user_id: userId.trim(),
          role,
          position: position.trim() || undefined,
          monthly_limit: monthlyLimit ? parseFloat(monthlyLimit) : undefined,
          daily_limit: dailyLimit ? parseFloat(dailyLimit) : undefined,
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось добавить сотрудника");
    }
  };

  const inputCls = "w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors";
  const selectCls = `${inputCls} appearance-none`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Добавить сотрудника</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <Icon icon="solar:close-linear" width={20} className="text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
              <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0 mt-0.5" width={16} />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">ID пользователя *</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className={inputCls}
              placeholder="UUID пользователя из системы"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Роль</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className={selectCls}>
              <option value="employee">Сотрудник</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Должность</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className={inputCls}
              placeholder="Менеджер"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Лимит/мес (KGS)</label>
              <input
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                className={inputCls}
                placeholder="5000"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Лимит/день (KGS)</label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className={inputCls}
                placeholder="1000"
                min={0}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={addMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {addMutation.isPending && <Icon icon="solar:refresh-linear" width={16} className="animate-spin" />}
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}
