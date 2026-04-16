import { useState } from "react";
import { Icon } from "@iconify/react";
import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";
import { logger } from "@/shared/utils/logger";

const EmployeeResponseSchema = z.object({}).passthrough();

interface EmployeeAddModalProps {
  onClose: () => void;
}

export function EmployeeAddModal({ onClose }: EmployeeAddModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = name.trim().length >= 2 && phone.replace(/\D/g, "").length >= 9;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const fullPhone = phone.startsWith("+") ? phone : "+996" + phone.replace(/\D/g, "");
      const token = sessionStorage.getItem("corporateToken") || "";

      await fetchJson(
        "/api/v1/corporate/employees",
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: {
            name: name.trim(),
            phone: fullPhone,
            monthly_limit: monthlyLimit ? parseInt(monthlyLimit, 10) : null,
          },
        },
        EmployeeResponseSchema,
      );

      onClose();
    } catch (err) {
      logger.error("[EmployeeAddModal] Error:", err);
      setError(
        err instanceof Error ? err.message : "Ошибка при добавлении",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#111621] rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full shadow-2xl dark:shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white font-display">
            Добавить сотрудника
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100/50 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300/50 dark:border-zinc-700/50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <Icon icon="solar:close-circle-linear" width={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Имя сотрудника
            </label>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus-within:border-red-500/50 transition-all">
              <label className="flex items-center h-[48px] px-4 cursor-text">
                <Icon icon="solar:user-linear" width={18} className="text-zinc-500 mr-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder="Иван Иванов"
                  className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  autoFocus
                />
              </label>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Номер телефона
            </label>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus-within:border-red-500/50 transition-all">
              <label className="flex items-center h-[48px] px-4 cursor-text">
                <Icon icon="solar:smartphone-linear" width={18} className="text-zinc-500 mr-3" />
                <span className="text-zinc-400 text-sm mr-2 select-none">+996</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError(null);
                  }}
                  placeholder="700 000 000"
                  className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-white text-sm font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
              </label>
            </div>
          </div>

          {/* Monthly Limit */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Месячный лимит (необязательно)
            </label>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus-within:border-red-500/50 transition-all">
              <label className="flex items-center h-[48px] px-4 cursor-text">
                <Icon icon="solar:wallet-money-linear" width={18} className="text-zinc-500 mr-3" />
                <input
                  type="number"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="Без лимита"
                  className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
                <span className="text-zinc-500 text-sm ml-2">сом</span>
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
              <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0" width={16} />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                !isValid || isLoading
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-500 text-white"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Добавление...
                </span>
              ) : (
                "Добавить"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployeeAddModal;
