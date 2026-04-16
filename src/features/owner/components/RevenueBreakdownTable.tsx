/**
 * RevenueBreakdownTable Component
 * Display revenue breakdown by station with visualization
 */

import { useState } from 'react';
import { Icon } from '@iconify/react';

export interface StationRevenue {
  station_id: string;
  station_name: string;
  location_name?: string;
  total_revenue: number;
  total_energy: number;
  sessions_count: number;
  avg_session_revenue: number;
}

export interface RevenueBreakdownTableProps {
  data: StationRevenue[];
  loading?: boolean;
  showChart?: boolean;
  period?: string;
  className?: string;
}

export function RevenueBreakdownTable({
  data,
  loading = false,
  showChart = true,
  period = 'месяц',
  className = '',
}: RevenueBreakdownTableProps) {
  const [sortField, setSortField] = useState<keyof StationRevenue>('total_revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof StationRevenue) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });

  const totalRevenue = data.reduce((sum, item) => sum + item.total_revenue, 0);
  const totalEnergy = data.reduce((sum, item) => sum + item.total_energy, 0);
  const totalSessions = data.reduce((sum, item) => sum + item.sessions_count, 0);

  const getRevenuePercentage = (revenue: number) => {
    if (totalRevenue === 0) return 0;
    return (revenue / totalRevenue) * 100;
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-black/20 border border-zinc-200 dark:border-zinc-800 ${className}`}>
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500 dark:text-gray-400">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-black/20 border border-zinc-200 dark:border-zinc-800 p-8 text-center ${className}`}>
        <Icon icon="solar:dollar-linear" width={48} className="text-zinc-500 dark:text-gray-400 mx-auto mb-4" />
        <p className="text-zinc-500 dark:text-gray-400 font-medium mb-2">Нет данных о доходах</p>
        <p className="text-sm text-zinc-400 dark:text-gray-500">
          Данные появятся после завершения зарядных сессий
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-black/20 border border-zinc-200 dark:border-zinc-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Доход по станциям</h3>
            <p className="text-sm text-zinc-500 dark:text-gray-400 mt-1">
              За {period} ({data.length}{' '}
              {data.length === 1
                ? 'станция'
                : data.length < 5
                  ? 'станции'
                  : 'станций'}
              )
            </p>
          </div>

          {/* Summary Stats */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm text-zinc-500 dark:text-gray-400">Всего доход</p>
              <p className="text-xl font-bold text-green-600">
                {totalRevenue.toFixed(2)} сом
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-500 dark:text-gray-400">Сессий</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">{totalSessions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('station_name')}
                  className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-gray-300 uppercase tracking-wider hover:text-zinc-900 dark:hover:text-white"
                >
                  Станция
                  <Icon icon="solar:sort-vertical-linear" width={12} />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('sessions_count')}
                  className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-gray-300 uppercase tracking-wider hover:text-zinc-900 dark:hover:text-white"
                >
                  Сессии
                  <Icon icon="solar:sort-vertical-linear" width={12} />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('total_energy')}
                  className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-gray-300 uppercase tracking-wider hover:text-zinc-900 dark:hover:text-white"
                >
                  <Icon icon="solar:bolt-linear" width={16} />
                  Энергия
                  <Icon icon="solar:sort-vertical-linear" width={12} />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('total_revenue')}
                  className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-gray-300 uppercase tracking-wider hover:text-zinc-900 dark:hover:text-white"
                >
                  <Icon icon="solar:dollar-linear" width={16} />
                  Доход
                  <Icon icon="solar:sort-vertical-linear" width={12} />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('avg_session_revenue')}
                  className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-gray-300 uppercase tracking-wider hover:text-zinc-900 dark:hover:text-white"
                >
                  <Icon icon="solar:graph-up-linear" width={16} />
                  Средний чек
                  <Icon icon="solar:sort-vertical-linear" width={12} />
                </button>
              </th>
              {showChart && (
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-gray-300 uppercase tracking-wider">
                  Распределение
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {sortedData.map((station) => {
              const percentage = getRevenuePercentage(station.total_revenue);

              return (
                <tr key={station.station_id} className="hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">
                        {station.station_name}
                      </div>
                      {station.location_name && (
                        <div className="text-xs text-zinc-400 dark:text-gray-500">{station.location_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-zinc-900 dark:text-white">{station.sessions_count}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-zinc-900 dark:text-white">
                      {station.total_energy.toFixed(2)} кВт⋅ч
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">
                      {station.total_revenue.toFixed(2)} сом
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-zinc-900 dark:text-white">
                      {station.avg_session_revenue.toFixed(2)} сом
                    </div>
                  </td>
                  {showChart && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-red-600 h-full rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-gray-400 w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>

          {/* Footer with Totals */}
          <tfoot className="bg-zinc-50 dark:bg-zinc-900/50 border-t-2 border-zinc-300 dark:border-zinc-700">
            <tr className="font-semibold">
              <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white">ИТОГО</td>
              <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white">{totalSessions}</td>
              <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white">
                {totalEnergy.toFixed(2)} кВт⋅ч
              </td>
              <td className="px-6 py-4 text-sm text-green-600 font-bold">
                {totalRevenue.toFixed(2)} сом
              </td>
              <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white">
                {totalSessions > 0 ? (totalRevenue / totalSessions).toFixed(2) : '0.00'} сом
              </td>
              {showChart && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
