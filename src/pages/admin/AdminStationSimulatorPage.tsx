import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminStatCard } from "@/features/admin/components/AdminStatCard";
import { AdminStatusBadge } from "@/features/admin/components/AdminStatusBadge";
import {
  useSimulatorStatus,
  useSimulatorLog,
  useStartSimulator,
  useStopSimulator,
  useSimulatorPlugIn,
  useSimulatorStartCharging,
  useSimulatorStopCharging,
} from "@/features/admin/hooks/useSimulator";
import type { ConnectorStatus, SimulatorLogEvent } from "@/features/admin/services/simulatorService";

// --- OCPP event icons (reuse from terminal page) ---
const EVENT_ICONS: Record<string, string> = {
  BootNotification: "solar:power-bold-duotone",
  BootNotificationResponse: "solar:power-bold-duotone",
  StatusNotification: "solar:info-circle-bold-duotone",
  StatusNotificationResponse: "solar:info-circle-bold-duotone",
  Authorize: "solar:shield-check-bold-duotone",
  AuthorizeResponse: "solar:shield-check-bold-duotone",
  StartTransaction: "solar:bolt-bold-duotone",
  StartTransactionResponse: "solar:bolt-bold-duotone",
  StopTransaction: "solar:stop-circle-bold-duotone",
  StopTransactionResponse: "solar:stop-circle-bold-duotone",
  MeterValues: "solar:chart-bold-duotone",
  MeterValuesResponse: "solar:chart-bold-duotone",
  Heartbeat: "solar:heart-pulse-bold-duotone",
  HeartbeatResponse: "solar:heart-pulse-bold-duotone",
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function connectorBadgeVariant(status: string) {
  switch (status) {
    case "Available": return "online" as const;
    case "Preparing": return "warning" as const;
    case "Charging": return "charging" as const;
    case "Finishing": return "info" as const;
    default: return "neutral" as const;
  }
}

function connectorStatusLabel(status: string): string {
  switch (status) {
    case "Available": return "Свободен";
    case "Preparing": return "Подготовка";
    case "Charging": return "Зарядка";
    case "Finishing": return "Завершение";
    default: return status;
  }
}

// --- Connector Card ---
function ConnectorCard({
  connector,
  onPlugIn,
  onStartCharging,
  onStopCharging,
  isLoading,
}: {
  connector: ConnectorStatus;
  onPlugIn: () => void;
  onStartCharging: () => void;
  onStopCharging: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white dark:bg-[#111621] border border-zinc-100 dark:border-white/[0.04] rounded-3xl p-5 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] relative overflow-hidden">
      {/* Charging glow */}
      {connector.status === "Charging" && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent animate-pulse pointer-events-none" />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
              connector.status === "Charging"
                ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400"
                : connector.status === "Preparing"
                  ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400"
                  : "bg-zinc-50 dark:bg-[#1C212B] border-zinc-100 dark:border-white/5 text-zinc-600 dark:text-zinc-400"
            }`}>
              <Icon icon="solar:plug-circle-bold-duotone" width={22} />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                Коннектор {connector.id}
              </div>
              <AdminStatusBadge
                variant={connectorBadgeVariant(connector.status)}
                label={connectorStatusLabel(connector.status)}
              />
            </div>
          </div>
          {connector.transaction_id && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
              TX#{connector.transaction_id}
            </span>
          )}
        </div>

        {/* Metrics (visible when charging) */}
        {connector.status === "Charging" && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-zinc-50 dark:bg-[#1C212B] rounded-xl p-3 border border-zinc-100 dark:border-white/5">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Энергия</div>
              <div className="text-lg font-bold text-zinc-900 dark:text-white font-mono">
                {connector.energy_kwh.toFixed(2)} <span className="text-xs font-normal text-zinc-400">кВтч</span>
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-[#1C212B] rounded-xl p-3 border border-zinc-100 dark:border-white/5">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Мощность</div>
              <div className="text-lg font-bold text-zinc-900 dark:text-white font-mono">
                {connector.power_kw.toFixed(1)} <span className="text-xs font-normal text-zinc-400">кВт</span>
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-[#1C212B] rounded-xl p-3 border border-zinc-100 dark:border-white/5">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Время</div>
              <div className="text-lg font-bold text-zinc-900 dark:text-white font-mono">
                {formatDuration(connector.duration_s)}
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-[#1C212B] rounded-xl p-3 border border-zinc-100 dark:border-white/5">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Стоимость</div>
              <div className="text-lg font-bold text-zinc-900 dark:text-white font-mono">
                ~{connector.cost.toFixed(0)} <span className="text-xs font-normal text-zinc-400">сом</span>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div>
          {connector.status === "Available" && (
            <button
              onClick={onPlugIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Icon icon="solar:plug-circle-bold-duotone" width={18} />
              Подключить EV
            </button>
          )}
          {connector.status === "Preparing" && (
            <button
              onClick={onStartCharging}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Icon icon="solar:bolt-circle-bold-duotone" width={18} />
              Начать зарядку
            </button>
          )}
          {connector.status === "Charging" && (
            <button
              onClick={onStopCharging}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Icon icon="solar:stop-circle-bold-duotone" width={18} />
              Остановить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- OCPP Event Log ---
function OcppEventLog({ events, maxHeight = "400px" }: { events: SimulatorLogEvent[]; maxHeight?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length, autoScroll]);

  return (
    <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <Icon icon="solar:monitor-bold-duotone" width={16} className="text-zinc-400" />
          <span className="text-xs font-medium text-zinc-400">OCPP Event Log</span>
          <span className="text-[10px] text-zinc-600 font-mono">{events.length} events</span>
        </div>
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
            autoScroll
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-zinc-800 text-zinc-500"
          }`}
        >
          Auto-scroll {autoScroll ? "ON" : "OFF"}
        </button>
      </div>

      {/* Events */}
      <div ref={scrollRef} className="overflow-y-auto font-mono text-xs" style={{ maxHeight }}>
        {events.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-zinc-600">
            <Icon icon="solar:inbox-unread-linear" width={20} className="mr-2" />
            Нет событий
          </div>
        ) : (
          events.map((ev, idx) => {
            const isOut = ev.direction === "out";
            const icon = EVENT_ICONS[ev.action] || "solar:letter-linear";
            const isExpanded = expandedIdx === idx;

            return (
              <div
                key={idx}
                className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors cursor-pointer"
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              >
                <div className="flex items-center gap-2 px-3 py-1.5">
                  {/* Direction arrow */}
                  <span className={isOut ? "text-blue-400" : "text-emerald-400"}>
                    {isOut ? "\u2192" : "\u2190"}
                  </span>

                  {/* Timestamp */}
                  <span className="text-zinc-600 w-20 shrink-0">
                    {ev.ts.split("T")[1]?.slice(0, 8) || ev.ts}
                  </span>

                  {/* Icon + Action */}
                  <Icon icon={icon} width={14} className="text-zinc-500 shrink-0" />
                  <span className={`font-medium ${isOut ? "text-blue-300" : "text-emerald-300"}`}>
                    {ev.action}
                  </span>

                  {/* Expand indicator */}
                  {ev.payload && (
                    <Icon
                      icon={isExpanded ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"}
                      width={12}
                      className="text-zinc-600 ml-auto shrink-0"
                    />
                  )}
                </div>

                {/* Expanded payload */}
                {isExpanded && ev.payload && (
                  <div className="px-3 pb-2">
                    <pre className="text-[10px] text-zinc-500 bg-zinc-900 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(ev.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// --- Auto dev-login (local development only) ---
// Ensures backend auth cookie is set for API calls on localhost.
// The page is already behind AdminProtectedRoute, so Zustand auth is satisfied.
function useDevAutoLogin() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Only on localhost dev server
    if (!window.location.hostname.includes("localhost")) {
      setReady(true);
      return;
    }

    let cancelled = false;

    // Directly call dev-login to ensure backend cookie is set
    fetch("/api/v1/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ user_id: "test-admin-001" }),
    })
      .then(() => { if (!cancelled) setReady(true); })
      .catch(() => { if (!cancelled) setReady(true); });

    return () => { cancelled = true; };
  }, []);

  return ready;
}

// --- Main Page ---
export function AdminStationSimulatorPage() {
  const devReady = useDevAutoLogin();
  const [stationId, setStationId] = useState("RP-BSH-001");
  const [numConnectors, setNumConnectors] = useState(2);
  const [polling, setPolling] = useState(true); // Always poll to detect active simulator

  const startMutation = useStartSimulator();
  const stopMutation = useStopSimulator();
  const plugInMutation = useSimulatorPlugIn();
  const startChargingMutation = useSimulatorStartCharging();
  const stopChargingMutation = useSimulatorStopCharging();

  const { data: status } = useSimulatorStatus(polling && devReady);
  const { data: logData } = useSimulatorLog(polling && devReady && status?.active === true);

  const isActive = status?.active === true;
  const connectors = status?.connectors || [];
  const events = logData?.events || [];

  // Auto-detect active simulator and update station ID
  useEffect(() => {
    if (isActive && status?.station_id) {
      setStationId(status.station_id);
    }
  }, [isActive, status?.station_id]);

  const totalEnergy = connectors.reduce((sum, c) => sum + c.energy_kwh, 0);
  const chargingCount = connectors.filter((c) => c.status === "Charging").length;

  const handleStart = () => {
    if (!stationId.trim()) return;
    setPolling(true);
    startMutation.mutate({ station_id: stationId.trim(), connectors: numConnectors });
  };

  const handleStop = () => {
    stopMutation.mutate(undefined, {
      onSuccess: () => {
        setPolling(false);
        // Force page reload to reset all state
        window.location.reload();
      },
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <AdminPageHeader
        title="Симулятор станции"
        subtitle="Интерактивная симуляция OCPP станции для тестирования и демонстрации"
      />

      {/* Connection Panel */}
      <div className="bg-white dark:bg-[#111621] border border-zinc-100 dark:border-white/[0.04] rounded-3xl p-5 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          {/* Station ID input */}
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              ID станции (serial_number из БД)
            </label>
            <input
              type="text"
              value={isActive ? (status?.station_id || "") : stationId}
              onChange={(e) => setStationId(e.target.value)}
              disabled={isActive}
              placeholder="e.g. STATION-001"
              className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
            />
          </div>

          {/* Connectors selector */}
          <div className="w-full sm:w-28">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Коннекторы
            </label>
            <select
              value={isActive ? connectors.length : numConnectors}
              onChange={(e) => setNumConnectors(Number(e.target.value))}
              disabled={isActive}
              className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>

          {/* Connect/Disconnect button */}
          <div>
            {!isActive ? (
              <button
                onClick={handleStart}
                disabled={startMutation.isPending || !stationId.trim()}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
              >
                <Icon icon="solar:plug-circle-bold-duotone" width={18} />
                {startMutation.isPending ? "Подключение..." : "Подключить"}
              </button>
            ) : (
              <button
                onClick={handleStop}
                disabled={stopMutation.isPending}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
              >
                <Icon icon="solar:logout-2-bold-duotone" width={18} />
                {stopMutation.isPending ? "Отключение..." : "Отключить"}
              </button>
            )}
          </div>

          {/* Status badge */}
          <div className="sm:pb-1">
            <AdminStatusBadge
              variant={isActive ? "online" : "offline"}
              label={isActive ? "Online" : "Offline"}
            />
          </div>
        </div>

        {startMutation.isError && (
          <div className="mt-3 text-sm text-red-600 dark:text-red-400">
            {(startMutation.error as Error)?.message || "Connection failed"}
          </div>
        )}
      </div>

      {/* Stat cards */}
      {isActive && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AdminStatCard
            label="Энергия"
            value={`${totalEnergy.toFixed(2)} кВтч`}
            icon="solar:bolt-circle-bold-duotone"
          />
          <AdminStatCard
            label="Активных сессий"
            value={chargingCount}
            icon="solar:charging-socket-bold-duotone"
          />
          <AdminStatCard
            label="Аптайм"
            value={formatDuration(status?.uptime_s || 0)}
            icon="solar:clock-circle-bold-duotone"
          />
          <AdminStatCard
            label="Сообщений"
            value={status?.messages_sent || 0}
            icon="solar:letter-bold-duotone"
          />
        </div>
      )}

      {/* Connector cards */}
      {isActive && connectors.length > 0 && (
        <div className={`grid gap-4 ${connectors.length === 1 ? "grid-cols-1 max-w-md" : "grid-cols-1 md:grid-cols-2"}`}>
          {connectors.map((conn) => (
            <ConnectorCard
              key={conn.id}
              connector={conn}
              onPlugIn={() => plugInMutation.mutate({ connector_id: conn.id })}
              onStartCharging={() => startChargingMutation.mutate({ connector_id: conn.id })}
              onStopCharging={() => stopChargingMutation.mutate({ connector_id: conn.id })}
              isLoading={plugInMutation.isPending || startChargingMutation.isPending || stopChargingMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* OCPP Event Log */}
      {isActive && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Icon icon="solar:monitor-bold-duotone" width={20} className="text-zinc-500 dark:text-zinc-400" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">OCPP Event Log</h2>
          </div>
          <OcppEventLog events={events} maxHeight="500px" />
        </div>
      )}

      {/* Empty state when not active */}
      {!isActive && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800/50 rounded-3xl flex items-center justify-center mb-4">
            <Icon icon="solar:gamepad-bold-duotone" width={40} className="text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
            Симулятор не запущен
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
            Введите ID станции из базы данных и нажмите &laquo;Подключить&raquo; для запуска
            виртуальной OCPP станции. Все данные записываются в реальную БД.
          </p>
        </div>
      )}
    </div>
  );
}
