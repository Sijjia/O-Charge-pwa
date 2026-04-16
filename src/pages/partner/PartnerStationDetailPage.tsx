/**
 * Partner Station Detail Page
 * Shows per-station revenue, sessions, and technical info
 */

import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { usePartnerStations } from "@/features/partner/hooks/usePartnerStations";
import { usePartnerSessions } from "@/features/partner/hooks/usePartnerSessions";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";

const statusConfig = {
  online: { label: "Онлайн", color: "text-green-400 bg-green-400/10 border-green-400/20", icon: "solar:check-circle-linear" },
  charging: { label: "Заряжает", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: "solar:bolt-linear" },
  offline: { label: "Оффлайн", color: "text-gray-400 bg-gray-400/10 border-gray-400/20", icon: "solar:close-circle-linear" },
  maintenance: { label: "Обслуживание", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", icon: "solar:danger-triangle-linear" },
} as const;

export function PartnerStationDetailPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();
  const { data: stations, isLoading: stationsLoading } = usePartnerStations();
  const { data: sessionsData, isLoading: sessionsLoading } = usePartnerSessions({ stationId });

  const station = useMemo(
    () => stations?.find((s) => s.id === stationId),
    [stations, stationId],
  );

  // Calculate revenue stats from sessions
  const stats = useMemo(() => {
    const sessions = sessionsData?.sessions ?? [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const completed = sessions.filter((s) => s.status === "completed" || s.status === "stopped");

    const revenueAll = completed.reduce((sum, s) => sum + s.amount, 0);
    const partnerShareAll = completed.reduce((sum, s) => sum + (s.partner_share || s.amount * 0.8), 0);
    const energyAll = completed.reduce((sum, s) => sum + s.energy_kwh, 0);

    const todaySessions = completed.filter((s) => new Date(s.started_at) >= todayStart);
    const revenueToday = todaySessions.reduce((sum, s) => sum + s.amount, 0);
    const partnerShareToday = todaySessions.reduce((sum, s) => sum + (s.partner_share || s.amount * 0.8), 0);

    const weekSessions = completed.filter((s) => new Date(s.started_at) >= weekStart);
    const revenueWeek = weekSessions.reduce((sum, s) => sum + s.amount, 0);
    const partnerShareWeek = weekSessions.reduce((sum, s) => sum + (s.partner_share || s.amount * 0.8), 0);

    const monthSessions = completed.filter((s) => new Date(s.started_at) >= monthStart);
    const revenueMonth = monthSessions.reduce((sum, s) => sum + s.amount, 0);
    const partnerShareMonth = monthSessions.reduce((sum, s) => sum + (s.partner_share || s.amount * 0.8), 0);

    return {
      totalSessions: completed.length,
      revenueAll: Math.round(revenueAll),
      partnerShareAll: Math.round(partnerShareAll),
      energyAll: Math.round(energyAll * 10) / 10,
      revenueToday: Math.round(revenueToday),
      partnerShareToday: Math.round(partnerShareToday),
      todayCount: todaySessions.length,
      revenueWeek: Math.round(revenueWeek),
      partnerShareWeek: Math.round(partnerShareWeek),
      weekCount: weekSessions.length,
      revenueMonth: Math.round(revenueMonth),
      partnerShareMonth: Math.round(partnerShareMonth),
      monthCount: monthSessions.length,
    };
  }, [sessionsData]);

  // Recent sessions (last 10)
  const recentSessions = useMemo(
    () => (sessionsData?.sessions ?? []).slice(0, 10),
    [sessionsData],
  );

  if (stationsLoading || sessionsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Icon icon="solar:refresh-linear" width={32} className="text-red-500 animate-spin" />
      </div>
    );
  }

  if (!station) {
    return (
      <div className="p-6 text-center">
        <Icon icon="solar:close-circle-linear" width={48} className="text-zinc-400 mx-auto mb-3" />
        <p className="text-zinc-500 dark:text-zinc-400">Станция не найдена</p>
        <button
          onClick={() => navigate("/partner/stations")}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
        >
          Назад к станциям
        </button>
      </div>
    );
  }

  const cfg = statusConfig[station.status as keyof typeof statusConfig] ?? statusConfig.offline;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdminPageHeader
            title={
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/partner/stations")}
                  className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors shrink-0"
                >
                  <Icon icon="solar:arrow-left-linear" width={20} />
                </button>
                <span className="truncate">{station.name}</span>
              </div>
            }
            subtitle={`${station.address}, ${station.city}`}
          >
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${cfg.color}`}>
              <Icon icon={cfg.icon} width={14} />
              {cfg.label}
            </span>
          </AdminPageHeader>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Station Info Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Модель</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{station.model}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Мощность</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{station.power_kw} кВт</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Коннекторов</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{station.connectors}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Тариф</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{station.price_per_kwh} сом/кВтч</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Серийный номер</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{station.serial_number}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Последний heartbeat</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                {station.last_heartbeat ? new Date(station.last_heartbeat).toLocaleString("ru-RU") : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">Доход по станции</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Today */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-3">
                <Icon icon="solar:calendar-minimalistic-linear" width={16} />
                <span className="text-xs font-medium">Сегодня</span>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.partnerShareToday.toLocaleString()} <span className="text-sm font-normal text-zinc-400">сом</span></p>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>{stats.todayCount} сессий</span>
                <span className="text-zinc-400 dark:text-zinc-500">Общая: {stats.revenueToday.toLocaleString()}</span>
              </div>
            </div>

            {/* Week */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-3">
                <Icon icon="solar:calendar-linear" width={16} />
                <span className="text-xs font-medium">Неделя</span>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.partnerShareWeek.toLocaleString()} <span className="text-sm font-normal text-zinc-400">сом</span></p>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>{stats.weekCount} сессий</span>
                <span className="text-zinc-400 dark:text-zinc-500">Общая: {stats.revenueWeek.toLocaleString()}</span>
              </div>
            </div>

            {/* Month */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-3">
                <Icon icon="solar:calendar-mark-linear" width={16} />
                <span className="text-xs font-medium">Месяц</span>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.partnerShareMonth.toLocaleString()} <span className="text-sm font-normal text-zinc-400">сом</span></p>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>{stats.monthCount} сессий</span>
                <span className="text-zinc-400 dark:text-zinc-500">Общая: {stats.revenueMonth.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/10 border border-red-200/50 dark:border-red-500/10 rounded-xl p-4 text-center">
            <Icon icon="solar:wallet-money-linear" width={24} className="text-red-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-zinc-900 dark:text-white">{stats.partnerShareAll.toLocaleString()}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Ваш доход (сом)</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
            <Icon icon="solar:chart-2-linear" width={24} className="text-blue-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-zinc-900 dark:text-white">{stats.revenueAll.toLocaleString()}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Общая выручка (сом)</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
            <Icon icon="solar:bolt-circle-linear" width={24} className="text-yellow-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-zinc-900 dark:text-white">{stats.energyAll}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Энергия (кВтч)</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
            <Icon icon="solar:pulse-2-linear" width={24} className="text-green-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-zinc-900 dark:text-white">{stats.totalSessions}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Всего сессий</p>
          </div>
        </div>

        {/* Recent Sessions */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">Последние сессии</h2>
          {recentSessions.length > 0 ? (
            <div className="bg-white dark:bg-[#111621] md:rounded-3xl border-y md:border border-zinc-200 dark:border-white/[0.04] overflow-hidden md:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] md:dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] transition-all">
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-white/5">
                    <tr>
                      <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-left">Дата</th>
                      <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-left">Статус</th>
                      <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-right">Энергия</th>
                      <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-right">Сумма</th>
                      <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-right">Ваша доля</th>
                      <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-right">Длительность</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.02]">
                    {recentSessions.map((session) => (
                      <tr key={session.id} className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors text-sm">
                        <td className="py-4 px-6 whitespace-nowrap align-middle text-zinc-700 dark:text-zinc-300">
                          {new Date(session.started_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap align-middle">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${session.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : session.status === "in_progress" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}>
                            {session.status === "completed" ? "Завершена" : session.status === "in_progress" ? "В процессе" : "Остановлена"}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap align-middle text-right text-zinc-700 dark:text-zinc-300">{session.energy_kwh.toFixed(1)} кВтч</td>
                        <td className="py-4 px-6 whitespace-nowrap align-middle text-right text-zinc-700 dark:text-zinc-300">{session.amount.toFixed(0)} сом</td>
                        <td className="py-4 px-6 whitespace-nowrap align-middle text-right font-medium text-red-600 dark:text-red-400">{(session.partner_share || session.amount * 0.8).toFixed(0)} сом</td>
                        <td className="py-4 px-6 whitespace-nowrap align-middle text-right text-zinc-500 dark:text-zinc-400">{session.duration_minutes} мин</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                {recentSessions.map((session) => (
                  <div key={session.id} className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(session.started_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${session.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}>
                        {session.status === "completed" ? "Завершена" : "Остановлена"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{session.energy_kwh.toFixed(1)} кВтч / {session.duration_minutes} мин</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">{(session.partner_share || session.amount * 0.8).toFixed(0)} сом</span>
                        <span className="text-xs text-zinc-400 ml-1">из {session.amount.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center">
              <Icon icon="solar:list-cross-linear" width={32} className="text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Сессий пока нет</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
