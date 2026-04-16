import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePanelBase } from "@/shared/hooks/usePanelBase";
import { Icon } from "@iconify/react";
import { useTariffPlan } from "@/features/owner/hooks/useAdminTariffs";
import { AssignTariffModal } from "@/features/owner/components/AssignTariffModal";
import type { TariffRule } from "@/features/owner/services/adminTariffsService";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TARIFF_TYPE_LABELS: Record<string, string> = {
  per_kwh: "За кВтч",
  per_minute: "За минуту",
  session_fee: "За сессию",
  parking_fee: "Парковка",
};

function RuleCard({ rule }: { rule: TariffRule }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{rule.name}</h3>
        <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full ${
          rule.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-400"
        }`}>
          {rule.is_active ? "Активно" : "Неактивно"}
        </span>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-zinc-500">Тип</span>
          <span className="text-zinc-700 dark:text-zinc-300 font-medium">{TARIFF_TYPE_LABELS[rule.tariff_type] || rule.tariff_type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Коннектор</span>
          <span className="text-zinc-700 dark:text-zinc-300">{rule.connector_type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Цена</span>
          <span className="text-zinc-900 dark:text-white font-bold text-sm">{rule.price} {rule.currency}</span>
        </div>
        {(rule.time_start || rule.time_end) && (
          <div className="flex justify-between">
            <span className="text-zinc-500">Время</span>
            <span className="text-zinc-700 dark:text-zinc-300">{rule.time_start || "00:00"} – {rule.time_end || "23:59"}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-zinc-500">Приоритет</span>
          <span className="text-zinc-700 dark:text-zinc-300">{rule.priority}</span>
        </div>
      </div>
    </div>
  );
}

export function TariffDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const base = usePanelBase();
  const [showAssign, setShowAssign] = useState(false);

  const isValidId = useMemo(() => !!id && UUID_RE.test(id), [id]);
  const { data, isLoading, error } = useTariffPlan(isValidId ? id : undefined);
  const plan = data?.data;

  if (!isValidId) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 text-center">
          <Icon icon="solar:magnifer-zoom-in-linear" className="text-zinc-400 mx-auto mb-3" width={32} />
          <p className="text-zinc-500 text-sm mb-4">Тарифный план не найден</p>
          <button
            onClick={() => navigate(`${base}/tariffs`)}
            className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Вернуться к тарифам
          </button>
        </div>
      </div>
    );
  }

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
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <Icon icon="solar:danger-triangle-linear" className="text-red-400 mx-auto mb-3" width={32} />
          <p className="text-red-400 text-sm mb-4">{error instanceof Error ? error.message : "Тарифный план не найден"}</p>
          <button
            onClick={() => navigate(`${base}/tariffs`)}
            className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Вернуться к тарифам
          </button>
        </div>
      </div>
    );
  }

  const rules = plan.rules || [];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`${base}/tariffs`)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Icon icon="solar:alt-arrow-left-linear" width={20} className="text-zinc-500" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-display tracking-tight">{plan.name}</h1>
              {plan.is_default && (
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 rounded-full">
                  По умолчанию
                </span>
              )}
              <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${
                plan.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-400"
              }`}>
                {plan.is_active ? "Активен" : "Неактивен"}
              </span>
            </div>
            {plan.description && <p className="text-sm text-zinc-500 mt-1">{plan.description}</p>}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAssign(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <Icon icon="solar:battery-charge-linear" width={16} />
            <span className="hidden sm:inline">Назначить</span>
          </button>
          <button
            onClick={() => navigate(`${base}/tariffs/${id}/edit`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Icon icon="solar:pen-2-linear" width={16} />
            <span className="hidden sm:inline">Редактировать</span>
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-zinc-500">Правил</span>
          <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{rules.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-zinc-500">Станций</span>
          <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{plan.stations_count ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-zinc-500">Создан</span>
          <p className="text-sm font-medium text-zinc-900 dark:text-white mt-1">{new Date(plan.created_at).toLocaleDateString("ru")}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-zinc-500">Обновлён</span>
          <p className="text-sm font-medium text-zinc-900 dark:text-white mt-1">{new Date(plan.updated_at).toLocaleDateString("ru")}</p>
        </div>
      </div>

      {/* Rules */}
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Правила тарификации</h2>
      {rules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
          <Icon icon="solar:document-text-linear" width={32} className="text-zinc-400 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Нет правил. Добавьте правила в редакторе.</p>
          <button
            onClick={() => navigate(`${base}/tariffs/${id}/edit`)}
            className="mt-4 px-4 py-2 text-sm text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            Перейти к редактированию
          </button>
        </div>
      )}

      {/* Assign Modal */}
      {showAssign && (
        <AssignTariffModal planId={plan.id} planName={plan.name} onClose={() => setShowAssign(false)} />
      )}
    </div>
  );
}

export default TariffDetailsPage;
