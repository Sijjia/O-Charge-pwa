/**
 * Owner / Admin Dashboard Overview Page
 * Displays KPIs, revenue breakdown, problem summary, and recent sessions
 */

import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { usePanelBase } from '@/shared/hooks/usePanelBase';
import { useOwnerAuth } from '@/features/owner/hooks/useOwnerAuth';
import { useOwnerStats } from '@/features/owner/hooks/useOwnerStats';
import { useLocations } from '@/features/locations/hooks/useLocations';
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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function mapSessionBadge(status: string): { variant: 'info' | 'success' | 'error' | 'warning' | 'neutral'; label: string } {
  switch (status) {
    case 'active': case 'charging': return { variant: 'info', label: 'Активна' };
    case 'completed': return { variant: 'success', label: 'Завершена' };
    case 'stopped': return { variant: 'warning', label: 'Остановлена' };
    case 'failed': case 'cancelled': return { variant: 'error', label: status === 'failed' ? 'Ошибка' : 'Отменена' };
    default: return { variant: 'neutral', label: status };
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function OwnerDashboardPage() {
  const navigate = useNavigate();
  const base = usePanelBase();
  const { user } = useOwnerAuth();
  const { data: stats, isLoading } = useOwnerStats(user?.id);
  const { locations } = useLocations(false);

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
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    retry: 1,
  });
  const recentSessions = recentData?.data ?? [];

  // Problem locations
  const problemLocations = useMemo(() => {
    return locations.filter(
      (l) => l.status === 'offline' || l.status === 'maintenance' || l.status === 'partial',
    );
  }, [locations]);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  const uptimePercent = Math.max(
    0,
    Math.min(100, Math.round(((stats?.activeStations || 0) / Math.max(1, stats?.totalStations || 0)) * 100)),
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdminPageHeader
            title="Обзор" helpText="Главная панель управления. Здесь отображается общая статистика по станциям, сессиям и выручке за выбранный период."
            subtitle={`Добро пожаловать, ${user?.email}`}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <AdminStatCard
            label="Станций" helpText="Общее количество зарядных станций в системе"
            value={stats?.totalStations || 0}
            icon="solar:battery-charge-linear"
            trend={`${stats?.activeStations || 0} онлайн`}
            trendUp
          />
          <AdminStatCard
            label="Локаций" helpText="Количество физических точек размещения станций (одна локация может иметь несколько станций)"
            value={stats?.totalLocations || 0}
            icon="solar:map-point-linear"
          />
          <AdminStatCard
            label="Клиентов" helpText="Зарегистрированные пользователи мобильного приложения"
            value={stats?.totalClients || 0}
            icon="solar:users-group-rounded-linear"
          />
          <AdminStatCard
            label="Партнёров" helpText="Компании-владельцы зарядных станций"
            value={stats?.totalPartners || 0}
            icon="solar:buildings-linear"
          />
          <AdminStatCard
            label="Активные сессии" helpText="Количество зарядок которые происходят прямо сейчас"
            value={stats?.activeSessions || 0}
            icon="solar:pulse-2-linear"
            trend="Сейчас заряжается"
          />
          <AdminStatCard
            label="Uptime" helpText="Процент времени за последние 24 часа когда станции были онлайн и доступны для зарядки"
            value={`${uptimePercent}%`}
            icon="solar:shield-check-linear"
            trend="онлайн станций"
          />
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Today */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="solar:sun-linear" width={20} className="text-yellow-500" />
              <h3 className="font-semibold text-zinc-900 dark:text-white">Сегодня</h3>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white">
              {(stats?.todayRevenue || 0).toFixed(0)} <span className="text-lg text-zinc-500 dark:text-zinc-400">сом</span>
            </p>
          </div>

          {/* Week */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="solar:calendar-minimalistic-linear" width={20} className="text-blue-500" />
              <h3 className="font-semibold text-zinc-900 dark:text-white">За неделю</h3>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white">
              {(stats?.weeklyRevenue || 0).toFixed(0)} <span className="text-lg text-zinc-500 dark:text-zinc-400">сом</span>
            </p>
          </div>

          {/* Month */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="solar:calendar-linear" width={20} className="text-green-500" />
              <h3 className="font-semibold text-zinc-900 dark:text-white">За месяц</h3>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white">
              {(stats?.monthlyRevenue || 0).toFixed(0)} <span className="text-lg text-zinc-500 dark:text-zinc-400">сом</span>
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
              {(stats?.monthlyEnergy || 0).toFixed(1)} кВт*ч отпущено
            </p>
          </div>
        </div>

        {/* Middle Row: Problems + Recent Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Problem Summary */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Сводка проблем</h3>
              <Icon icon="solar:danger-triangle-linear" width={20} className="text-yellow-600" />
            </div>
            {locations.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Данные отсутствуют</p>
            ) : problemLocations.length === 0 ? (
              <div className="text-center py-6">
                <Icon icon="solar:check-circle-linear" width={40} className="text-green-500 mx-auto mb-2" />
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Все станции работают</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Offline</p>
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                      {locations.filter((l) => l.status === 'offline').length}
                    </p>
                  </div>
                  <div className="text-center border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Maintenance</p>
                    <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                      {locations.filter((l) => l.status === 'maintenance').length}
                    </p>
                  </div>
                  <div className="text-center border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Partial</p>
                    <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                      {locations.filter((l) => l.status === 'partial').length}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white mb-2">
                    Проблемные локации
                  </p>
                  <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {problemLocations.slice(0, 5).map((l) => (
                      <li key={l.id} className="py-2 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">{l.name}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{l.address}</p>
                        </div>
                        <AdminStatusBadge
                          variant={l.status === 'offline' ? 'error' : l.status === 'maintenance' ? 'warning' : 'neutral'}
                          label={l.status}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Recent Sessions */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Последние сессии</h3>
              <button
                onClick={() => navigate(`${base}/sessions`)}
                className="text-sm text-red-500 hover:text-red-400 font-medium"
              >
                Все сессии
              </button>
            </div>
            {recentSessions.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                <Icon icon="solar:pulse-2-linear" width={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Нет данных о сессиях</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((s) => {
                  const badge = mapSessionBadge(s.status);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => navigate(`${base}/sessions`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0">
                          <Icon
                            icon={s.status === 'charging' || s.status === 'active' ? 'solar:bolt-linear' : 'solar:check-circle-linear'}
                            width={20}
                            className={s.status === 'charging' || s.status === 'active' ? 'text-blue-400' : 'text-green-400'}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                            {s.station_model || s.station_id}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {s.client_phone || 'Аноним'} · {formatDateTime(s.start_time)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {formatPrice(s.amount, 'с.', 0)}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {s.energy_kwh.toFixed(1)} кВт*ч
                          </p>
                        </div>
                        <AdminStatusBadge variant={badge.variant} label={badge.label} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Быстрые действия
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { path: 'stations', icon: 'solar:battery-charge-linear', label: 'Станции' },
              { path: 'locations', icon: 'solar:map-point-linear', label: 'Локации' },
              { path: 'revenue', icon: 'solar:dollar-linear', label: 'Доходы' },
              { path: 'sessions', icon: 'solar:pulse-2-linear', label: 'Сессии' },
              { path: 'tariffs', icon: 'solar:tag-price-linear', label: 'Тарифы' },
              { path: 'logs', icon: 'solar:document-text-linear', label: 'OCPP Логи' },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(`${base}/${item.path}`)}
                className="p-4 border-2 border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-red-500 hover:bg-red-500/10 transition-colors text-left"
              >
                <Icon icon={item.icon} width={22} className="text-red-500 mb-2" />
                <p className="font-medium text-zinc-900 dark:text-white text-sm">{item.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
