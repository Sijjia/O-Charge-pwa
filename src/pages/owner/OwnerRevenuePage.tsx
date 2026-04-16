/**
 * Owner Revenue Page
 * Revenue analytics and breakdown by stations
 */

import { useState, useMemo, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useOwnerAuth } from '@/features/owner/hooks/useOwnerAuth';
import { useOwnerStats } from '@/features/owner/hooks/useOwnerStats';
import { useOwnerStations } from '@/features/owner/hooks/useOwnerStations';
import { formatPrice } from '@/shared/utils/formatters';
import { ExportService } from '@/features/history/services/exportService';
import { logger } from '@/shared/utils/logger';
import { useToast } from '@/shared/hooks/useToast';
import { AdminStatCard } from '@/features/admin/components/AdminStatCard';

type Period = 'today' | 'week' | 'month' | 'all' | 'custom';

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Сегодня',
  week: 'Неделя',
  month: 'Месяц',
  all: 'Все',
  custom: 'Период',
};

export function OwnerRevenuePage() {
  const navigate = useNavigate();
  const { user } = useOwnerAuth();
  const { data: stats, isLoading } = useOwnerStats(user?.id);
  const { data: stations } = useOwnerStations(user?.id);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [selectedStationId, setSelectedStationId] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const toast = useToast();

  // Calculate revenue based on selected period
  const getRevenueByPeriod = useCallback((): number => {
    if (!stats) return 0;

    switch (selectedPeriod) {
      case 'today':
        return stats.todayRevenue || 0;
      case 'week':
        return stats.weeklyRevenue || 0;
      case 'month':
        return stats.monthlyRevenue || 0;
      case 'all':
        return stats.totalRevenue || 0;
      case 'custom':
        return stats.monthlyRevenue || 0;
      default:
        return stats.monthlyRevenue || 0;
    }
  }, [stats, selectedPeriod]);

  // Filter stations by selected station ID
  const filteredStations = useMemo(() => {
    if (!stations) return [];
    if (selectedStationId === 'all') return stations;
    return stations.filter((s) => s.id === selectedStationId);
  }, [stations, selectedStationId]);

  // Calculate filtered revenue
  const filteredRevenue = useMemo(() => {
    if (selectedStationId === 'all') {
      return getRevenueByPeriod();
    }
    // Sum revenue from filtered stations
    return filteredStations.reduce((sum, station) => sum + (station.total_revenue || 0), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredStations, selectedStationId, getRevenueByPeriod]);

  const currentRevenue = filteredRevenue;

  // Check if filters are active
  const hasActiveFilters = selectedStationId !== 'all' || selectedPeriod === 'custom';

  // Reset filters
  const resetFilters = () => {
    setSelectedPeriod('month');
    setSelectedStationId('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  // Export to CSV handler
  const handleExportCSV = async () => {
    if (!filteredStations || filteredStations.length === 0) {
      toast.warning('Нет данных для экспорта');
      return;
    }

    try {
      const periodLabel = selectedPeriod === 'today' ? 'сегодня' :
                         selectedPeriod === 'week' ? 'неделя' :
                         selectedPeriod === 'month' ? 'месяц' :
                         selectedPeriod === 'all' ? 'все_время' :
                         selectedPeriod === 'custom' && customStartDate && customEndDate
                           ? `${customStartDate}_${customEndDate}`
                           : 'период';

      const filename = `доходы_${periodLabel}_${new Date().toISOString().split('T')[0]}.csv`;

      await ExportService.exportRevenueToCSV(filteredStations, {
        filename,
        period: selectedPeriod,
      });
    } catch (error) {
      logger.error('Export error:', error);
      toast.error('Ошибка при экспорте данных');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Загрузка аналитики...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] relative">
      {/* Ambient Background */}
      <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] bg-red-600/10 blur-[100px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-red-800/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Header */}
      <div className="px-5 pt-6 pb-2 flex items-center justify-between z-20 relative shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 transition-colors"
        >
          <Icon icon="solar:arrow-left-linear" width={24} />
        </button>
        <span className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight">Мой доход</span>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors relative"
        >
          <Icon icon="solar:filter-linear" width={24} />
          {hasActiveFilters && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-zinc-50 dark:border-[#050507]" />
          )}
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="relative z-10 overflow-y-auto p-5 pb-10 w-full max-w-md mx-auto">
        {/* Period Selector */}
        <div className="flex justify-center gap-1 mb-6">
          {(['today', 'week', 'month', 'all'] as Period[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {PERIOD_LABELS[period]}
            </button>
          ))}
        </div>

        {/* Total Revenue Card */}
        <div className="flex flex-col items-center mb-8">
          <span className="text-sm text-zinc-500 font-medium mb-1">Ваш доход</span>
          <div className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
            {formatPrice(currentRevenue, '', 0)} <span className="text-zinc-500 dark:text-zinc-400 text-2xl font-medium">сом</span>
          </div>

          {/* Revenue Info Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg backdrop-blur-sm">
            <Icon icon="solar:info-circle-linear" className="text-zinc-500" width={16} />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Станций: <span className="text-zinc-900 dark:text-white font-medium">{stats?.totalStations || 0}</span>
              {' '} | Активных: <span className="text-zinc-900 dark:text-white font-medium">{stats?.activeStations || 0}</span>
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <AdminStatCard
            label="Активных сессий"
            value={stats?.activeSessions || 0}
            icon="solar:bolt-circle-bold-duotone"
          />
          <AdminStatCard
            label="кВт*ч за месяц"
            value={(stats?.monthlyEnergy || 0).toFixed(1)}
            icon="solar:flash-bold-duotone"
          />
          <AdminStatCard
            label="Средний чек, сом"
            value={stats && stats.activeSessions > 0
              ? Math.round(stats.monthlyRevenue / stats.activeSessions)
              : 0}
            icon="solar:chart-2-bold-duotone"
          />

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={!filteredStations || filteredStations.length === 0}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-left hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Icon icon="solar:download-minimalistic-bold-duotone" className="text-red-400" width={18} />
              </div>
            </div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Экспорт</p>
            <p className="text-xs text-zinc-500 mt-0.5">Скачать CSV</p>
          </button>
        </div>

        {/* Filters Panel (Expandable) */}
        {showFilters && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Фильтры</h3>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 transition-colors"
                >
                  <Icon icon="solar:close-circle-linear" width={14} />
                  Сбросить
                </button>
              )}
            </div>

            {/* Custom Date Range */}
            {selectedPeriod === 'custom' && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Начало</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Конец</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            )}

            {/* Custom Period Toggle */}
            <button
              onClick={() => setSelectedPeriod(selectedPeriod === 'custom' ? 'month' : 'custom')}
              className={`w-full mb-4 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedPeriod === 'custom'
                  ? 'bg-red-600/15 text-red-500 dark:text-red-400 border border-red-500/20'
                  : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <Icon icon="solar:calendar-date-linear" className="inline mr-1.5" width={16} />
              Произвольный период
            </button>

            {/* Station Filter */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Станция</label>
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none appearance-none"
              >
                <option value="all">Все станции</option>
                {stations?.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.serial_number} - {station.location?.name || 'Без локации'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Breakdown List */}
        <div>
          <h2 className="px-2 mb-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Детализация по станциям
            {selectedStationId !== 'all' && (
              <span className="ml-2 text-zinc-400">
                ({filteredStations.length} из {stations?.length || 0})
              </span>
            )}
          </h2>

          {filteredStations && filteredStations.length > 0 ? (
            <div className="flex flex-col gap-3">
              {filteredStations.map((station) => {
                const stationRevenue = station.total_revenue || 0;
                const revenuePercent = currentRevenue > 0
                  ? (stationRevenue / currentRevenue) * 100
                  : 0;

                return (
                  <div key={station.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm dark:shadow-none">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                          <Icon icon="solar:ev-station-linear" width={22} />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{station.serial_number}</h4>
                          <span className="text-xs text-zinc-500">{station.location?.name || 'Без локации'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                          {formatPrice(stationRevenue, 'с', 0)}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-medium">{revenuePercent.toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(revenuePercent, 100)}%` }}
                      />
                    </div>

                    {/* Station Stats */}
                    <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="text-center">
                        <p className="text-[10px] text-zinc-500 uppercase">Энергия</p>
                        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mt-0.5">
                          {(station.total_energy || 0).toFixed(1)} кВт*ч
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-zinc-500 uppercase">Сессий</p>
                        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mt-0.5">
                          {station.active_sessions || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-zinc-500 uppercase">Мощность</p>
                        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mt-0.5">
                          {station.power_capacity} кВт
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto mb-4">
                <Icon icon="solar:wallet-money-linear" className="text-zinc-400 dark:text-zinc-500" width={32} />
              </div>
              <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Нет данных о доходах</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Доходы будут отображаться после начала зарядок
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
