import { useState } from "react";
import { Icon } from "@iconify/react";
import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";
import { logger } from "@/shared/utils/logger";

const UpdateResponseSchema = z.object({ success: z.boolean() }).passthrough();

function corporateHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("corporateToken") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Props {
  employee: {
    id: string;
    name?: string | null;
    monthly_limit?: number | null;
    daily_limit?: number | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function EmployeeEditModal({ employee, onClose, onSuccess }: Props) {
  const [monthlyLimit, setMonthlyLimit] = useState(employee.monthly_limit?.toString() || "");
  const [dailyLimit, setDailyLimit] = useState(employee.daily_limit?.toString() || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setIsLoading(true);
    try {
      const body: Record<string, number | null> = {};
      body["monthly_limit"] = monthlyLimit.trim() ? parseFloat(monthlyLimit) : null;
      body["daily_limit"] = dailyLimit.trim() ? parseFloat(dailyLimit) : null;

      await fetchJson(
        `/api/v1/corporate/employees/${employee.id}`,
        {
          method: "PUT",
          headers: { ...corporateHeaders() },
          body,
        },
        UpdateResponseSchema,
      );
      onSuccess();
    } catch (err) {
      logger.error("[EmployeeEditModal] Update failed:", err);
      setError(err instanceof Error ? err.message : "Не удалось обновить");
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-red-500/50 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Редактировать лимиты</h2>
            <p className="text-sm text-zinc-500">{employee.name || "Сотрудник"}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <Icon icon="solar:close-linear" width={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Месячный лимит (сом)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              className={inputCls}
              placeholder="Без лимита"
            />
            <p className="text-xs text-zinc-400 mt-1">Оставьте пустым для безлимитного доступа</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Дневной лимит (сом)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              className={inputCls}
              placeholder="Без лимита"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {isLoading && <Icon icon="solar:refresh-linear" width={14} className="animate-spin" />}
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
