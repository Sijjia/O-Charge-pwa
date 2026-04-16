/**
 * Owner Station Details Page
 * Display detailed information about a single station
 * Connectors link to dedicated connector detail page
 * Features: EVSE ID display, connector CRUD modals, station transfer
 */

import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { usePanelBase } from "@/shared/hooks/usePanelBase";
import { Icon } from "@iconify/react";
import { useOwnerStation, useUpdateStation } from "@/features/owner/hooks/useOwnerStations";
import { formatPrice } from "@/shared/utils/formatters";
import { fetchJson } from "@/api/unifiedClient";
import { AdminStatusBadge } from "@/features/admin/components/AdminStatusBadge";
import { AdminStatCard } from "@/features/admin/components/AdminStatCard";
import { adminConnectorsService } from "@/features/admin/services/adminConnectorsService";
import { adminLocationsService } from "@/features/admin/services/adminLocationsService";
import { adminStationsService } from "@/features/admin/services/adminStationsService";
// --- Schemas ---

const SessionItemSchema = z.object({
  id: z.string(),
  connector_id: z.number().nullable().optional(),
  client_phone: z.string().nullable().optional(),
  status: z.string(),
  energy_kwh: z.number(),
  amount: z.number(),
  start_time: z.string().nullable().optional(),
  duration_minutes: z.number().nullable().optional(),
}).passthrough();

const SessionsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(SessionItemSchema),
  total: z.number(),
}).passthrough();

// --- Constants ---

const CONNECTOR_TYPES = ["Type2", "CCS2", "CHAdeMO", "GBT"] as const;

// --- Helpers ---

function mapStationStatus(status: string): 'online' | 'offline' | 'warning' {
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

function sessionStatusVariant(status: string): 'info' | 'success' | 'error' | 'neutral' {
  switch (status) {
    case 'active': case 'started': return 'info';
    case 'completed': case 'stopped': return 'success';
    case 'failed': case 'error': return 'error';
    default: return 'neutral';
  }
}

function sessionStatusLabel(status: string): string {
  switch (status) {
    case 'active': case 'started': return 'Активна';
    case 'completed': case 'stopped': return 'Завершена';
    case 'failed': case 'error': return 'Ошибка';
    default: return status;
  }
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '\u2014';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateString));
}

function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return '\u2014';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}ч ${m}м` : `${m}м`;
}

// --- Main Page ---

export function OwnerStationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const base = usePanelBase();
  const queryClient = useQueryClient();
  const { data: station, isLoading, error } = useOwnerStation(id);
  const updateStation = useUpdateStation(id || "");
  const [customUrl, setCustomUrl] = useState("");
  const [urlEditing, setUrlEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Modal states
  const [showAddConnector, setShowAddConnector] = useState(false);
  const [editingConnector, setEditingConnector] = useState<{ number: number; type: string; power: number | null } | null>(null);
  const [deletingConnector, setDeletingConnector] = useState<number | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);

  // Add connector form
  const [newConnType, setNewConnType] = useState<string>("Type2");
  const [newConnPower, setNewConnPower] = useState<string>("");

  // Edit connector form
  const [editConnType, setEditConnType] = useState<string>("Type2");
  const [editConnPower, setEditConnPower] = useState<string>("");

  // Transfer form
  const [transferLocationId, setTransferLocationId] = useState<string>("");
  const [locationSearch, setLocationSearch] = useState("");

  // Tariff quick change
  const [showTariffModal, setShowTariffModal] = useState(false);
  const [newTariff, setNewTariff] = useState("");
  // Fetch recent sessions for this station
  const { data: stationSessionsData } = useQuery({
    queryKey: ['station-sessions', id],
    queryFn: () => fetchJson(
      `/api/v1/admin/sessions?station_id=${id}&limit=10`,
      { method: 'GET' },
      SessionsResponseSchema,
    ),
    enabled: !!id,
    staleTime: 30_000,
  });

  // Fetch locations for transfer modal
  const { data: locationsData } = useQuery({
    queryKey: ['admin', 'locations', 'transfer', locationSearch],
    queryFn: () => adminLocationsService.listLocations({ limit: 50, search: locationSearch || undefined }),
    enabled: showTransfer,
    staleTime: 60_000,
  });

  const recentSessions = stationSessionsData?.data ?? [];
  const totalStationSessions = stationSessionsData?.total ?? 0;

  const stationStats = useMemo(() => {
    const revenue = recentSessions.reduce((s, ses) => s + ses.amount, 0);
    const energy = recentSessions.reduce((s, ses) => s + ses.energy_kwh, 0);
    return { total: totalStationSessions, revenue, energy };
  }, [recentSessions, totalStationSessions]);

  // --- Connector mutations ---

  const addConnectorMutation = useMutation({
    mutationFn: () => adminConnectorsService.addConnector(id!, {
      connector_type: newConnType,
      power_kw: newConnPower ? Number(newConnPower) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-station', id] });
      setShowAddConnector(false);
      setNewConnType("Type2");
      setNewConnPower("");
    },
  });

  const editConnectorMutation = useMutation({
    mutationFn: () => adminConnectorsService.updateConnector(id!, editingConnector!.number, {
      connector_type: editConnType,
      power_kw: editConnPower ? Number(editConnPower) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-station', id] });
      setEditingConnector(null);
    },
  });

  const deleteConnectorMutation = useMutation({
    mutationFn: () => adminConnectorsService.deleteConnector(id!, deletingConnector!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-station', id] });
      setDeletingConnector(null);
    },
  });

  const transferMutation = useMutation({
    mutationFn: () => adminStationsService.updateStation(id!, { location_id: transferLocationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-station', id] });
      queryClient.invalidateQueries({ queryKey: ['owner-stations'] });
      setShowTransfer(false);
      // Navigate to the new location
      navigate(`${base}/locations/${transferLocationId}`);
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Загрузка данных станции...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md">
          <div className="flex items-start gap-3">
            <Icon icon="solar:danger-circle-linear" width={24} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-700 dark:text-red-400 mb-1">Ошибка загрузки</h3>
              <p className="text-sm text-red-600 dark:text-red-400/80">Не удалось загрузить данные станции.</p>
              <button onClick={() => navigate(`${base}/stations`)} className="mt-4 text-sm text-red-500 hover:text-red-400 underline">
                Вернуться к списку станций
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center p-4">
        <div className="text-center">
          <Icon icon="solar:battery-charge-linear" width={64} className="text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Станция не найдена</h3>
          <button onClick={() => navigate(`${base}/stations`)} className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
            <Icon icon="solar:arrow-left-linear" width={20} />
            <span>Вернуться к списку</span>
          </button>
        </div>
      </div>
    );
  }

  const connectors = station.connectors ?? Array.from({ length: station.connectors_count }, (_, i) => ({
    connector_number: i + 1,
    connector_type: 'Type2',
    max_power: station.power_capacity,
    status: 'Available',
  }));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(`${base}/stations`)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <Icon icon="solar:arrow-left-linear" width={20} className="text-zinc-500 dark:text-zinc-400" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">{station.serial_number}</h1>
                  <AdminStatusBadge variant={station.is_online ? 'online' : 'offline'} label={station.is_online ? 'Онлайн' : 'Офлайн'} />
                  {station.evse_id && (
                    <span className="text-sm font-mono px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">
                      {station.evse_id}
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
                  <span>{station.manufacturer} {station.model}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTransfer(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors shadow-sm"
                title="Перенести на другую локацию"
              >
                <Icon icon="solar:transfer-horizontal-bold" width={16} />
                <span className="hidden sm:inline">Перенести</span>
              </button>
              <button onClick={() => navigate(`${base}/stations/${id}/edit`)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                <Icon icon="solar:pen-linear" width={16} />
                <span>Редактировать</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Equipment Image Card */}
            {station.equipment_image_url && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="relative h-48 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <img
                    src={station.equipment_image_url}
                    alt={station.equipment_model_name || station.model}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">
                    {station.equipment_model_name || station.model}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {station.equipment_manufacturer_name || station.manufacturer}
                  </p>
                </div>
              </div>
            )}

            {/* Status Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Статус станции</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Состояние</span>
                  <AdminStatusBadge variant={mapStationStatus(station.status)} label={mapStationStatusLabel(station.status)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Тариф</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {station.tariff_per_kwh ? `${station.tariff_per_kwh} сом/кВт*ч` : '\u2014'}
                  </span>
                </div>
                {station.last_heartbeat && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Heartbeat</span>
                    <span className="text-xs text-zinc-400">{formatDate(station.last_heartbeat)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tariff Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <Icon icon="solar:tag-price-bold-duotone" width={20} className="text-violet-500" />
                Тарификация
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Текущий тариф</span>
                  <span className="text-lg font-bold text-zinc-900 dark:text-white">
                    {station.tariff_per_kwh ? `${station.tariff_per_kwh} сом/кВтч` : '\u2014'}
                  </span>
                </div>
                {station.tariff_per_kwh && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Ночной (-20%)</span>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {(station.tariff_per_kwh * 0.8).toFixed(1)} сом/кВтч
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => navigate(`${base}/tariffs`)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-lg text-xs font-medium transition-colors"
                >
                  <Icon icon="solar:magic-stick-3-linear" width={14} />
                  AI анализ
                </button>
                <button
                  onClick={() => { setNewTariff(station.tariff_per_kwh ? String(station.tariff_per_kwh) : ""); setShowTariffModal(true); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium transition-colors"
                >
                  <Icon icon="solar:pen-linear" width={14} />
                  Изменить
                </button>
              </div>
            </div>

            {/* Location Card */}
            <div
              onClick={() => station.location?.id && navigate(`${base}/locations/${station.location.id}`)}
              className={`bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 p-6 ${station.location?.id ? 'cursor-pointer hover:border-red-300 dark:hover:border-red-800 transition-colors group' : ''}`}
            >
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <Icon icon="solar:map-point-linear" width={20} className="text-red-500" />
                Расположение
                {station.location?.id && (
                  <Icon icon="solar:arrow-right-up-linear" width={16} className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                )}
              </h3>
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-red-500 transition-colors">{station.location?.name}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{station.location?.address}</p>
              </div>
            </div>

            {/* Technical Specs */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Характеристики</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Мощность</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-1">
                    <Icon icon="solar:bolt-linear" width={16} className="text-yellow-500" />
                    {station.power_capacity} кВт
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Разъёмов</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">{station.connectors_count}</span>
                </div>
              </div>
            </div>

            {/* OCPP Connection */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <Icon icon="solar:plug-circle-linear" width={20} className="text-green-500" />
                OCPP
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1.5">WebSocket URL</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 font-mono break-all border border-zinc-200 dark:border-zinc-700">
                      {station.ocpp_ws_url || `wss://ocpp.charge.redpay.kg/ws/${station.id}`}
                    </div>
                    <button
                      onClick={() => {
                        const url = station.ocpp_ws_url || `wss://ocpp.charge.redpay.kg/ws/${station.id}`;
                        navigator.clipboard.writeText(url);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex-shrink-0 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
                    >
                      <Icon icon={copied ? "solar:check-circle-linear" : "solar:copy-linear"} width={18} className={copied ? "text-green-500" : "text-zinc-500 dark:text-zinc-400"} />
                    </button>
                  </div>
                </div>
                {!urlEditing ? (
                  <button onClick={() => { setCustomUrl(station.ocpp_ws_url || ""); setUrlEditing(true); }} className="text-xs text-red-500 hover:text-red-400 transition-colors">
                    Изменить URL
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input type="text" value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} placeholder="wss://your-server.com/ws/station-id" className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 font-mono border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500" />
                    <div className="flex gap-2">
                      <button onClick={() => { updateStation.mutate({ ocpp_ws_url: customUrl || undefined } as any, { onSuccess: () => setUrlEditing(false) }); }} disabled={updateStation.isPending} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs rounded-lg transition-colors">
                        {updateStation.isPending ? "..." : "Сохранить"}
                      </button>
                      <button onClick={() => setUrlEditing(false)} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs rounded-lg transition-colors">
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AdminStatCard label="Всего сессий" value={stationStats.total} icon="solar:chart-2-linear" />
              <AdminStatCard label="Выручка" value={formatPrice(stationStats.revenue, "сом", 0)} icon="solar:dollar-linear" />
              <AdminStatCard label="Энергия" value={`${stationStats.energy.toFixed(1)} кВт*ч`} icon="solar:bolt-linear" />
            </div>

            {/* Connectors Grid */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Icon icon="solar:plug-circle-linear" width={20} className="text-blue-500" />
                  Разъёмы (порты)
                </h3>
                <button
                  onClick={() => setShowAddConnector(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <Icon icon="solar:add-circle-linear" width={16} />
                  Добавить порт
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connectors.map((conn) => (
                  <div
                    key={conn.connector_number}
                    className="flex items-center justify-between p-4 rounded-lg border bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                  >
                    <button
                      onClick={() => navigate(`${base}/stations/${id}/connector/${conn.connector_number}`)}
                      className="flex items-center gap-3 text-left flex-1 min-w-0"
                    >
                      <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                        <Icon icon="solar:plug-circle-bold" width={22} className="text-zinc-500 dark:text-zinc-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                          Порт #{conn.connector_number}
                          {station.evse_id && (
                            <span className="ml-1.5 text-xs font-mono text-zinc-400">
                              {station.evse_id}*{conn.connector_number}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{conn.connector_type} {conn.max_power ? `\u2022 ${conn.max_power} кВт` : ''}</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1.5 ml-2">
                      <AdminStatusBadge variant={mapConnectorStatus(conn.status)} label={connectorStatusLabel(conn.status)} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingConnector({ number: conn.connector_number, type: conn.connector_type, power: conn.max_power });
                          setEditConnType(conn.connector_type);
                          setEditConnPower(conn.max_power ? String(conn.max_power) : "");
                        }}
                        className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Редактировать"
                      >
                        <Icon icon="solar:pen-linear" width={14} className="text-zinc-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingConnector(conn.connector_number);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Удалить"
                      >
                        <Icon icon="solar:trash-bin-trash-linear" width={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <Icon icon="solar:history-linear" width={20} className="text-zinc-500 dark:text-zinc-400" />
                Последние сессии
                {totalStationSessions > 0 && (
                  <span className="text-xs text-zinc-400 font-normal">({totalStationSessions} всего)</span>
                )}
              </h3>
              {recentSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Icon icon="solar:clock-circle-linear" width={48} className="text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Нет данных о сессиях</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 -mx-6">
                  {recentSessions.map((s) => (
                    <div key={s.id} className="px-6 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <AdminStatusBadge variant={sessionStatusVariant(s.status)} label={sessionStatusLabel(s.status)} />
                          {s.connector_id != null && (
                            <button
                              onClick={() => navigate(`${base}/stations/${id}/connector/${s.connector_id}`)}
                              className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-500/20 transition-colors"
                            >
                              Порт #{s.connector_id}
                            </button>
                          )}
                          <span className="text-xs text-zinc-400">{s.id}</span>
                        </div>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{formatPrice(s.amount, 'сом', 0)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <div className="flex items-center gap-3">
                          <span>{formatDate(s.start_time)}</span>
                          <span>{s.energy_kwh.toFixed(1)} кВт*ч</span>
                          <span>{formatDuration(s.duration_minutes)}</span>
                        </div>
                        <span>{s.client_phone || 'Аноним'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Add Connector Modal --- */}
      {showAddConnector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddConnector(false)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Добавить порт</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Тип разъёма</label>
                <select
                  value={newConnType}
                  onChange={(e) => setNewConnType(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                >
                  {CONNECTOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Мощность (кВт)</label>
                <input
                  type="number"
                  value={newConnPower}
                  onChange={(e) => setNewConnPower(e.target.value)}
                  placeholder="22"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddConnector(false)} className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors">
                Отмена
              </button>
              <button
                onClick={() => addConnectorMutation.mutate()}
                disabled={addConnectorMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {addConnectorMutation.isPending ? "Добавление..." : "Добавить"}
              </button>
            </div>
            {addConnectorMutation.error && (
              <p className="mt-3 text-xs text-red-500">{(addConnectorMutation.error as any)?.message || "Ошибка добавления"}</p>
            )}
          </div>
        </div>
      )}

      {/* --- Edit Connector Modal --- */}
      {editingConnector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingConnector(null)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Редактировать порт #{editingConnector.number}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Тип разъёма</label>
                <select
                  value={editConnType}
                  onChange={(e) => setEditConnType(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                >
                  {CONNECTOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Мощность (кВт)</label>
                <input
                  type="number"
                  value={editConnPower}
                  onChange={(e) => setEditConnPower(e.target.value)}
                  placeholder="22"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingConnector(null)} className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors">
                Отмена
              </button>
              <button
                onClick={() => editConnectorMutation.mutate()}
                disabled={editConnectorMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {editConnectorMutation.isPending ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
            {editConnectorMutation.error && (
              <p className="mt-3 text-xs text-red-500">{(editConnectorMutation.error as any)?.message || "Ошибка обновления"}</p>
            )}
          </div>
        </div>
      )}

      {/* --- Delete Connector Confirm Modal --- */}
      {deletingConnector !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingConnector(null)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Icon icon="solar:trash-bin-trash-bold" width={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Удалить порт #{deletingConnector}?</h3>
                <p className="text-sm text-zinc-400">Это действие нельзя отменить</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeletingConnector(null)} className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors">
                Отмена
              </button>
              <button
                onClick={() => deleteConnectorMutation.mutate()}
                disabled={deleteConnectorMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {deleteConnectorMutation.isPending ? "Удаление..." : "Удалить"}
              </button>
            </div>
            {deleteConnectorMutation.error && (
              <p className="mt-3 text-xs text-red-500">{(deleteConnectorMutation.error as any)?.message || "Ошибка удаления"}</p>
            )}
          </div>
        </div>
      )}

      {/* --- Tariff Quick Change Modal --- */}
      {showTariffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTariffModal(false)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Изменить тариф</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Цена за кВтч (сом)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newTariff}
                  onChange={(e) => setNewTariff(e.target.value)}
                  placeholder="13.0"
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-lg font-bold text-zinc-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                />
              </div>
              {newTariff && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-500 space-y-1">
                  <div className="flex justify-between"><span>Ночной (-20%)</span><span className="font-medium text-zinc-700 dark:text-zinc-300">{(Number(newTariff) * 0.8).toFixed(1)} сом</span></div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowTariffModal(false)} className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors">
                Отмена
              </button>
              <button
                onClick={() => {
                  if (!newTariff) return;
                  updateStation.mutate(
                    { tariff_per_kwh: Number(newTariff) } as any,
                    { onSuccess: () => setShowTariffModal(false) }
                  );
                }}
                disabled={updateStation.isPending || !newTariff}
                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {updateStation.isPending ? "..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Transfer Station Modal --- */}
      {showTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTransfer(false)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-lg w-full shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Перенести станцию</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Текущая локация: <strong className="text-zinc-900 dark:text-white">{station.location?.name || '\u2014'}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Поиск локации</label>
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="Название или адрес..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1">
                {locationsData?.data
                  ?.filter((loc) => loc.id !== station.location_id)
                  .map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => setTransferLocationId(loc.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        transferLocationId === loc.id
                          ? 'bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <p className="font-medium">{loc.name}</p>
                      <p className="text-xs text-zinc-400">{loc.address}{loc.city ? `, ${loc.city}` : ''}</p>
                    </button>
                  ))}
                {locationsData?.data?.filter((loc) => loc.id !== station.location_id).length === 0 && (
                  <p className="text-sm text-zinc-400 text-center py-4">Нет доступных локаций</p>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <Icon icon="solar:danger-triangle-bold-duotone" width={18} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Станция и вся история сессий переносятся. EVSE ID будет пересгенерирован.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowTransfer(false); setTransferLocationId(""); setLocationSearch(""); }} className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors">
                Отмена
              </button>
              <button
                onClick={() => transferMutation.mutate()}
                disabled={!transferLocationId || transferMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {transferMutation.isPending ? "Перенос..." : "Перенести"}
              </button>
            </div>
            {transferMutation.error && (
              <p className="mt-3 text-xs text-red-500">{(transferMutation.error as any)?.message || "Ошибка переноса"}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
