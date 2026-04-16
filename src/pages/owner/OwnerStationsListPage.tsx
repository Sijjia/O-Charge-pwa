/**
 * Owner Stations List Page
 * Display and manage all stations owned by the user
 */

import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePanelBase } from '@/shared/hooks/usePanelBase';
import { Icon } from '@iconify/react';
import { useOwnerAuth } from '@/features/owner/hooks/useOwnerAuth';
import { useOwnerStations } from '@/features/owner/hooks/useOwnerStations';
import { RequireRole } from '@/shared/components/RequireRole';
import type { UserRole } from '@/features/auth/types/unified.types';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { AdminSearchBar } from '@/features/admin/components/AdminSearchBar';
import { AdminFilterBar, FilterSelect } from '@/features/admin/components/AdminFilterBar';
import { AdminStatCard } from '@/features/admin/components/AdminStatCard';
import { AdminStatusBadge } from '@/features/admin/components/AdminStatusBadge';
import { AdminEmptyState } from '@/features/admin/components/AdminEmptyState';

type StationStatusFilter = 'all' | 'active' | 'maintenance' | 'inactive';
type OwnershipFilter = 'all' | 'own' | 'partner';

function mapStationStatus(status: string): 'online' | 'offline' | 'charging' | 'warning' {
  switch (status) {
    case 'active': return 'online';
    case 'maintenance': return 'warning';
    default: return 'offline';
  }
}

function mapStationStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Активна';
    case 'maintenance': return 'Обслуживание';
    case 'inactive': return 'Неактивна';
    default: return status;
  }
}

export function OwnerStationsListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminView = location.pathname.startsWith('/admin');
  const base = usePanelBase();
  const { user } = useOwnerAuth();
  // Admin path: pass "admin" as ownerId — truthy, so query fires immediately
  // (Backend uses JWT cookie to authorize, ownerId is NOT sent to API)
  // Owner path: wait for Supabase Auth user to be loaded
  const { data: stations, isLoading, error } = useOwnerStations(isAdminView ? "admin" : user?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StationStatusFilter>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all');

  // Compute stats
  const stats = useMemo(() => {
    if (!stations) return { total: 0, online: 0, charging: 0 };
    return {
      total: stations.length,
      online: stations.filter((s) => s.status === 'active').length,
      charging: stations.filter((s) => (s.active_sessions || 0) > 0).length,
    };
  }, [stations]);

  // Filter stations by search query and status
  const filteredStations = useMemo(() => {
    let result = stations ?? [];
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }
    if (ownershipFilter !== 'all') {
      result = result.filter((s) =>
        ownershipFilter === 'partner' ? s.is_partner : !s.is_partner
      );
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (station) =>
          station.serial_number.toLowerCase().includes(q) ||
          station.model.toLowerCase().includes(q) ||
          station.manufacturer.toLowerCase().includes(q) ||
          station.location?.name.toLowerCase().includes(q)
      );
    }
    return result;
  }, [stations, searchQuery, statusFilter, ownershipFilter]);

  // Partner filter stats (admin only)
  const ownershipStats = useMemo(() => {
    if (!isAdminView || !filteredStations) return null;
    const partner = filteredStations.filter((s) => s.is_partner).length;
    return { own: filteredStations.length - partner, partner };
  }, [filteredStations, isAdminView]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Загрузка станций...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md">
          <div className="flex items-start gap-3">
            <Icon icon="solar:danger-circle-linear" width={24} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-700 dark:text-red-400 mb-1">Ошибка загрузки</h3>
              <p className="text-sm text-red-600 dark:text-red-400/80">
                Не удалось загрузить список станций. Попробуйте обновить страницу.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RequireRole allowed={['operator','admin','superadmin'] as ReadonlyArray<UserRole>}>
            <AdminPageHeader
              title="Мои станции"
              subtitle={`Управление зарядными станциями (${stations?.length || 0})`}
              actionLabel="Добавить станцию"
              actionIcon="solar:add-circle-linear"
              onAction={() => navigate(`${base}/stations/create`)}
            />
          </RequireRole>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <AdminStatCard
            label="Всего станций"
            value={stats.total}
            icon="solar:battery-charge-linear"
          />
          <AdminStatCard
            label="Онлайн"
            value={stats.online}
            icon="solar:check-circle-linear"
          />
          <AdminStatCard
            label="Заряжают"
            value={stats.charging}
            icon="solar:bolt-circle-bold"
          />
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <AdminSearchBar
            placeholder="Поиск по номеру, модели, локации..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <AdminFilterBar>
            <FilterSelect
              label="Статус"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StationStatusFilter)}
              options={[
                { value: 'all', label: 'Все статусы' },
                { value: 'active', label: 'Активные' },
                { value: 'maintenance', label: 'Обслуживание' },
                { value: 'inactive', label: 'Неактивные' },
              ]}
              icon="solar:filter-linear"
            />
            {isAdminView && (
              <FilterSelect
                label="Владелец"
                value={ownershipFilter}
                onChange={(v) => setOwnershipFilter(v as OwnershipFilter)}
                options={[
                  { value: 'all', label: `Все станции${ownershipStats ? ` (${filteredStations.length})` : ''}` },
                  { value: 'own', label: `Свои${ownershipStats ? ` (${ownershipStats.own})` : ''}` },
                  { value: 'partner', label: `Партнёрские${ownershipStats ? ` (${ownershipStats.partner})` : ''}` },
                ]}
                icon="solar:buildings-linear"
              />
            )}
          </AdminFilterBar>
        </div>

        {/* Stations Grid */}
        {filteredStations && filteredStations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStations.map((station) => (
              <div
                key={station.id}
                onClick={() => navigate(`${base}/stations/${station.id}`)}
                className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-md dark:hover:bg-zinc-800/50 transition-all cursor-pointer"
              >
                {/* Status Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:battery-charge-linear" width={24} className="text-red-500" />
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {station.serial_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isAdminView && station.is_partner && (
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-500 rounded-full">
                        Партнёр
                      </span>
                    )}
                    <AdminStatusBadge
                      variant={mapStationStatus(station.status)}
                      label={mapStationStatusLabel(station.status)}
                    />
                  </div>
                </div>

                {/* Station Info */}
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {station.manufacturer} {station.model}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <Icon icon="solar:map-point-linear" width={16} />
                    <span>{station.location?.name || 'Без локации'}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-zinc-500 dark:text-zinc-400 mb-1">
                      <Icon icon="solar:bolt-linear" width={16} />
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {station.power_capacity} кВт
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Мощность</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-zinc-500 dark:text-zinc-400 mb-1">
                      <Icon icon="solar:pulse-2-linear" width={16} />
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {station.active_sessions || 0}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Активных</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-zinc-500 dark:text-zinc-400 mb-1">
                      <Icon icon="solar:battery-charge-linear" width={16} />
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {station.connectors_count}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Разъёмов</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm dark:shadow-none">
            <AdminEmptyState
              icon="solar:battery-charge-linear"
              title={searchQuery || statusFilter !== 'all' ? 'Станции не найдены' : 'Нет станций'}
              description={
                searchQuery || statusFilter !== 'all'
                  ? 'Попробуйте изменить поисковый запрос или фильтры'
                  : 'Добавьте первую зарядную станцию'
              }
              actionLabel={!searchQuery && statusFilter === 'all' ? 'Добавить станцию' : undefined}
              onAction={!searchQuery && statusFilter === 'all' ? () => navigate(`${base}/stations/create`) : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}
