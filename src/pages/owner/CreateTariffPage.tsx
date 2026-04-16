import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePanelBase } from "@/shared/hooks/usePanelBase";
import { Icon } from "@iconify/react";
import { useCreateTariffPlan } from "@/features/owner/hooks/useAdminTariffs";
import { TariffRuleForm } from "@/features/owner/components/TariffRuleForm";
import type { CreateRuleBody } from "@/features/owner/services/adminTariffsService";

export function CreateTariffPage() {
  const navigate = useNavigate();
  const base = usePanelBase();
  const createMutation = useCreateTariffPlan();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [rules, setRules] = useState<CreateRuleBody[]>([]);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [error, setError] = useState("");

  const handleAddRule = (rule: CreateRuleBody) => {
    setRules((prev) => [...prev, rule]);
    setShowRuleForm(false);
  };

  const handleRemoveRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) { setError("Укажите название плана"); return; }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        is_default: isDefault,
        rules: rules.length > 0 ? rules : undefined,
      });
      navigate(`${base}/tariffs`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать план");
    }
  };

  const inputCls = "w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors";

  const TARIFF_TYPE_LABELS: Record<string, string> = {
    per_kwh: "За кВтч",
    per_minute: "За минуту",
    session_fee: "За сессию",
    parking_fee: "Парковка",
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(`${base}/tariffs`)}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <Icon icon="solar:alt-arrow-left-linear" width={20} className="text-zinc-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-display tracking-tight">Новый тарифный план</h1>
          <p className="text-sm text-zinc-500 mt-1">Заполните данные и добавьте правила</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
          <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0 mt-0.5" width={18} />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Plan Form */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Основная информация</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Название</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Базовый тариф" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Описание тарифного плана..."
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setIsDefault(!isDefault)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${isDefault ? "bg-red-600" : "bg-zinc-300 dark:bg-zinc-700"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isDefault ? "translate-x-5" : "translate-x-1"}`} />
            </div>
            <span className="text-sm text-zinc-700 dark:text-zinc-300">План по умолчанию</span>
          </label>
        </div>
      </div>

      {/* Rules Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Правила ({rules.length})</h2>
          {!showRuleForm && (
            <button
              onClick={() => setShowRuleForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Icon icon="solar:add-circle-linear" width={16} />
              Добавить правило
            </button>
          )}
        </div>

        {rules.length > 0 && (
          <div className="space-y-2 mb-4">
            {rules.map((rule, idx) => (
              <div key={idx} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{rule.name}</p>
                  <p className="text-xs text-zinc-500">
                    {TARIFF_TYPE_LABELS[rule.tariff_type || "per_kwh"]} &middot; {rule.price} {rule.currency || "KGS"} &middot; Приоритет {rule.priority ?? 10}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveRule(idx)}
                  className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Icon icon="solar:trash-bin-minimalistic-linear" width={16} className="text-zinc-400 hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showRuleForm && (
          <TariffRuleForm
            onSubmit={handleAddRule}
            onCancel={() => setShowRuleForm(false)}
          />
        )}

        {rules.length === 0 && !showRuleForm && (
          <p className="text-sm text-zinc-500 text-center py-4">Правила можно добавить сейчас или позже</p>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => navigate(`${base}/tariffs`)}
          className="px-6 py-3 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
        >
          Отмена
        </button>
        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {createMutation.isPending && <Icon icon="solar:refresh-linear" width={16} className="animate-spin" />}
          Создать план
        </button>
      </div>
    </div>
  );
}

export default CreateTariffPage;
