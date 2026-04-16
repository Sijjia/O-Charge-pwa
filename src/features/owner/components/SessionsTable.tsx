/**
 * SessionsTable Component
 * Display charging sessions in a sortable table
 */

import { useState } from 'react';
import { Icon } from '@iconify/react';

export interface SessionData {
  id: string;
  station_name?: string;
  client_name?: string;
  start_time: string;
  end_time?: string;
  energy: number;
  amount: number;
  status: 'in_progress' | 'completed' | 'stopped' | 'error';
  payment_status?: 'pending' | 'completed' | 'failed';
}

export interface SessionsTableProps {
  sessions: SessionData[];
  loading?: boolean;
  onSessionClick?: (sessionId: string) => void;
  showPagination?: boolean;
  itemsPerPage?: number;
}

export function SessionsTable({
  sessions,
  loading = false,
  onSessionClick,
  showPagination = true,
  itemsPerPage = 10,
}: SessionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof SessionData>('start_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof SessionData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const totalPages = Math.ceil(sessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSessions = showPagination
    ? sortedSessions.slice(startIndex, startIndex + itemsPerPage)
    : sortedSessions;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/15 text-green-400 border-green-500/20';
      case 'in_progress':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      case 'stopped':
        return 'bg-zinc-800 text-gray-100 border-zinc-800';
      case 'error':
        return 'bg-red-500/15 text-red-400 border-red-500/20';
      default:
        return 'bg-zinc-800 text-gray-100 border-zinc-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Завершена';
      case 'in_progress':
        return 'Идёт зарядка';
      case 'stopped':
        return 'Остановлена';
      case 'error':
        return 'Ошибка';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-black/20 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500 dark:text-gray-400">Загрузка сессий...</p>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-black/20 border border-zinc-200 dark:border-zinc-800 p-8 text-center">
        <Icon icon="solar:calendar-linear" width={48} className="text-zinc-500 dark:text-gray-400 mx-auto mb-4" />
        <p className="text-zinc-500 dark:text-gray-400 font-medium mb-2">Нет сессий зарядки</p>
        <p className="text-sm text-zinc-400 dark:text-gray-500">
          Сессии будут отображаться здесь после начала зарядки
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-black/20 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('start_time')}
                  className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-gray-300 uppercase tracking-wider hover:text-zinc-900 dark:hover:text-white"
                >
                  <Icon icon="solar:calendar-linear" width={16} />
                  Время
                  <Icon icon="solar:sort-vertical-linear" width={12} />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('station_name')}
                  className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-gray-300 uppercase tracking-wider hover:text-zinc-900 dark:hover:text-white"
                >
                  <Icon icon="solar:map-point-linear" width={16} />
                  Станция
                  <Icon icon="solar:sort-vertical-linear" width={12} />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('energy')}
                  className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-gray-300 uppercase tracking-wider hover:text-zinc-900 dark:hover:text-white"
                >
                  <Icon icon="solar:bolt-linear" width={16} />
                  Энергия
                  <Icon icon="solar:sort-vertical-linear" width={12} />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('amount')}
                  className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-gray-300 uppercase tracking-wider hover:text-zinc-900 dark:hover:text-white"
                >
                  <Icon icon="solar:dollar-linear" width={16} />
                  Сумма
                  <Icon icon="solar:sort-vertical-linear" width={12} />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-gray-300 uppercase tracking-wider">
                Статус
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {paginatedSessions.map((session) => (
              <tr
                key={session.id}
                onClick={() => onSessionClick?.(session.id)}
                className="hover:bg-zinc-100 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-zinc-900 dark:text-white">
                    {formatDate(session.start_time)}
                  </div>
                  {session.end_time && (
                    <div className="text-xs text-zinc-400 dark:text-gray-500">
                      до {formatDate(session.end_time)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-zinc-900 dark:text-white">
                    {session.station_name || 'Станция'}
                  </div>
                  {session.client_name && (
                    <div className="text-xs text-zinc-400 dark:text-gray-500">{session.client_name}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-zinc-900 dark:text-white">{session.energy.toFixed(2)} кВт⋅ч</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-zinc-900 dark:text-white">
                    {session.amount.toFixed(2)} сом
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(session.status)}`}
                  >
                    {getStatusText(session.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="text-sm text-zinc-600 dark:text-gray-300">
            Показано {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sessions.length)} из{' '}
            {sessions.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-gray-300 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Назад
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-gray-300 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Вперёд
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
