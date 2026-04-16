/**
 * Admin Dashboard Overview Page
 * Global system analytics: all stations, clients, partners, revenue
 * Separate from Owner Dashboard which shows only owner's data
 */

import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useUnifiedAuthStore } from '@/features/auth/unifiedAuthStore';
import { useAdminAnalyticsOverview } from '@/features/admin/hooks/useAdminAnalytics';
import { useAdminAlerts } from '@/features/admin/hooks/useAdminAlerts';
import { fetchJson } from '@/api/unifiedClient';
import { isDemoModeActive } from '@/shared/demo/useDemoMode';
import { demoOwnerSessions } from '@/shared/demo/demoData';
import { formatPrice, formatDateTime } from '@/shared/utils/formatters';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { AdminStatCard } from '@/features/admin/components/AdminStatCard';
import { AdminStatusBadge } from '@/features/admin/components/AdminStatusBadge';

/* ------------------------------------------------------------------ */
/*  Recent Sessions Schema (light fetch, last 5)                       */
/* ------------------------------------------------------------------ */

const RecentSessionSchema = z.object({
  id: z.string(),
  client_phone: z.string().nullable().optional(),
  station_id: z.string(),
  station_model: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  status: z.string(),
  energy_kwh: z.number(),
  amount: z.number(),
  start_time: z.string().nullable().optional(),
  duration_minutes: z.number().nullable().optional(),
});

const RecentSessionsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(RecentSessionSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

/* ------------------------------------------------------------------ */
/*  Status badge helper                                                */
/* ------------------------------------------------------------------ */

function getStatusBadge(status: string): { variant: 'info' | 'success' | 'error' | 'warning' | 'neutral'; label: string } {
  switch (status) {
    case 'active': case 'charging': return { variant: 'info', label: 'Активна' };
    case 'completed': return { variant: 'success', label: 'Завершена' };
    case 'stopped': return { variant: 'warning', label: 'Остановлена' };
    case 'failed': return { variant: 'error', label: 'Ошибка' };
    case 'cancelled': return { variant: 'error', label: 'Отменена' };
    default: return { variant: 'neutral', label: status };
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { owner, isAuthenticated } = useUnifiedAuthStore((s) => ({ owner: s.owner, isAuthenticated: s.isAuthenticated }));

  // Fetch global analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useAdminAnalyticsOverview();

  // Fetch alerts
  const { data: alertsData } = useAdminAlerts();
  const alerts = alertsData?.alerts ?? [];

  // Fetch recent 5 sessions
  const { data: recentData } = useQuery({
    queryKey: ['admin-sessions-recent'],
    queryFn: () => {
      if (isDemoModeActive()) {
        return Promise.resolve({ success: true, data: demoOwnerSessions.slice(0, 5), total: demoOwnerSessions.length, limit: 5, offset: 0 });
      }
      return fetchJson(
        '/api/v1/admin/sessions?limit=5&offset=0',
        { method: 'GET' },
        RecentSessionsResponseSchema,
      );
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    retry: 1,
  });
  const recentSessions = recentData?.data ?? [];

  // Loading
  if (analyticsLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  // Extract data from analytics response
  const stats = analyticsData?.data;
  const totalStations = stats?.total_stations || 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdminPageHeader
            title="Глобальная аналитика"
            helpText="Панель администратора. Здесь отображается статистика по всей системе: все станции, клиенты, партнёры и выручка."
            subtitle={`Администратор: ${owner?.email || owner?.phone || 'Admin'}`}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AdminStatCard
            label="Всего станций"
            helpText="Все зарядные станции в системе"
            value={totalStations}
            icon="solar:battery-charge-linear"
            trend="+2 за этот месяц"
            trendUp={true}
          />
          <AdminStatCard
            label="Сессий сегодня"
            helpText="Количество зарядок за сегодня"
            value={stats?.sessions_today || 0}
            icon="solar:pulse-2-linear"
            trend="+12% со вчера"
            trendUp={true}
          />
          <AdminStatCard
            label="Активных пользователей"
            helpText="Пользователей онлайн сейчас"
            value={stats?.active_users || 0}
            icon="solar:users-group-rounded-linear"
            trend="+5% за неделю"
            trendUp={true}
          />
          <AdminStatCard
            label="Всего сессий"
            helpText="Сессий за все время"
            value={stats?.total_sessions || 0}
            icon="solar:history-linear"
            trend="+24% с прошлого месяца"
            trendUp={true}
          />
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Today Revenue */}
          <div className="bg-white dark:bg-[#111621] rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] border border-zinc-100 dark:border-white/[0.04] p-6 relative overflow-hidden group">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-yellow-500/10 dark:bg-yellow-500/5 rounded-full blur-3xl transition-colors" />
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-100 dark:border-yellow-500/20">
                <Icon icon="solar:sun-bold" width={24} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Выручка сегодня</h3>
            </div>
            <div className="relative z-10">
              <p className="text-3xl sm:text-4xl font-bold font-display tracking-tighter text-zinc-900 dark:text-white truncate">
                {formatPrice(stats?.revenue_today || 0)} <span className="text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 font-medium">сом</span>
              </p>
              <p className="inline-flex items-center flex-wrap gap-2 text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-300 mt-4 bg-zinc-50 dark:bg-[#1C212B] px-3 sm:px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/5">
                <Icon icon="solar:bolt-circle-bold" width={18} className="text-yellow-500 shrink-0" />
                <span>{(stats?.energy_today || 0).toFixed(1)} кВт*ч отпущено</span>
              </p>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white dark:bg-[#111621] rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] border border-zinc-100 dark:border-white/[0.04] p-6 relative overflow-hidden group">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl transition-colors" />
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-100 dark:border-emerald-500/20">
                <Icon icon="solar:graph-up-bold" width={24} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Всего выручка</h3>
            </div>
            <div className="relative z-10">
              <p className="text-3xl sm:text-4xl font-bold font-display tracking-tighter text-zinc-900 dark:text-white truncate">
                {formatPrice(stats?.total_revenue || 0)} <span className="text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 font-medium">сом</span>
              </p>
              <p className="inline-flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-300 mt-4 bg-zinc-50 dark:bg-[#1C212B] px-3 sm:px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/5">
                <Icon icon="solar:bolt-circle-bold" width={18} className="text-emerald-500 shrink-0" />
                <span>{(stats?.total_energy_kwh || 0).toFixed(1)} кВт*ч всего</span>
              </p>
            </div>
          </div>
        </div>

        {/* Middle Row: Alerts + Recent Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Critical Alerts */}
          <div className="bg-white dark:bg-[#111621] rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] border border-zinc-100 dark:border-white/[0.04] p-5 sm:p-6 relative overflow-hidden flex flex-col">
            <div className="flex flex-row items-center justify-between mb-6 gap-2">
              <h3 className="text-lg sm:text-xl font-bold font-display tracking-tight text-zinc-900 dark:text-white">Критические алерты</h3>
              <button
                onClick={() => navigate('/admin/alerts')}
                className="shrink-0 text-xs sm:text-sm font-semibold px-3 py-1.5 sm:px-4 sm:py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors active:scale-95"
              >
                Все алерты
              </button>
            </div>
            {alerts.length === 0 ? (
              <div className="text-center py-8 flex-1 flex flex-col justify-center items-center">
                <div className="w-16 h-16 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                  <Icon icon="solar:shield-check-bold" width={32} className="text-green-500" />
                </div>
                <p className="text-base text-zinc-600 dark:text-zinc-400 font-medium">Система работает штатно</p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">Нет критических алертов</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert: any) => (
                  <div
                    key={alert.id}
                    className="p-4 bg-red-50/50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-2xl flex items-start gap-3 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <div className="flex items-start gap-2">
                      <Icon icon="solar:danger-circle-bold" width={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900 dark:text-red-200">{alert.title || 'Алерт'}</p>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">{alert.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Sessions */}
          <div className="bg-white dark:bg-[#111621] rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] border border-zinc-100 dark:border-white/[0.04] p-5 sm:p-6 relative overflow-hidden flex flex-col">
            <div className="flex flex-row items-center justify-between mb-6 gap-2">
              <h3 className="text-lg sm:text-xl font-bold font-display tracking-tight text-zinc-900 dark:text-white">Последние сессии</h3>
              <button
                onClick={() => navigate('/admin/sessions')}
                className="shrink-0 text-xs sm:text-sm font-semibold px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors active:scale-95"
              >
                Все сессии
              </button>
            </div>
            {recentSessions.length === 0 ? (
              <div className="text-center py-8 flex-1 flex flex-col justify-center items-center">
                <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                  <Icon icon="solar:ghost-outline" width={32} className="text-zinc-400" />
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Сессий пока нет</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((session: any) => (
                  <div
                    key={session.id}
                    className="p-4 bg-zinc-50/50 dark:bg-[#1C212B]/50 border border-zinc-100 dark:border-white/5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors active:scale-[0.99] shadow-sm dark:shadow-none"
                    onClick={() => navigate(`/admin/sessions/${session.id}`)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{session.station_model || 'Station'}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                          {session.location_name} • {session.client_phone}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                          {(session.energy_kwh || 0).toFixed(1)} кВт⋅ч • {formatPrice(session.amount || 0)} сом
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {(() => {
                          const badge = getStatusBadge(session.status);
                          return <AdminStatusBadge variant={badge.variant} label={badge.label} />;
                        })()}
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {formatDateTime(session.start_time)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white dark:bg-[#111621] rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] border border-zinc-100 dark:border-white/[0.04] p-6 relative overflow-hidden">
          <h3 className="text-xl font-bold font-display tracking-tight text-zinc-900 dark:text-white mb-6">Быстрый доступ</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/analytics')}
              className="flex flex-col items-center gap-3 p-4 bg-zinc-50 dark:bg-[#1C212B] rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all active:scale-95 group"
            >
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <Icon icon="solar:chart-square-bold-duotone" width={28} />
              </div>
              <span className="text-sm font-semibold text-zinc-900 dark:text-white mt-1">Аналитика</span>
            </button>
            <button
              onClick={() => navigate('/admin/alerts')}
              className="flex flex-col items-center gap-3 p-4 bg-zinc-50 dark:bg-[#1C212B] rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all active:scale-95 group"
            >
              <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                <Icon icon="solar:bell-bing-bold-duotone" width={28} />
              </div>
              <span className="text-sm font-semibold text-zinc-900 dark:text-white mt-1">Алерты</span>
            </button>
            <button
              onClick={() => navigate('/admin/clients')}
              className="flex flex-col items-center gap-3 p-4 bg-zinc-50 dark:bg-[#1C212B] rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all active:scale-95 group"
            >
              <div className="w-12 h-12 bg-green-50 dark:bg-green-500/10 rounded-xl flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                <Icon icon="solar:users-group-two-rounded-bold-duotone" width={28} />
              </div>
              <span className="text-sm font-semibold text-zinc-900 dark:text-white mt-1">Клиенты</span>
            </button>
            <button
              onClick={() => navigate('/admin/partners')}
              className="flex flex-col items-center gap-3 p-4 bg-zinc-50 dark:bg-[#1C212B] rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all active:scale-95 group"
            >
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <Icon icon="solar:handshake-bold-duotone" width={28} />
              </div>
              <span className="text-sm font-semibold text-zinc-900 dark:text-white mt-1">Партнёры</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
