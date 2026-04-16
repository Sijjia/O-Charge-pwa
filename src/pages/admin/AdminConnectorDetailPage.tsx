/**
 * Admin Connector Detail Page
 * Dedicated page for a single connector/port of a station
 * Route: /admin/stations/:id/connector/:connectorId
 *        /owner/stations/:id/connector/:connectorId
 */

import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Icon } from "@iconify/react";
import { usePanelBase } from "@/shared/hooks/usePanelBase";
import { useOwnerStation } from "@/features/owner/hooks/useOwnerStations";
import { formatPrice } from "@/shared/utils/formatters";
import { fetchJson } from "@/api/unifiedClient";
import { AdminStatusBadge } from "@/features/admin/components/AdminStatusBadge";
import { AdminStatCard } from "@/features/admin/components/AdminStatCard";

// --- Schemas ---

const ConnectorSessionSchema = z.object({
  id: z.string(),
  client_id: z.string().nullable().optional(),
  client_phone: z.string().nullable().optional(),
  station_id: z.string(),
  connector_id: z.number().nullable().optional(),
  status: z.string(),
  energy_kwh: z.number(),
  amount: z.number(),
  reserved_amount: z.number().nullable().optional(),
  actual_cost: z.number().nullable().optional(),
  refund_amount: z.number().nullable().optional(),
  limit_type: z.string().nullable().optional(),
  start_time: z.string().nullable().optional(),
  stop_time: z.string().nullable().optional(),
  duration_minutes: z.number().nullable().optional(),
  partner_share: z.number().nullable().optional(),
  platform_share: z.number().nullable().optional(),
  partner_name: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
}).passthrough();

const SessionsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ConnectorSessionSchema),
  total: z.number(),
}).passthrough();

// OCPP logs API returns "items" not "data"
const OcppLogSchema = z.object({
  id: z.string(),
  station_id: z.string(),
  connector_id: z.number().nullable().optional(),
  event_type: z.string(),
  direction: z.string().nullable().optional(),
  severity: z.string().nullable().optional(),
  error_message: z.string().nullable().optional(),
  processing_time_ms: z.number().nullable().optional(),
  request_payload: z.any().nullable().optional(),
  response_payload: z.any().nullable().optional(),
  created_at: z.string(),
}).passthrough();

const LogsResponseSchema = z.object({
  success: z.boolean(),
  items: z.array(OcppLogSchema),
  total: z.number(),
}).passthrough();

type ConnectorSession = z.infer<typeof ConnectorSessionSchema>;
type OcppLog = z.infer<typeof OcppLogSchema>;

// --- Helpers ---

function mapConnectorStatus(status: string): 'online' | 'charging' | 'error' | 'warning' | 'offline' {
  const s = status.toLowerCase();
  if (s === 'available') return 'online';
  if (s === 'charging' || s === 'occupied') return 'charging';
  if (s === 'faulted') return 'error';
  if (s === 'preparing' || s === 'suspendedev' || s === 'suspendedevse') return 'warning';
  return 'offline';
}

function connectorStatusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === 'available') return 'Доступен';
  if (s === 'charging' || s === 'occupied') return 'Зарядка';
  if (s === 'faulted') return 'Ошибка';
  if (s === 'preparing') return 'Подготовка';
  if (s === 'unavailable') return 'Недоступен';
  if (s === 'reserved') return 'Забронирован';
  return status;
}

function sessionStatusLabel(status: string): string {
  switch (status) {
    case 'active': case 'started': return 'Активна';
    case 'completed': case 'stopped': return 'Завершена';
    case 'failed': case 'error': return 'Ошибка';
    default: return status;
  }
}

function sessionStatusVariant(status: string): 'info' | 'success' | 'error' | 'warning' | 'neutral' {
  switch (status) {
    case 'active': case 'started': return 'info';
    case 'completed': case 'stopped': return 'success';
    case 'failed': case 'error': return 'error';
    default: return 'neutral';
  }
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '\u2014';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateString));
}

function formatDateFull(dateString: string | null | undefined): string {
  if (!dateString) return '\u2014';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date(dateString));
}

function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return '\u2014';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}ч ${m}м` : `${m}м`;
}

function logSeverityBadge(severity: string | null | undefined) {
  switch (severity) {
    case 'error': case 'critical':
      return <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500">error</span>;
    case 'warning':
      return <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-500">warn</span>;
    default:
      return <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-zinc-500/10 text-zinc-400">info</span>;
  }
}

function logEventIcon(eventType: string): string {
  if (eventType === 'Heartbeat') return 'solar:heart-pulse-linear';
  if (eventType === 'StartTransaction') return 'solar:play-circle-linear';
  if (eventType === 'StopTransaction') return 'solar:stop-circle-linear';
  if (eventType === 'MeterValues') return 'solar:chart-2-linear';
  if (eventType === 'StatusNotification') return 'solar:info-circle-linear';
  if (eventType === 'Authorize') return 'solar:shield-check-linear';
  if (eventType === 'BootNotification') return 'solar:power-linear';
  if (eventType === 'RemoteStartTransaction') return 'solar:play-bold';
  if (eventType === 'RemoteStopTransaction') return 'solar:stop-bold';
  return 'solar:document-text-linear';
}

// --- Component ---

export function AdminConnectorDetailPage() {
  const { id: stationId, connectorId: connectorIdParam } = useParams<{ id: string; connectorId: string }>();
  const connectorNumber = Number(connectorIdParam);
  const navigate = useNavigate();
  const base = usePanelBase();
  const [activeTab, setActiveTab] = useState<'sessions' | 'logs'>('sessions');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Fetch station data for connector info
  const { data: station, isLoading: loadingStation } = useOwnerStation(stationId);

  // Fetch all sessions for this connector
  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ['connector-sessions', stationId, connectorNumber],
    queryFn: () => fetchJson(
      `/api/v1/admin/sessions?station_id=${stationId}&connector_id=${connectorNumber}&limit=50`,
      { method: 'GET' },
      SessionsResponseSchema,
    ),
    enabled: !!stationId && !isNaN(connectorNumber),
    staleTime: 30_000,
  });

  // Fetch OCPP logs for this station
  const { data: logsData, isLoading: loadingLogs } = useQuery({
    queryKey: ['connector-logs', stationId, connectorNumber],
    queryFn: () => fetchJson(
      `/api/v1/admin/logs/ocpp?station_id=${stationId}&per_page=100`,
      { method: 'GET' },
      LogsResponseSchema,
    ),
    enabled: !!stationId && activeTab === 'logs',
    staleTime: 30_000,
  });

  const sessions = sessionsData?.data ?? [];
  const totalSessions = sessionsData?.total ?? 0;

  // Filter logs for this connector (or general station logs)
  const connectorLogs = useMemo(() => {
    const logs = logsData?.items ?? [];
    return logs.filter((l: OcppLog) => l.connector_id === connectorNumber || l.connector_id == null);
  }, [logsData, connectorNumber]);

  // Find the connector info from station data
  const connector = useMemo(() => {
    if (!station?.connectors) return null;
    return station.connectors.find(c => c.connector_number === connectorNumber) ?? null;
  }, [station, connectorNumber]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalRevenue = sessions.reduce((s, ses) => s + ses.amount, 0);
    const totalEnergy = sessions.reduce((s, ses) => s + ses.energy_kwh, 0);
    const totalRefunds = sessions.reduce((s, ses) => s + (ses.refund_amount ?? 0), 0);
    const avgDuration = sessions.length > 0
      ? sessions.reduce((s, ses) => s + (ses.duration_minutes ?? 0), 0) / sessions.length
      : 0;
    const avgEnergy = sessions.length > 0 ? totalEnergy / sessions.length : 0;
    const avgAmount = sessions.length > 0 ? totalRevenue / sessions.length : 0;
    const partnerRevenue = sessions.reduce((s, ses) => s + (ses.partner_share ?? 0), 0);
    return { totalSessions, totalRevenue, totalEnergy, totalRefunds, avgDuration, avgEnergy, avgAmount, partnerRevenue };
  }, [sessions, totalSessions]);

  // Loading
  if (loadingStation) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Загрузка данных разъёма...</p>
        </div>
      </div>
    );
  }

  if (!station || !connector) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center p-4">
        <div className="text-center">
          <Icon icon="solar:plug-circle-linear" width={64} className="text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Разъём не найден</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">
            Станция {stationId}, порт #{connectorNumber}
          </p>
          <button
            onClick={() => navigate(`${base}/stations/${stationId}`)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Icon icon="solar:arrow-left-linear" width={20} />
            <span>К станции</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`${base}/stations/${stationId}`)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Icon icon="solar:arrow-left-linear" width={20} className="text-zinc-500 dark:text-zinc-400" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                  Порт #{connectorNumber}
                </h1>
                <AdminStatusBadge
                  variant={mapConnectorStatus(connector.status)}
                  label={connectorStatusLabel(connector.status)}
                />
                {station.evse_id && (
                  <span className="text-sm font-mono px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">
                    {station.evse_id}*{connectorNumber}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-zinc-500 dark:text-zinc-400 flex-wrap">
                {station.location?.id && (
                  <>
                    <button
                      onClick={() => navigate(`${base}/locations/${station.location!.id}`)}
                      className="hover:text-red-500 transition-colors"
                    >
                      {station.location.name}
                    </button>
                    <Icon icon="solar:alt-arrow-right-linear" width={14} className="text-zinc-400" />
                  </>
                )}
                <button
                  onClick={() => navigate(`${base}/stations/${stationId}`)}
                  className="hover:text-red-500 transition-colors"
                >
                  {station.manufacturer} {station.model}
                </button>
                <Icon icon="solar:alt-arrow-right-linear" width={14} className="text-zinc-400" />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Порт #{connectorNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connector Info + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Connector card */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Icon icon="solar:plug-circle-bold" width={32} className="text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white text-lg">Порт #{connectorNumber}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{connector.connector_type}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Тип</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">{connector.connector_type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Мощность</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-1">
                  <Icon icon="solar:bolt-linear" width={14} className="text-yellow-500" />
                  {connector.max_power ?? '\u2014'} кВт
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Статус</span>
                <AdminStatusBadge
                  variant={mapConnectorStatus(connector.status)}
                  label={connectorStatusLabel(connector.status)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Тариф</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {station.tariff_per_kwh ? `${station.tariff_per_kwh} сом/кВт*ч` : '\u2014'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Станция</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {station.is_online ? '🟢' : '🔴'} {station.serial_number}
                </span>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <AdminStatCard
            label="Всего сессий"
            value={stats.totalSessions}
            icon="solar:history-linear"
          />
          <AdminStatCard
            label="Выручка"
            value={formatPrice(stats.totalRevenue, 'сом', 0)}
            icon="solar:dollar-linear"
            helpText={stats.partnerRevenue > 0 ? `Доля партнера: ${formatPrice(stats.partnerRevenue, 'сом', 0)}` : undefined}
          />
          <AdminStatCard
            label="Энергия"
            value={`${stats.totalEnergy.toFixed(1)} кВт*ч`}
            icon="solar:bolt-linear"
            helpText={sessions.length > 0 ? `Ср. ${stats.avgEnergy.toFixed(1)} кВт*ч/сессия` : undefined}
          />
        </div>

        {/* Secondary stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Ср. время зарядки</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">{formatDuration(stats.avgDuration)}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Ср. чек</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">{formatPrice(stats.avgAmount, 'сом', 0)}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Возвраты</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">{formatPrice(stats.totalRefunds, 'сом', 0)}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Доля партнера</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">{formatPrice(stats.partnerRevenue, 'сом', 0)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'sessions'
                  ? 'text-red-600 border-b-2 border-red-500 bg-red-500/5'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon icon="solar:history-linear" width={18} />
              Сессии зарядки ({totalSessions})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'logs'
                  ? 'text-red-600 border-b-2 border-red-500 bg-red-500/5'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon icon="solar:document-text-linear" width={18} />
              OCPP Логи ({connectorLogs.length})
            </button>
          </div>

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div>
              {loadingSessions ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-16">
                  <Icon icon="solar:clock-circle-linear" width={48} className="text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-500 dark:text-zinc-400">Нет сессий на этом разъеме</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {sessions.map((s: ConnectorSession) => (
                    <div key={s.id} className="px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <AdminStatusBadge
                            variant={sessionStatusVariant(s.status)}
                            label={sessionStatusLabel(s.status)}
                          />
                          <span className="text-sm font-mono text-zinc-500 dark:text-zinc-400">{s.id}</span>
                        </div>
                        <span className="text-lg font-bold text-zinc-900 dark:text-white">
                          {formatPrice(s.amount, 'сом', 2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-xs text-zinc-400">Начало</span>
                          <p className="text-zinc-900 dark:text-white">{formatDate(s.start_time)}</p>
                        </div>
                        <div>
                          <span className="text-xs text-zinc-400">Длительность</span>
                          <p className="text-zinc-900 dark:text-white">{formatDuration(s.duration_minutes)}</p>
                        </div>
                        <div>
                          <span className="text-xs text-zinc-400">Энергия</span>
                          <p className="text-zinc-900 dark:text-white">{s.energy_kwh.toFixed(1)} кВт*ч</p>
                        </div>
                        <div>
                          <span className="text-xs text-zinc-400">Клиент</span>
                          <p className="text-zinc-900 dark:text-white">{s.client_phone || 'Аноним'}</p>
                        </div>
                      </div>

                      {/* Financial details */}
                      {(s.reserved_amount || s.refund_amount || s.partner_share) && (
                        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {s.reserved_amount != null && (
                            <span>Резерв: {formatPrice(s.reserved_amount, '', 2)}</span>
                          )}
                          {s.refund_amount != null && s.refund_amount > 0 && (
                            <span className="text-green-500">Возврат: {formatPrice(s.refund_amount, '', 2)}</span>
                          )}
                          {s.partner_share != null && (
                            <span>Партнер: {formatPrice(s.partner_share, '', 2)}</span>
                          )}
                          {s.platform_share != null && (
                            <span>Платформа: {formatPrice(s.platform_share, '', 2)}</span>
                          )}
                          {s.limit_type && s.limit_type !== 'none' && (
                            <span>Лимит: {s.limit_type}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div>
              {loadingLogs ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : connectorLogs.length === 0 ? (
                <div className="text-center py-16">
                  <Icon icon="solar:document-text-linear" width={48} className="text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-500 dark:text-zinc-400">Нет OCPP логов для этой станции</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {connectorLogs.map((log: OcppLog) => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <div key={log.id}>
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="w-full px-6 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Icon icon={logEventIcon(log.event_type)} width={18} className="text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                              <span className="text-sm font-medium text-zinc-900 dark:text-white">{log.event_type}</span>
                              {log.direction && (
                                <Icon
                                  icon={log.direction === 'inbound' ? 'solar:arrow-down-linear' : 'solar:arrow-up-linear'}
                                  width={14}
                                  className={log.direction === 'inbound' ? 'text-blue-400' : 'text-green-400'}
                                />
                              )}
                              {log.connector_id != null && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium">
                                  #{log.connector_id}
                                </span>
                              )}
                              {logSeverityBadge(log.severity)}
                            </div>
                            <div className="flex items-center gap-3">
                              {log.processing_time_ms != null && (
                                <span className="text-xs text-zinc-400">{log.processing_time_ms}ms</span>
                              )}
                              <span className="text-xs text-zinc-400">{formatDateFull(log.created_at)}</span>
                              <Icon
                                icon={isExpanded ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"}
                                width={14}
                                className="text-zinc-400"
                              />
                            </div>
                          </div>
                          {log.error_message && (
                            <p className="text-xs text-red-400 mt-1">{log.error_message}</p>
                          )}
                        </button>

                        {/* Expanded payload */}
                        {isExpanded && (
                          <div className="px-6 pb-4 space-y-2">
                            {log.request_payload && (
                              <div>
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Request:</p>
                                <pre className="bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 font-mono overflow-x-auto max-h-48 overflow-y-auto">
                                  {JSON.stringify(log.request_payload, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.response_payload && (
                              <div>
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Response:</p>
                                <pre className="bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 font-mono overflow-x-auto max-h-48 overflow-y-auto">
                                  {JSON.stringify(log.response_payload, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
