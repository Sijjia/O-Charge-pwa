/**
 * Session Details Modal
 * Displays detailed information about a charging session
 */

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '@/shared/utils/formatters';
import { fetchJson } from '@/api/unifiedClient';
import type { ChargingSession } from '@/pages/owner/OwnerSessionsPage';

interface SessionDetailsModalProps {
  session: ChargingSession | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SessionDetailsModal({ session, isOpen, onClose }: SessionDetailsModalProps) {
  const [showForceStopConfirm, setShowForceStopConfirm] = useState(false);
  const queryClient = useQueryClient();

  const forceStopMutation = useMutation({
    mutationFn: (sessionId: string) =>
      fetchJson(`/api/v1/admin/sessions/${sessionId}/force-stop`, { method: 'POST' }, {} as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      setShowForceStopConfirm(false);
      onClose();
    },
  });

  if (!isOpen || !session) return null;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const calculateDuration = () => {
    if (session.duration_minutes != null) {
      const hours = Math.floor(session.duration_minutes / 60);
      const mins = session.duration_minutes % 60;
      if (hours > 0) return `${hours}ч ${mins}м`;
      return `${mins}м`;
    }
    if (!session.start_time) return '—';
    const start = new Date(session.start_time);
    const end = session.stop_time ? new Date(session.stop_time) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м${!session.stop_time ? ' (продолжается)' : ''}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-500/15 text-blue-400';
      case 'completed':
        return 'bg-green-500/15 text-green-400';
      case 'stopped':
        return 'bg-yellow-500/15 text-yellow-400';
      case 'failed':
        return 'bg-red-500/15 text-red-400';
      default:
        return 'bg-zinc-800 text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активна';
      case 'completed':
        return 'Завершена';
      case 'stopped':
        return 'Остановлена';
      case 'failed':
        return 'Ошибка';
      default:
        return status;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Детали сессии</h2>
              <p className="text-sm text-zinc-500 dark:text-gray-400 mt-1">ID: {session.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Закрыть"
            >
              <Icon icon="solar:close-circle-linear" width={24} className="text-zinc-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                {getStatusText(session.status)}
              </span>
            </div>

            {/* Main Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Station Info */}
              <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="solar:map-point-linear" width={20} className="text-zinc-500 dark:text-gray-400" />
                  <h3 className="font-semibold text-zinc-900 dark:text-white">Станция</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-gray-400">ID станции</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{session.station_id}</p>
                  </div>
                  {session.station_model && (
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-gray-400">Модель</p>
                      <p className="font-medium text-zinc-900 dark:text-white">{session.station_model}</p>
                    </div>
                  )}
                  {'connector_id' in session && session.connector_id != null && (
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-gray-400">Разъем</p>
                      <p className="font-medium text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <Icon icon="solar:plug-circle-linear" width={16} className="text-blue-400" />
                        Порт #{session.connector_id}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-gray-400">Локация</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{session.location_name || '—'}</p>
                  </div>
                  {'partner_name' in session && session.partner_name && (
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-gray-400">Владелец</p>
                      <p className="font-medium text-zinc-900 dark:text-white">{session.partner_name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Info */}
              <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="solar:user-linear" width={20} className="text-zinc-500 dark:text-gray-400" />
                  <h3 className="font-semibold text-zinc-900 dark:text-white">Клиент</h3>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-gray-400">Телефон</p>
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {session.client_phone || 'Не указан'}
                  </p>
                </div>
              </div>
            </div>

            {/* Time Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="solar:clock-circle-linear" width={20} className="text-blue-400" />
                <h3 className="font-semibold text-blue-300">Временные данные</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-400">Начало</p>
                  <p className="font-medium text-blue-200">{formatDate(session.start_time)}</p>
                </div>
                {session.stop_time && (
                  <div>
                    <p className="text-sm text-blue-400">Окончание</p>
                    <p className="font-medium text-blue-200">{formatDate(session.stop_time)}</p>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <p className="text-sm text-blue-400">Продолжительность</p>
                  <p className="font-medium text-blue-200">{calculateDuration()}</p>
                </div>
              </div>
            </div>

            {/* Energy & Cost */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Energy */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="solar:bolt-linear" width={20} className="text-yellow-500" />
                  <h3 className="font-semibold text-yellow-300">Энергия</h3>
                </div>
                <p className="text-3xl font-bold text-yellow-200">
                  {session.energy_kwh.toFixed(2)} <span className="text-xl">кВт⋅ч</span>
                </p>
              </div>

              {/* Cost */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="solar:dollar-linear" width={20} className="text-green-500" />
                  <h3 className="font-semibold text-green-300">Стоимость</h3>
                </div>
                <p className="text-3xl font-bold text-green-200">
                  {formatPrice(session.amount, 'сом', 2)}
                </p>
                {session.energy_kwh > 0 && (
                  <p className="text-sm text-green-400 mt-1">
                    Тариф: {(session.amount / session.energy_kwh).toFixed(2)} сом/кВт⋅ч
                  </p>
                )}
              </div>
            </div>

            {/* Partner/Platform Share */}
            {(session.partner_share != null || session.platform_share != null) && (
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                  <Icon icon="solar:chart-linear" width={20} className="text-zinc-500 dark:text-gray-400" />
                  Распределение
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {session.partner_share != null && (
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-3">
                      <p className="text-sm text-zinc-500 dark:text-gray-400">Доля партнера</p>
                      <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {formatPrice(session.partner_share, 'сом', 2)}
                      </p>
                    </div>
                  )}
                  {session.platform_share != null && (
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-3">
                      <p className="text-sm text-zinc-500 dark:text-gray-400">Доля платформы</p>
                      <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {formatPrice(session.platform_share, 'сом', 2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Session Timeline */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon icon="solar:calendar-linear" width={20} className="text-zinc-500 dark:text-gray-400" />
                <h3 className="font-semibold text-zinc-900 dark:text-white">История сессии</h3>
              </div>
              <div className="space-y-3">
                {session.start_time && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-green-500/100 rounded-full mt-1.5" />
                    <div className="flex-1">
                      <p className="font-medium text-zinc-900 dark:text-white">Зарядка начата</p>
                      <p className="text-sm text-zinc-500 dark:text-gray-400">{formatDate(session.start_time)}</p>
                    </div>
                  </div>
                )}

                {session.stop_time && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-blue-500/100 rounded-full mt-1.5" />
                    <div className="flex-1">
                      <p className="font-medium text-zinc-900 dark:text-white">
                        {session.status === 'completed' ? 'Зарядка завершена' :
                         session.status === 'stopped' ? 'Зарядка остановлена' :
                         'Зарядка прервана'}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-gray-400">{formatDate(session.stop_time)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Force Stop Confirmation */}
          {showForceStopConfirm && (
            <div className="mx-6 mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300 mb-3">
                Принудительно остановить зарядку? Команда RemoteStopTransaction будет отправлена на станцию.
              </p>
              {forceStopMutation.error && (
                <p className="text-sm text-red-400 mb-3">
                  {forceStopMutation.error instanceof Error ? forceStopMutation.error.message : 'Ошибка остановки'}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => forceStopMutation.mutate(session.id)}
                  disabled={forceStopMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium text-sm"
                >
                  {forceStopMutation.isPending ? 'Останавливаю...' : 'Да, остановить'}
                </button>
                <button
                  onClick={() => setShowForceStopConfirm(false)}
                  className="px-4 py-2 border border-zinc-600 text-zinc-300 rounded-lg hover:bg-zinc-800 font-medium text-sm"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="sticky bottom-0 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between gap-3 rounded-b-2xl">
            {session.status === 'active' && !showForceStopConfirm ? (
              <button
                onClick={() => setShowForceStopConfirm(true)}
                className="px-4 py-2 bg-red-600/15 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-600/25 transition-colors font-medium flex items-center gap-2"
              >
                <Icon icon="solar:stop-circle-linear" width={18} />
                Принудительная остановка
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-gray-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-colors font-medium"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
