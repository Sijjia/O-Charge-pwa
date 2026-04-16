/**
 * Owner/Admin Locations List Page
 * Display and manage all locations
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePanelBase } from '@/shared/hooks/usePanelBase';
import { Icon } from '@iconify/react';
import { useOwnerAuth } from '@/features/owner/hooks/useOwnerAuth';
import { useOwnerLocations } from '@/features/owner/hooks/useOwnerLocations';
import { RequireRole } from '@/shared/components/RequireRole';
import { StationMap } from '@/features/stations/components/StationMap';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { OwnerLocationsTreeTable } from '@/features/owner/components/OwnerLocationsTreeTable';
import type { UserRole } from '@/features/auth/types/unified.types';

export function OwnerLocationsListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminView = location.pathname.startsWith('/admin');
  const base = usePanelBase();
  const { user } = useOwnerAuth();
  const { data: locations, isLoading, error } = useOwnerLocations(isAdminView ? "admin" : user?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const filteredLocations = locations?.filter(
    (loc) => {
      const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loc.city?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      // Mock filter logic for owners/partners (since actual OwnerLocation model lacks user_id visually loaded right now)
      const matchesOwner = filterOwner === 'all' || loc.user_id === filterOwner;

      return matchesSearch && matchesOwner;
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-gray-400">Загрузка локаций...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md">
          <div className="flex items-start gap-3">
            <Icon icon="solar:danger-circle-linear" width={24} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-700 dark:text-red-400 mb-1">Ошибка загрузки</h3>
              <p className="text-sm text-red-400">
                Не удалось загрузить список локаций. Попробуйте обновить страницу.
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
          <AdminPageHeader
            title="Локации"
            subtitle={`Управление локациями (${locations?.length || 0})`}
          >
            <RequireRole allowed={['operator', 'admin', 'superadmin'] as ReadonlyArray<UserRole>}>
              <button
                onClick={() => navigate(`${base}/locations/create`)}
                className="flex items-center gap-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Icon icon="solar:add-circle-linear" width={18} />
                <span>Добавить локацию</span>
              </button>
            </RequireRole>
          </AdminPageHeader>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Controls Row: Search & View Toggle */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Icon icon="solar:magnifer-linear" width={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию, адресу, городу..."
              className="w-full pl-10 pr-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm"
            />
          </div>

          <div className="relative md:w-64">
            <Icon icon="solar:users-group-rounded-linear" width={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-gray-400" />
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm appearance-none"
            >
              <option value="all">Все владельцы</option>
              <option value="1">Компания 1 (Mock)</option>
              <option value="2">Партнер 2 (Mock)</option>
            </select>
            <Icon icon="solar:alt-arrow-down-linear" width={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          </div>

          <div className="flex items-center bg-zinc-200/50 dark:bg-zinc-800/50 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-white'}`}
            >
              <Icon icon="solar:list-linear" width={18} />
              Список
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'map' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-white'}`}
            >
              <Icon icon="solar:map-linear" width={18} />
              На карте
            </button>
          </div>
        </div>

        {/* Dynamic View */}
        {viewMode === 'map' ? (
          <div className="h-[600px] w-full bg-zinc-200 dark:bg-zinc-800 rounded-3xl overflow-hidden shadow-inner border border-zinc-200 dark:border-zinc-800 relative flex-shrink-0">
            <StationMap
              locations={(filteredLocations || []).map(loc => ({
                ...loc,
                coordinates: { latitude: loc.latitude ?? null, longitude: loc.longitude ?? null },
                stations_summary: { total: loc.stations_count || 0, available: 0, occupied: 0, offline: 0, maintenance: 0 },
                connectors_summary: { total: loc.connectors_count || 0, available: 0, occupied: 0, faulted: 0 },
                stations: []
              })) as any}
              autoCenterOnUser={true}
            />
            <div className="absolute top-4 left-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 z-10">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Показано локаций: <span className="font-mono text-red-500">{filteredLocations?.length || 0}</span>
              </p>
            </div>
          </div>
        ) : (
          <OwnerLocationsTreeTable locations={filteredLocations || []} />
        )}
      </div>
    </div>
  );
}

