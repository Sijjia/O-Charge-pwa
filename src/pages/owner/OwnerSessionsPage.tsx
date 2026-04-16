/**
 * Owner Sessions Page
 * Display charging session history with filters and search
 * Connected to GET /api/v1/admin/sessions
 *
 * Filters: status, connector, location, partner
 */

import { useState, useMemo, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { fetchJson } from '@/api/unifiedClient';
import { isDemoModeActive } from '@/shared/demo/useDemoMode';
import { demoOwnerSessions } from '@/shared/demo/demoData';
import { formatPrice } from '@/shared/utils/formatters';
import { SessionDetailsModal } from '@/features/owner/components/SessionDetailsModal';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { AdminSearchBar } from '@/features/admin/components/AdminSearchBar';
import { AdminFilterBar, FilterSelect } from '@/features/admin/components/AdminFilterBar';
import { AdminStatCard } from '@/features/admin/components/AdminStatCard';
import { AdminStatusBadge } from '@/features/admin/components/AdminStatusBadge';
import { AdminDataTable, type Column } from '@/features/admin/components/AdminDataTable';

// Zod schemas for backend response
const AdminSessionSchema = z.object({
  id: z.string(),
  client_id: z.string().nullable().optional(),
  client_phone: z.string().nullable().optional(),
  station_id: z.string(),
  connector_id: z.number().nullable().optional(),
  station_model: z.string().nullable().optional(),
  location_id: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  partner_id: z.string().nullable().optional(),
  partner_name: z.string().nullable().optional(),
  status: z.string(),
  energy_kwh: z.number(),
  amount: z.number(),
  start_time: z.string().nullable().optional(),
  stop_time: z.string().nullable().optional(),
  duration_minutes: z.number().nullable().optional(),
  partner_share: z.number().nullable().optional(),
  platform_share: z.number().nullable().optional(),
}).passthrough();

const AdminSessionsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(AdminSessionSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
}).passthrough();

// Partners select schema
const PartnersSelectSchema = z.object({
  success: z.boolean(),
  partners: z.array(z.object({
    id: z.string(),
    user_id: z.string(),
    label: z.string(),
  })),
}).passthrough();

// Locations list schema (for filter dropdown)
const LocationsListSchema = z.object({
  success: z.boolean(),
  data: z.array(z.object({
    id: z.string(),
    name: z.string(),
  }).passthrough()),
}).passthrough();

export type ChargingSession = z.infer<typeof AdminSessionSchema>;

type SessionStatus = 'all' | 'active' | 'completed' | 'failed' | 'stopped';

function mapSessionStatus(status: string): 'online' | 'success' | 'error' | 'warning' | 'info' | 'neutral' {
  switch (status) {
    case 'active': return 'info';
    case 'completed': return 'success';
    case 'stopped': return 'warning';
    case 'failed': return 'error';
    default: return 'neutral';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'active': return 'Активна';
    case 'completed': return 'Завершена';
    case 'stopped': return 'Остановлена';
    case 'failed': return 'Ошибка';
    default: return status;
  }
}

export function OwnerSessionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionStatus>('all');
  const [connectorFilter, setConnectorFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState<ChargingSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewSession = (session: ChargingSession) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

  // Fetch partners for filter dropdown
  const { data: partnersData } = useQuery({
    queryKey: ['admin-partners-select'],
    queryFn: () => fetchJson('/api/v1/admin/partners/select', { method: 'GET' }, PartnersSelectSchema),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch locations for filter dropdown
  const { data: locationsData } = useQuery({
    queryKey: ['admin-locations-select'],
    queryFn: () => fetchJson('/api/v1/admin/locations?limit=200&offset=0', { method: 'GET' }, LocationsListSchema),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch sessions from backend with server-side filters
  const { data: sessionsData, isLoading, error: loadError } = useQuery({
    queryKey: ['admin-sessions', statusFilter, connectorFilter, locationFilter, partnerFilter],
    queryFn: async () => {
      if (isDemoModeActive()) {
        const data = statusFilter !== 'all' ? demoOwnerSessions.filter(s => s.status === statusFilter) : demoOwnerSessions;
        return { success: true, data, total: data.length, limit: 200, offset: 0 } as z.infer<typeof AdminSessionsResponseSchema>;
      }
      const params = new URLSearchParams({ limit: '200', offset: '0' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (connectorFilter !== 'all') params.set('connector_id', connectorFilter);
      if (locationFilter !== 'all') params.set('location_id', locationFilter);
      if (partnerFilter !== 'all') params.set('partner_id', partnerFilter);
      return fetchJson(
        `/api/v1/admin/sessions?${params.toString()}`,
        { method: 'GET' },
        AdminSessionsResponseSchema,
      );
    },
  });

  const sessions = sessionsData?.data ?? [];

  // Filter sessions based on search query (client-side)
  const filteredSessions = useMemo(() => {
    if (!searchQuery) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter((session) =>
      session.station_id.toLowerCase().includes(q) ||
      (session.location_name?.toLowerCase().includes(q)) ||
      (session.client_phone?.toLowerCase().includes(q)) ||
      (session.station_model?.toLowerCase().includes(q)) ||
      (session.partner_name?.toLowerCase().includes(q))
    );
  }, [sessions, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = sessionsData?.total ?? 0;
    const active = sessions.filter((s) => s.status === 'active' || s.status === 'started').length;
    const totalRevenue = sessions.reduce((sum, s) => sum + s.amount, 0);
    const totalEnergy = sessions.reduce((sum, s) => sum + s.energy_kwh, 0);
    const partnerRevenue = sessions.reduce((sum, s) => sum + (s.partner_share ?? 0), 0);

    return { total, active, totalRevenue, totalEnergy, partnerRevenue };
  }, [sessions, sessionsData?.total]);

  const formatDate = useCallback((dateString: string | null | undefined) => {
    if (!dateString) return '\u2014';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }, []);

  // Build filter options
  const partnerOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'Все владельцы' }];
    if (partnersData?.partners) {
      for (const p of partnersData.partners) {
        opts.push({ value: p.id, label: p.label });
      }
    }
    return opts;
  }, [partnersData]);

  const locationOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'Все локации' }];
    if (locationsData?.data) {
      for (const l of locationsData.data) {
        opts.push({ value: l.id, label: l.name });
      }
    }
    return opts;
  }, [locationsData]);

  // Table columns
  const columns: Column<ChargingSession>[] = useMemo(() => [
    {
      key: 'station',
      header: 'Станция / Разъем',
      render: (session) => (
        <div>
          <div className="text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-1.5">
            {session.station_model || session.station_id}
            {session.connector_id != null && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
                <Icon icon="solar:plug-circle-linear" width={12} />
                #{session.connector_id}
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
            <Icon icon="solar:map-point-linear" width={12} />
            {session.location_name || '\u2014'}
          </div>
        </div>
      ),
    },
    {
      key: 'partner',
      header: 'Владелец',
      render: (session) => (
        <span className="text-sm text-zinc-900 dark:text-white">
          {session.partner_name || (
            <span className="text-zinc-400 dark:text-zinc-500">Red Petroleum</span>
          )}
        </span>
      ),
    },
    {
      key: 'client',
      header: 'Клиент',
      render: (session) => (
        <span className="text-sm text-zinc-900 dark:text-white">
          {session.client_phone || 'Аноним'}
        </span>
      ),
    },
    {
      key: 'time',
      header: 'Время',
      render: (session) => (
        <div>
          <div className="text-sm text-zinc-900 dark:text-white">
            {formatDate(session.start_time)}
          </div>
          {session.duration_minutes != null && session.duration_minutes > 0 && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {Math.floor(session.duration_minutes / 60)}ч {Math.round(session.duration_minutes % 60)}м
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'energy',
      header: 'Энергия',
      render: (session) => (
        <span className="text-sm font-medium text-zinc-900 dark:text-white">
          {session.energy_kwh.toFixed(1)} кВт*ч
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Сумма',
      render: (session) => (
        <div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-white">
            {formatPrice(session.amount, 'сом', 0)}
          </div>
          {session.partner_share != null && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              П: {formatPrice(session.partner_share, '', 0)} / Пл: {formatPrice(session.platform_share ?? 0, '', 0)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      render: (session) => (
        <AdminStatusBadge
          variant={mapSessionStatus(session.status)}
          label={getStatusText(session.status)}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (session) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleViewSession(session); }}
          className="text-red-500 hover:text-red-400 font-medium text-sm hover:underline"
        >
          Детали
        </button>
      ),
    },
  ], [formatDate]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdminPageHeader
            title="Сессии" helpText="Все зарядные сессии пользователей. Фильтруйте по разъему, локации, партнеру или статусу. Кликните на строку для подробностей."
            subtitle="История зарядок — по разъемам, локациям и владельцам"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <AdminStatCard
            label="Всего сессий"
            value={stats.total}
            icon="solar:history-linear"
          />
          <AdminStatCard
            label="Активных"
            value={stats.active}
            icon="solar:bolt-circle-bold"
          />
          <AdminStatCard
            label="Выручка"
            value={formatPrice(stats.totalRevenue, 'сом', 0)}
            icon="solar:dollar-linear"
          />
          <AdminStatCard
            label="Доля партнеров"
            value={formatPrice(stats.partnerRevenue, 'сом', 0)}
            icon="solar:hand-money-linear"
          />
          <AdminStatCard
            label="Энергия"
            value={`${stats.totalEnergy.toFixed(1)} кВт*ч`}
            icon="solar:bolt-linear"
          />
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3 mb-6">
          <AdminSearchBar
            placeholder="Поиск по станции, локации, партнеру или телефону..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <AdminFilterBar>
            <FilterSelect
              label="Статус"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as SessionStatus)}
              options={[
                { value: 'all', label: 'Все статусы' },
                { value: 'active', label: 'Активные' },
                { value: 'completed', label: 'Завершенные' },
                { value: 'stopped', label: 'Остановленные' },
                { value: 'failed', label: 'Ошибки' },
              ]}
              icon="solar:filter-linear"
            />
            <FilterSelect
              label="Разъем"
              value={connectorFilter}
              onChange={setConnectorFilter}
              options={[
                { value: 'all', label: 'Все разъемы' },
                { value: '1', label: 'Разъем #1' },
                { value: '2', label: 'Разъем #2' },
                { value: '3', label: 'Разъем #3' },
              ]}
              icon="solar:plug-circle-linear"
            />
            <FilterSelect
              label="Локация"
              value={locationFilter}
              onChange={setLocationFilter}
              options={locationOptions}
              icon="solar:map-point-linear"
              className="w-full md:w-64"
            />
            <FilterSelect
              label="Владелец"
              value={partnerFilter}
              onChange={setPartnerFilter}
              options={partnerOptions}
              icon="solar:users-group-rounded-linear"
              className="w-full md:w-56"
            />
          </AdminFilterBar>
        </div>

        {/* Sessions Table */}
        {loadError ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-12 text-center">
            <Icon icon="solar:danger-triangle-linear" width={48} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-500 dark:text-red-400">
              {loadError instanceof Error ? loadError.message : 'Ошибка загрузки сессий'}
            </p>
          </div>
        ) : (
          <AdminDataTable
            columns={columns}
            data={filteredSessions}
            keyExtractor={(s) => s.id}
            loading={isLoading}
            emptyMessage={
              searchQuery || statusFilter !== 'all' || connectorFilter !== 'all' || locationFilter !== 'all' || partnerFilter !== 'all'
                ? 'Нет сессий по заданным фильтрам'
                : 'Сессии появятся после начала зарядок'
            }
          />
        )}

        {/* Pagination info */}
        {sessionsData && sessionsData.total > 0 && (
          <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Показано {filteredSessions.length} из {sessionsData.total} сессий
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      <SessionDetailsModal
        session={selectedSession}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
