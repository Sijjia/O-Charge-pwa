/**
 * Partner Dashboard — KPI карточки и обзор
 */

import { Icon } from "@iconify/react";
import { usePartnerDashboard } from "@/features/partner/hooks/usePartnerDashboard";

interface KPICardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

function KPICard({ icon, label, value, sub, color = "text-red-400" }: KPICardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm dark:shadow-none transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 ${color}`}>
          <Icon icon={icon} width={22} />
        </div>
        <span className="text-sm text-zinc-500 dark:text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-zinc-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export function PartnerDashboardPage() {
  const { data, isLoading, isError, error } = usePartnerDashboard();

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Icon icon="solar:refresh-linear" width={32} className="text-red-500 animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Icon icon="solar:danger-triangle-bold-duotone" width={48} className="text-red-400 mb-3" />
        <p className="text-zinc-400 text-sm">{(error as Error)?.message || "Не удалось загрузить данные партнёра"}</p>
      </div>
    );
  }

  const d = data;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Панель партнёра</h1>
        <p className="text-zinc-500 dark:text-gray-400 text-sm mt-1">Обзор ваших станций и доходов</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KPICard
          icon="solar:battery-charge-linear"
          label="Всего станций"
          value={d.stations_total}
          sub={`${d.stations_online} онлайн`}
          color="text-blue-400"
        />
        <KPICard
          icon="solar:bolt-linear"
          label="Заряжается"
          value={d.stations_charging ?? 0}
          sub={`${d.stations_offline ?? 0} оффлайн`}
          color="text-green-400"
        />
        <KPICard
          icon="solar:history-linear"
          label="Сессий сегодня"
          value={d.sessions_today}
          sub={`${d.sessions_month} за месяц`}
          color="text-purple-400"
        />
        <KPICard
          icon="solar:wallet-linear"
          label="Доход сегодня"
          value={`${d.revenue_today.toLocaleString()} сом`}
          sub={`${(d.revenue_week ?? 0).toLocaleString()} за неделю`}
          color="text-yellow-400"
        />
      </div>

      {/* Revenue Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Доход за месяц</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 dark:text-gray-400">Общий доход</span>
              <span className="text-xl font-bold text-zinc-900 dark:text-white">{d.revenue_month.toLocaleString()} сом</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 dark:text-gray-400">Ваша доля ({d.partner_share_percent ?? 80}%)</span>
              <span className="text-xl font-bold text-green-400">{(d.partner_revenue_month ?? 0).toLocaleString()} сом</span>
            </div>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 dark:text-gray-400">Энергия за месяц</span>
              <span className="text-zinc-900 dark:text-white font-medium">{(d.energy_month_kwh ?? 0).toLocaleString()} кВтч</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Статистика</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 dark:text-gray-400">Сессий за месяц</span>
              <span className="text-zinc-900 dark:text-white font-medium">{d.sessions_month}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 dark:text-gray-400">Общий доход (всё время)</span>
              <span className="text-zinc-900 dark:text-white font-medium">{(d.revenue_total ?? 0).toLocaleString()} сом</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 dark:text-gray-400">Энергия сегодня</span>
              <span className="text-zinc-900 dark:text-white font-medium">{(d.energy_today_kwh ?? 0).toLocaleString()} кВтч</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 dark:text-gray-400">Средний чек</span>
              <span className="text-zinc-900 dark:text-white font-medium">
                {d.sessions_month > 0
                  ? Math.round(d.revenue_month / d.sessions_month)
                  : 0}{" "}
                сом
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
