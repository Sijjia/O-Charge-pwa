import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePanelBase } from "@/shared/hooks/usePanelBase";
import { Icon } from "@iconify/react";
import {
  useTariffPlan,
  useUpdateTariffPlan,
  useDeleteTariffPlan,
  useAddTariffRule,
  useUpdateTariffRule,
  useDeleteTariffRule,
} from "@/features/owner/hooks/useAdminTariffs";
import { TariffRuleForm } from "@/features/owner/components/TariffRuleForm";
import type { CreateRuleBody, TariffRule } from "@/features/owner/services/adminTariffsService";

const TARIFF_TYPE_LABELS: Record<string, string> = {
  per_kwh: "За кВтч",
  per_minute: "За минуту",
  session_fee: "За сессию",
  parking_fee: "Парковка",
};

export function EditTariffPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const base = usePanelBase();

  const { data, isLoading, error } = useTariffPlan(id);
  const updatePlanMut = useUpdateTariffPlan();
  const deletePlanMut = useDeleteTariffPlan();
  const addRuleMut = useAddTariffRule();
  const updateRuleMut = useUpdateTariffRule();
  const deleteRuleMut = useDeleteTariffRule();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<TariffRule | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formError, setFormError] = useState("");

  const plan = data?.data;

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setDescription(plan.description || "");
      setIsDefault(plan.is_default);
      setIsActive(plan.is_active);
    }
  }, [plan]);

  const handleSavePlan = async () => {
    setFormError("");
    if (!name.trim()) { setFormError("Укажите название плана"); return; }
    try {
      await updatePlanMut.mutateAsync({
        id: id!,
        body: {
          name: name.trim(),
          description: description.trim() || undefined,
          is_default: isDefault,
          is_active: isActive,
        },
      });
      navigate(`${base}/tariffs/${id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Ошибка сохранения");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePlanMut.mutateAsync(id!);
      navigate(`${base}/tariffs`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Ошибка удаления");
    }
  };

  const handleAddRule = async (body: CreateRuleBody) => {
    await addRuleMut.mutateAsync({ planId: id!, body });
    setShowRuleForm(false);
  };

  const handleUpdateRule = async (body: CreateRuleBody) => {
    if (!editingRule) return;
    await updateRuleMut.mutateAsync({ planId: id!, ruleId: editingRule.id, body });
    setEditingRule(null);
  };

  const handleDeleteRule = async (ruleId: string) => {
    await deleteRuleMut.mutateAsync({ planId: id!, ruleId });
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Icon icon="solar:refresh-linear" width={32} className="text-red-500 animate-spin mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0 mt-0.5" width={18} />
          <p className="text-red-400 text-sm">{error instanceof Error ? error.message : "Тарифный план не найден"}</p>
        </div>
      </div>
    );
  }

  const rules = plan.rules || [];
  const inputCls = "w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors";

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(`${base}/tariffs/${id}`)}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <Icon icon="solar:alt-arrow-left-linear" width={20} className="text-zinc-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-display tracking-tight">Редактировать план</h1>
          <p className="text-sm text-zinc-500 mt-1">{plan.name}</p>
        </div>
      </div>

      {formError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
          <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0 mt-0.5" width={18} />
          <p className="text-red-400 text-sm">{formError}</p>
        </div>
      )}

      {/* Plan Form */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Основная информация</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Название</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Описание</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} resize-none`} rows={3} />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsDefault(!isDefault)}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${isDefault ? "bg-red-600" : "bg-zinc-300 dark:bg-zinc-700"}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isDefault ? "translate-x-5" : "translate-x-1"}`} />
              </div>
              <span className="text-sm text-zinc-700 dark:text-zinc-300">По умолчанию</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsActive(!isActive)}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${isActive ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-700"}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isActive ? "translate-x-5" : "translate-x-1"}`} />
              </div>
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Активен</span>
            </label>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Правила ({rules.length})</h2>
          {!showRuleForm && !editingRule && (
            <button
              onClick={() => setShowRuleForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Icon icon="solar:add-circle-linear" width={16} />
              Добавить
            </button>
          )}
        </div>

        {rules.map((rule) => (
          <div key={rule.id}>
            {editingRule?.id === rule.id ? (
              <div className="mb-3">
                <TariffRuleForm
                  initial={{
                    name: rule.name,
                    tariff_type: rule.tariff_type,
                    connector_type: rule.connector_type,
                    price: rule.price,
                    currency: rule.currency,
                    time_start: rule.time_start || undefined,
                    time_end: rule.time_end || undefined,
                    priority: rule.priority,
                  }}
                  onSubmit={handleUpdateRule}
                  onCancel={() => setEditingRule(null)}
                  isLoading={updateRuleMut.isPending}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 mb-2">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{rule.name}</p>
                  <p className="text-xs text-zinc-500">
                    {TARIFF_TYPE_LABELS[rule.tariff_type] || rule.tariff_type} &middot; {rule.price} {rule.currency} &middot; Приоритет {rule.priority}
                    {!rule.is_active && " · Неактивно"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingRule(rule)}
                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <Icon icon="solar:pen-2-linear" width={16} className="text-zinc-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    disabled={deleteRuleMut.isPending}
                    className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Icon icon="solar:trash-bin-minimalistic-linear" width={16} className="text-zinc-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {showRuleForm && (
          <TariffRuleForm
            onSubmit={handleAddRule}
            onCancel={() => setShowRuleForm(false)}
            isLoading={addRuleMut.isPending}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
        >
          <Icon icon="solar:trash-bin-minimalistic-linear" width={16} />
          Удалить план
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`${base}/tariffs/${id}`)}
            className="px-6 py-3 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSavePlan}
            disabled={updatePlanMut.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {updatePlanMut.isPending && <Icon icon="solar:refresh-linear" width={16} className="animate-spin" />}
            Сохранить
          </button>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Icon icon="solar:trash-bin-minimalistic-linear" width={20} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Удалить план?</h3>
            </div>
            <p className="text-sm text-zinc-500 mb-6">
              План &ldquo;{plan.name}&rdquo; будет деактивирован. Это действие можно отменить.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={deletePlanMut.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {deletePlanMut.isPending && <Icon icon="solar:refresh-linear" width={14} className="animate-spin" />}
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditTariffPage;
