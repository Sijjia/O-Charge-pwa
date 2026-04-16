import { useState } from "react";
import { Icon } from "@iconify/react";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { useAdminAlerts, useAcknowledgeAlert } from "@/features/admin/hooks/useAdminAlerts";

const SEVERITIES = [
  { value: undefined, label: "Все" },
  { value: "critical", label: "Критичные" },
  { value: "warning", label: "Предупреждения" },
  { value: "info", label: "Инфо" },
];

export function AdminAlertsPage() {
  const [severity, setSeverity] = useState<string | undefined>();
  const { data, isLoading } = useAdminAlerts(severity);
  const ackMutation = useAcknowledgeAlert();

  const alerts = data?.alerts ?? [];

  const severityIcon = (s: string) =>
    s === "critical"
      ? "solar:danger-circle-bold"
      : s === "warning"
        ? "solar:shield-warning-bold"
        : "solar:info-circle-bold";

  const severityColor = (s: string) =>
    s === "critical"
      ? "text-red-500"
      : s === "warning"
        ? "text-amber-500"
        : "text-blue-500";

  return (
    <div className="p-4 md:p-8 space-y-6">
      <AdminPageHeader title="Алерты" subtitle="Критические уведомления" helpText="Автоматические уведомления о проблемах: станция офлайн, ошибка коннектора, низкий баланс партнёра. Красные — критичные, жёлтые — предупреждения." />

      {/* Filters */}
      <div className="flex gap-2">
        {SEVERITIES.map((s) => (
          <button
            key={s.label}
            onClick={() => setSeverity(s.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              severity === s.value
                ? "bg-zinc-900 dark:bg-white text-white dark:text-black"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center">
          <Icon icon="solar:check-circle-bold-duotone" width={48} className="text-green-500 mx-auto mb-4" />
          <p className="text-zinc-500">Нет активных алертов</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-start gap-3"
            >
              <Icon
                icon={severityIcon(alert.severity)}
                width={24}
                className={severityColor(alert.severity)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    alert.severity === "critical"
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600"
                      : alert.severity === "warning"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                  }`}>
                    {alert.severity}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {alert.created_at ? new Date(alert.created_at).toLocaleString("ru") : ""}
                  </span>
                </div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white mt-1">
                  {alert.title}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {alert.message}
                </p>
              </div>
              {!alert.acknowledged && (
                <button
                  onClick={() => ackMutation.mutate(alert.id)}
                  className="p-2 text-zinc-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  title="Подтвердить"
                >
                  <Icon icon="solar:check-circle-linear" width={20} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
