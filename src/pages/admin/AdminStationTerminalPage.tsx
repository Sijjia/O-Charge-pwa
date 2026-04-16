import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface OcppEvent {
  id: string;
  timestamp: string;
  station_id: string;
  connector_id?: number;
  event_type: string;
  direction: string;
  severity: string;
  request_payload?: Record<string, unknown>;
  response_payload?: Record<string, unknown>;
  processing_time_ms?: number;
  error_message?: string;
}

interface SimStatus {
  active: boolean;
  station_id?: string;
  connectors?: Array<{
    id: number;
    status: string;
    energy_kwh: number;
    power_kw: number;
    duration_s: number;
    cost: number;
    transaction_id?: number | null;
  }>;
  uptime_s?: number;
  messages_sent?: number;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  info: {
    bg: "bg-emerald-500/10 border-emerald-500/20",
    text: "text-emerald-400",
    icon: "solar:check-circle-linear",
  },
  warning: {
    bg: "bg-amber-500/10 border-amber-500/20",
    text: "text-amber-400",
    icon: "solar:warning-circle-linear",
  },
  error: {
    bg: "bg-red-500/10 border-red-500/20",
    text: "text-red-400",
    icon: "solar:danger-circle-linear",
  },
  critical: {
    bg: "bg-red-600/20 border-red-600/30",
    text: "text-red-300",
    icon: "solar:fire-bold",
  },
};

const EVENT_ICONS: Record<string, string> = {
  BootNotification: "solar:power-bold-duotone",
  StatusNotification: "solar:info-circle-bold-duotone",
  Authorize: "solar:shield-check-bold-duotone",
  StartTransaction: "solar:bolt-bold-duotone",
  StopTransaction: "solar:stop-circle-bold-duotone",
  MeterValues: "solar:chart-bold-duotone",
  Heartbeat: "solar:heart-pulse-bold-duotone",
  RemoteStartTransaction: "solar:play-bold-duotone",
  RemoteStopTransaction: "solar:stop-bold-duotone",
  LimitCheck: "solar:shield-warning-bold-duotone",
  SessionFinalize: "solar:clipboard-check-bold-duotone",
};

// ─── Fetch-based SSE reader (reliable cross-origin with credentials) ───

async function fetchSSE(
  url: string,
  eventName: string,
  onEvent: (data: OcppEvent) => void,
  onConnected: () => void,
  onError: () => void,
  signal: AbortSignal,
) {
  try {
    const resp = await fetch(url, {
      credentials: "include",
      signal,
      headers: { Accept: "text/event-stream" },
    });
    if (!resp.ok || !resp.body) {
      onError();
      return;
    }
    onConnected();
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        if (!part.trim()) continue;
        const lines = part.split("\n");
        let evtName = "";
        let evtData = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) evtName = line.slice(7).trim();
          else if (line.startsWith("data: ")) evtData = line.slice(6);
        }
        if (evtName === eventName && evtData) {
          try {
            onEvent(JSON.parse(evtData));
          } catch {
            /* ignore parse errors */
          }
        }
      }
    }
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    onError();
  }
}

// ─── API helpers ───

async function apiFetch<T = Record<string, unknown>>(
  path: string,
  opts?: RequestInit,
): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  return resp.json();
}

// ─── Component ───

export function AdminStationTerminalPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();
  const [events, setEvents] = useState<OcppEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [onlineStations, setOnlineStations] = useState<string[]>([]);
  const [selectedStation, setSelectedStation] = useState(stationId || "*");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ─── Simulator state ───
  const [sim, setSim] = useState<SimStatus>({ active: false });
  const [simLoading, setSimLoading] = useState<string | null>(null);
  const simPollRef = useRef<number | null>(null);

  // Fetch simulator status
  const pollSimStatus = useCallback(async () => {
    try {
      const data = await apiFetch<SimStatus & { success: boolean }>("/api/v1/admin/simulator/status");
      setSim(data);
    } catch {
      /* ignore */
    }
  }, []);

  // Poll simulator status every 3s when active
  useEffect(() => {
    pollSimStatus();
    simPollRef.current = window.setInterval(pollSimStatus, 3000);
    return () => {
      if (simPollRef.current) clearInterval(simPollRef.current);
    };
  }, [pollSimStatus]);

  // Fetch online stations
  useEffect(() => {
    apiFetch<{ success: boolean; stations: string[] }>("/api/v1/admin/logs/stations/online")
      .then((data) => {
        if (data.success) setOnlineStations(data.stations || []);
      })
      .catch(() => {});
  }, [sim.active]);

  // ─── SSE connection via fetch ───
  const connectSSE = useCallback((sid: string) => {
    if (abortRef.current) abortRef.current.abort();
    if (!sid) return;

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const url = `${API_BASE}/api/v1/admin/logs/station/${encodeURIComponent(sid)}/stream`;
    fetchSSE(
      url,
      "ocpp",
      (event) => setEvents((prev) => [...prev, event].slice(-1000)),
      () => setIsConnected(true),
      () => {
        setIsConnected(false);
        // Reconnect after 3s
        setTimeout(() => {
          if (!ctrl.signal.aborted) connectSSE(sid);
        }, 3000);
      },
      ctrl.signal,
    );
  }, []);

  useEffect(() => {
    const sid = selectedStation || stationId || "*";
    connectSSE(sid);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [selectedStation, stationId, connectSSE]);

  // Autoscroll
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [events, autoScroll]);

  // ─── Simulator actions ───
  const simAction = async (action: string, body?: Record<string, unknown>) => {
    setSimLoading(action);
    try {
      await apiFetch(`/api/v1/admin/simulator/${action}`, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });
      await pollSimStatus();
    } catch (e) {
      console.error(`Simulator ${action} failed:`, e);
    } finally {
      setSimLoading(null);
    }
  };

  const handleStartSim = () => simAction("start", { station_id: "SIM-001", connectors: 2 });
  const handleStopSim = () => simAction("stop");
  const handlePlugIn = (cid: number) => simAction("plug-in", { connector_id: cid });
  const handleStartCharging = (cid: number) => simAction("start-charging", { connector_id: cid, id_tag: "SIM-USER-001" });
  const handleStopCharging = (cid: number) => simAction("stop-charging", { connector_id: cid });

  // ─── Filtering ───
  const filteredEvents =
    filter === "ALL" ? events : events.filter((e) => e.event_type === filter || e.severity === filter.toLowerCase());
  const eventTypes = [...new Set(events.map((e) => e.event_type))].sort();
  const sid = selectedStation || stationId || "*";

  // Connector status color helper
  const connStatusColor = (s: string) => {
    if (s === "Available") return "text-emerald-400";
    if (s === "Preparing") return "text-amber-400";
    if (s === "Charging") return "text-cyan-400";
    if (s === "Faulted") return "text-red-400";
    return "text-zinc-400";
  };

  return (
    <div className="p-4 md:p-8 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
        >
          <Icon icon="solar:arrow-left-linear" width={20} className="text-zinc-500" />
        </button>
        <AdminPageHeader
          title={`Терминал станции${sid !== "*" ? `: ${sid}` : " (все)"}`}
          subtitle="Real-time OCPP события"
        />
      </div>

      {/* ─── Simulator Panel ─── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon icon="solar:cpu-bolt-bold-duotone" width={20} className="text-red-400" />
            <span className="text-sm font-bold text-white">Симулятор OCPP</span>
            {sim.active && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ONLINE
              </span>
            )}
          </div>
          {!sim.active ? (
            <button
              onClick={handleStartSim}
              disabled={simLoading !== null}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {simLoading === "start" ? (
                <Icon icon="svg-spinners:ring-resize" width={14} />
              ) : (
                <Icon icon="solar:play-bold" width={14} />
              )}
              Запустить
            </button>
          ) : (
            <button
              onClick={handleStopSim}
              disabled={simLoading !== null}
              className="px-4 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {simLoading === "stop" ? (
                <Icon icon="svg-spinners:ring-resize" width={14} />
              ) : (
                <Icon icon="solar:stop-bold" width={14} />
              )}
              Остановить
            </button>
          )}
        </div>

        {sim.active && sim.connectors && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sim.connectors.map((conn) => (
              <div
                key={conn.id}
                className="bg-zinc-800/80 border border-zinc-700/50 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-[10px] text-zinc-500">C{conn.id}</div>
                    <div className={`text-xs font-bold ${connStatusColor(conn.status)}`}>
                      {conn.status}
                    </div>
                  </div>
                  {conn.status === "Charging" && (
                    <div className="flex gap-3 text-[11px]">
                      <span className="text-cyan-400">{conn.energy_kwh.toFixed(2)} kWh</span>
                      <span className="text-amber-400">{conn.power_kw} kW</span>
                      <span className="text-zinc-400">{Math.round(conn.duration_s)}s</span>
                      <span className="text-emerald-400">{conn.cost} c</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {conn.status === "Available" && (
                    <button
                      onClick={() => handlePlugIn(conn.id)}
                      disabled={simLoading !== null}
                      className="px-2.5 py-1 bg-amber-600/20 text-amber-400 text-[10px] font-bold rounded-md hover:bg-amber-600/30 transition-colors disabled:opacity-50"
                    >
                      Plug In
                    </button>
                  )}
                  {conn.status === "Preparing" && (
                    <button
                      onClick={() => handleStartCharging(conn.id)}
                      disabled={simLoading !== null}
                      className="px-2.5 py-1 bg-cyan-600/20 text-cyan-400 text-[10px] font-bold rounded-md hover:bg-cyan-600/30 transition-colors disabled:opacity-50"
                    >
                      Start
                    </button>
                  )}
                  {conn.status === "Charging" && (
                    <button
                      onClick={() => handleStopCharging(conn.id)}
                      disabled={simLoading !== null}
                      className="px-2.5 py-1 bg-red-600/20 text-red-400 text-[10px] font-bold rounded-md hover:bg-red-600/30 transition-colors disabled:opacity-50"
                    >
                      Stop
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {sim.active && (
          <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-500">
            <span>Station: {sim.station_id}</span>
            <span>Uptime: {sim.uptime_s}s</span>
            <span>Messages: {sim.messages_sent}</span>
          </div>
        )}
      </div>

      {/* Station selector + controls */}
      <div className="grid gap-3 md:grid-cols-4 items-end">
        {/* Station selector */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">Станция</label>
          <select
            value={selectedStation}
            onChange={(e) => {
              setSelectedStation(e.target.value);
              setEvents([]);
            }}
            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white"
          >
            <option value="*">Все станции</option>
            {onlineStations.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">Фильтр</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white"
          >
            <option value="ALL">Все события</option>
            <optgroup label="По типу">
              {eventTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </optgroup>
            <optgroup label="По severity">
              <option value="ERROR">Только ошибки</option>
              <option value="WARNING">Предупреждения</option>
            </optgroup>
          </select>
        </div>

        {/* Connection status */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <div>
              <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">SSE</div>
              <div className="text-sm font-bold text-zinc-900 dark:text-white">
                {isConnected ? "Online" : "Connecting..."}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex gap-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
              autoScroll
                ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <Icon icon={autoScroll ? "solar:arrow-down-linear" : "solar:stop-circle-linear"} width={14} />
            {autoScroll ? "Auto" : "Manual"}
          </button>
          <button
            onClick={() => setEvents([])}
            className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
          >
            <Icon icon="solar:trash-bin-linear" width={14} />
          </button>
        </div>
      </div>

      {/* Terminal window */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-520px)] min-h-[300px]">
        {/* Terminal header */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-zinc-400 text-xs font-mono">
              ocpp-terminal -- {sid} -- {filteredEvents.length} events
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-500 text-xs">
            <Icon icon="solar:server-bold-duotone" width={14} />
            <span>{onlineStations.length} online</span>
          </div>
        </div>

        {/* Events list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs">
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600">
              <Icon icon="solar:monitor-bold-duotone" width={48} className="mb-3 opacity-50" />
              <p className="text-sm">
                {sim.active ? "Ожидание OCPP событий от симулятора..." : "Запустите симулятор выше для генерации событий"}
              </p>
              <p className="text-zinc-700 mt-1">
                {isConnected ? `SSE подключено к ${sid === "*" ? "все станции" : sid}` : "SSE подключается..."}
              </p>
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const style = SEVERITY_STYLES[evt.severity] || SEVERITY_STYLES["info"]!;
              const evtIcon = EVENT_ICONS[evt.event_type] || "solar:document-bold-duotone";
              const isExpanded = expandedId === evt.id;
              const time = new Date(evt.timestamp).toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });

              return (
                <div key={evt.id}>
                  <div
                    className={`border-l-2 ${style.bg} rounded-r px-3 py-1.5 cursor-pointer hover:brightness-110 transition-all flex items-center gap-2`}
                    onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                  >
                    <span className="text-zinc-500 w-[70px] flex-shrink-0">{time}</span>
                    <span className={`w-4 flex-shrink-0 ${evt.direction === "inbound" ? "text-cyan-400" : "text-orange-400"}`}>
                      {evt.direction === "inbound" ? "\u2B05" : "\u27A1"}
                    </span>
                    <Icon icon={evtIcon} width={14} className={`${style.text} flex-shrink-0`} />
                    <span className={`font-bold ${style.text} w-[160px] flex-shrink-0 truncate`}>
                      {evt.event_type}
                    </span>
                    {sid === "*" && (
                      <span className="text-zinc-500 w-[100px] flex-shrink-0 truncate">[{evt.station_id}]</span>
                    )}
                    {evt.connector_id != null && (
                      <span className="text-zinc-600 flex-shrink-0">C{evt.connector_id}</span>
                    )}
                    {evt.processing_time_ms != null && (
                      <span className="text-zinc-600 flex-shrink-0">{evt.processing_time_ms}ms</span>
                    )}
                    {evt.error_message && (
                      <span className="text-red-400 truncate flex-1">{evt.error_message}</span>
                    )}
                    <Icon
                      icon={isExpanded ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"}
                      width={12}
                      className="text-zinc-600 flex-shrink-0"
                    />
                  </div>
                  {isExpanded && (
                    <div className="ml-[78px] border-l-2 border-zinc-800 pl-3 py-2 space-y-1">
                      {evt.request_payload && (
                        <div>
                          <span className="text-cyan-600 text-[10px]">REQUEST:</span>
                          <pre className="text-zinc-400 text-[11px] whitespace-pre-wrap break-all mt-0.5">
                            {JSON.stringify(evt.request_payload, null, 2)}
                          </pre>
                        </div>
                      )}
                      {evt.response_payload && (
                        <div>
                          <span className="text-orange-600 text-[10px]">RESPONSE:</span>
                          <pre className="text-zinc-400 text-[11px] whitespace-pre-wrap break-all mt-0.5">
                            {JSON.stringify(evt.response_payload, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={logsEndRef} />
        </div>

        {/* Status bar */}
        <div className="border-t border-zinc-800 px-4 py-2 bg-zinc-900 text-[10px] text-zinc-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            {isConnected ? "CONNECTED" : "DISCONNECTED"}
          </div>
          <div className="flex items-center gap-4">
            <span>Events: {filteredEvents.length}/{events.length}</span>
            <span>Station: {sid}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
