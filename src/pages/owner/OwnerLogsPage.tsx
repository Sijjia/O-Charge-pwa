import { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useOcppLogs, useOcppLogStats } from "@/features/owner/hooks/useAdminLogs";
import type { OcppLog } from "@/features/owner/services/adminLogsService";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminStatCard } from "@/features/admin/components/AdminStatCard";
import { AdminPagination } from "@/features/admin/components/AdminPagination";
import { getOcppError, getSeverityColor } from "@/shared/utils/ocppErrors";

// ─── Constants ───────────────────────────────────────────────────────────────

const SEVERITY_META: Record<string, { bar: string; text: string; bg: string; label: string }> = {
  info: { bar: "bg-sky-500", text: "text-sky-400", bg: "bg-sky-500/5", label: "INFO" },
  warning: { bar: "bg-amber-500", text: "text-amber-400", bg: "bg-amber-500/5", label: "WARN" },
  error: { bar: "bg-red-500", text: "text-red-400", bg: "bg-red-500/5", label: "ERR" },
  critical: { bar: "bg-purple-500", text: "text-purple-400", bg: "bg-purple-500/5", label: "CRIT" },
};

const DIRECTION_META: Record<string, { label: string; icon: string; cls: string }> = {
  inbound: { label: "↓ Входящее", icon: "solar:alt-arrow-down-bold", cls: "text-sky-400 bg-sky-500/10" },
  outbound: { label: "↑ Исходящее", icon: "solar:alt-arrow-up-bold", cls: "text-emerald-400 bg-emerald-500/10" },
};

const EVENT_TYPES = [
  "BootNotification", "StatusNotification", "Authorize",
  "StartTransaction", "StopTransaction", "MeterValues",
  "Heartbeat", "DataTransfer", "RemoteStartTransaction", "RemoteStopTransaction",
];

// ─── JSON Tree ────────────────────────────────────────────────────────────────

function JsonTree({ data, depth = 0 }: { data: unknown; depth?: number }) {
  const [collapsed, setCollapsed] = useState(depth > 0);

  const toggle = (e: React.MouseEvent) => { e.stopPropagation(); setCollapsed(!collapsed); };

  if (Array.isArray(data)) {
    return data.length === 0 ? (
      <span className="text-zinc-500 text-xs">[]</span>
    ) : (
      <span>
        <button onClick={toggle} className="text-zinc-500 hover:text-zinc-200 font-mono text-xs px-0.5">
          {collapsed ? "▶" : "▼"}
        </button>
        {collapsed ? (
          <span className="text-zinc-500 text-xs">[{data.length} item{data.length !== 1 ? "s" : ""}]</span>
        ) : (
          <span className="block pl-4 border-l border-zinc-700/60 mt-0.5">
            {data.map((item, i) => (
              <span key={i} className="block">
                <span className="text-zinc-600 text-xs">{i}: </span>
                <JsonTree data={item} depth={depth + 1} />
                {i < data.length - 1 && <span className="text-zinc-700 text-xs">,</span>}
              </span>
            ))}
          </span>
        )}
      </span>
    );
  }

  if (typeof data === "object" && data !== null) {
    const entries = Object.entries(data);
    return entries.length === 0 ? (
      <span className="text-zinc-500 text-xs">{"{}"}</span>
    ) : (
      <span>
        <button onClick={toggle} className="text-zinc-500 hover:text-zinc-200 font-mono text-xs px-0.5">
          {collapsed ? "▶" : "▼"}
        </button>
        {collapsed ? (
          <span className="text-zinc-500 text-xs">{"{"}…{"}"} <span className="text-zinc-600">{entries.length} keys</span></span>
        ) : (
          <span className="block pl-4 border-l border-zinc-700/60 mt-0.5">
            {entries.map(([k, v], i) => (
              <span key={k} className="block">
                <span className="text-sky-300 text-xs">"{k}"</span>
                <span className="text-zinc-500 text-xs">: </span>
                <JsonTree data={v} depth={depth + 1} />
                {i < entries.length - 1 && <span className="text-zinc-700 text-xs">,</span>}
              </span>
            ))}
          </span>
        )}
      </span>
    );
  }

  if (typeof data === "string") return <span className="text-amber-300 text-xs break-all">"{data}"</span>;
  if (typeof data === "number") return <span className="text-violet-300 text-xs">{data}</span>;
  if (typeof data === "boolean") return <span className="text-sky-400 text-xs">{String(data)}</span>;
  if (data === null) return <span className="text-zinc-500 text-xs">null</span>;
  return <span className="text-white text-xs">{String(data)}</span>;
}

// ─── Log Row ──────────────────────────────────────────────────────────────────

function LogRow({ log, isExpanded, onToggle }: { log: OcppLog; isExpanded: boolean; onToggle: () => void }) {
  const sev = (SEVERITY_META[log.severity] ?? SEVERITY_META['info'])!;
  const dir = DIRECTION_META[log.direction];
  const hasPayload = !!(log.request_payload || log.response_payload || log.error_message);
  const [copied, setCopied] = useState(false);
  const [copiedReq, setCopiedReq] = useState(false);
  const [copiedRes, setCopiedRes] = useState(false);

  const copy = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 1500);
  };

  const timeStr = log.created_at
    ? new Date(log.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";
  const dateStr = log.created_at
    ? new Date(log.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })
    : "";

  const errInfo = log.error_message ? getOcppError(log.error_message) : null;
  const errColors = errInfo ? getSeverityColor(errInfo.severity) : null;

  return (
    <>
      {/* Row */}
      <div
        onClick={hasPayload ? onToggle : undefined}
        className={`
          flex items-center gap-0 border-b transition-all select-none
          ${hasPayload ? "cursor-pointer" : "cursor-default"}
          ${isExpanded
            ? "bg-zinc-800/80 border-zinc-700"
            : `border-zinc-200/50 dark:border-zinc-800/60 hover:bg-zinc-50 dark:${sev.bg}`
          }
        `}
      >
        {/* Accent bar */}
        <div className={`w-0.5 self-stretch ${sev.bar} flex-shrink-0`} />

        {/* Chevron */}
        <div className="w-8 flex-shrink-0 flex items-center justify-center">
          {hasPayload ? (
            <Icon
              icon={isExpanded ? "solar:alt-arrow-down-linear" : "solar:alt-arrow-right-linear"}
              width={12}
              className="text-zinc-500"
            />
          ) : null}
        </div>

        {/* Severity */}
        <div className={`w-12 flex-shrink-0 text-[10px] font-bold ${sev.text}`}>
          {sev.label}
        </div>

        {/* Time */}
        <div className="w-28 flex-shrink-0 hidden md:block">
          <div className="text-[10px] font-mono text-zinc-500">{timeStr}</div>
          <div className="text-[9px] text-zinc-700">{dateStr}</div>
        </div>

        {/* Station */}
        <div className="w-28 flex-shrink-0 hidden lg:block">
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded truncate block max-w-[100px]" title={log.station_id}>
            {log.station_id}
          </span>
        </div>

        {/* Event type + connector */}
        <div className="flex-1 min-w-0 flex items-center gap-2 pr-3 py-3">
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 truncate">
            {log.event_type}
          </span>
          {log.connector_id != null && (
            <span className="text-[10px] text-zinc-500 flex-shrink-0">
              #{log.connector_id}
            </span>
          )}
        </div>

        {/* Direction */}
        <div className="w-28 flex-shrink-0 hidden sm:flex pr-3">
          {dir ? (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${dir.cls}`}>
              <Icon icon={dir.icon} width={10} />
              {log.direction}
            </span>
          ) : (
            <span className="text-[10px] text-zinc-500">{log.direction}</span>
          )}
        </div>

        {/* Processing time */}
        <div className="w-20 flex-shrink-0 pr-3 hidden xl:block">
          <span className="text-[10px] font-mono text-zinc-500">
            {log.processing_time_ms != null ? `${log.processing_time_ms}ms` : "—"}
          </span>
        </div>

        {/* Error badge */}
        <div className="w-40 flex-shrink-0 pr-3 hidden lg:flex items-center">
          {errInfo && errColors ? (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${errColors.bg} ${errColors.text} border ${errColors.border}`}>
              <Icon icon={errInfo.icon} width={10} />
              <span className="truncate max-w-[110px]">{errInfo.title}</span>
            </span>
          ) : log.error_message ? (
            <span className="text-[10px] text-red-400 truncate max-w-[130px]">{log.error_message}</span>
          ) : null}
        </div>

        {/* Copy button */}
        <div className="w-8 flex-shrink-0 flex items-center justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); copy(JSON.stringify(log, null, 2), setCopied); }}
            className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700 transition-all"
            title="Копировать JSON"
          >
            <Icon icon={copied ? "solar:check-circle-linear" : "solar:copy-linear"} width={13} className={copied ? "text-emerald-400" : ""} />
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="bg-zinc-950 dark:bg-black border-b border-zinc-800 font-mono text-xs">
          {/* Header bar */}
          <div className="flex items-center gap-4 px-6 py-2.5 border-b border-zinc-800/80 text-zinc-500">
            <div className="flex items-center gap-2">
              <Icon icon="solar:clock-circle-linear" width={13} />
              <span>{log.created_at ? new Date(log.created_at).toLocaleString("ru-RU") : "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon="solar:station-linear" width={13} />
              <span className="text-sky-400">{log.station_id}</span>
            </div>
            {log.connector_id != null && (
              <div className="flex items-center gap-2">
                <Icon icon="solar:plug-circle-linear" width={13} />
                <span>Коннектор #{log.connector_id}</span>
              </div>
            )}
            {log.message_id && (
              <div className="flex items-center gap-2 hidden md:flex">
                <Icon icon="solar:tag-linear" width={13} />
                <span className="text-zinc-600">{log.message_id}</span>
              </div>
            )}
            {log.processing_time_ms != null && (
              <div className="flex items-center gap-2">
                <Icon icon="solar:stopwatch-linear" width={13} />
                <span className={log.processing_time_ms > 500 ? "text-amber-400" : "text-zinc-400"}>
                  {log.processing_time_ms}ms
                </span>
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => copy(JSON.stringify(log, null, 2), setCopied)}
                className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
              >
                <Icon icon={copied ? "solar:check-circle-linear" : "solar:copy-linear"} width={12} className={copied ? "text-emerald-400" : ""} />
                {copied ? "Скопировано" : "Копировать всё"}
              </button>
            </div>
          </div>

          {/* Error explanation */}
          {errInfo && log.error_message && errColors && (
            <div className={`mx-4 mt-3 px-4 py-3 rounded-xl border ${errColors.bg} ${errColors.border} flex flex-col gap-1.5`}>
              <div className={`flex items-center gap-2 font-semibold ${errColors.text} font-sans text-[11px]`}>
                <Icon icon={errInfo.icon} width={14} />
                {errInfo.title}
              </div>
              <p className="text-zinc-500 font-sans text-[10px] leading-relaxed">{errInfo.description}</p>
              <p className="text-emerald-400 font-sans text-[10px] font-medium">Что делать: <span className="text-zinc-300">{errInfo.action}</span></p>
              {errInfo.callSupport && (
                <p className="text-red-400 font-sans text-[10px] font-semibold">📞 Требуется обращение в поддержку</p>
              )}
            </div>
          )}

          {/* Payloads */}
          <div className={`p-4 grid gap-4 ${log.request_payload && log.response_payload ? "lg:grid-cols-2" : "grid-cols-1"}`}>
            {log.request_payload != null && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-800/60">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Icon icon="solar:alt-arrow-down-bold" width={12} className="text-sky-400" />
                    Request Payload
                  </span>
                  <button
                    onClick={() => copy(JSON.stringify(log.request_payload, null, 2), setCopiedReq)}
                    className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    <Icon icon={copiedReq ? "solar:check-circle-linear" : "solar:copy-linear"} width={11} className={copiedReq ? "text-emerald-400" : ""} />
                    {copiedReq ? "Скопировано" : "Копировать"}
                  </button>
                </div>
                <div className="p-3 overflow-x-auto max-h-64 overflow-y-auto">
                  <JsonTree data={log.request_payload} depth={0} />
                </div>
              </div>
            )}
            {log.response_payload != null && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-800/60">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Icon icon="solar:alt-arrow-up-bold" width={12} className="text-emerald-400" />
                    Response Payload
                  </span>
                  <button
                    onClick={() => copy(JSON.stringify(log.response_payload, null, 2), setCopiedRes)}
                    className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    <Icon icon={copiedRes ? "solar:check-circle-linear" : "solar:copy-linear"} width={11} className={copiedRes ? "text-emerald-400" : ""} />
                    {copiedRes ? "Скопировано" : "Копировать"}
                  </button>
                </div>
                <div className="p-3 overflow-x-auto max-h-64 overflow-y-auto">
                  <JsonTree data={log.response_payload} depth={0} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function OwnerLogsPage() {
  const [page, setPage] = useState(1);
  const [stationId, setStationId] = useState("");
  const [eventType, setEventType] = useState("");
  const [direction, setDirection] = useState("");
  const [severity, setSeverity] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filters = useMemo(() => ({
    page, per_page: 30,
    station_id: stationId || undefined,
    event_type: eventType || undefined,
    direction: direction || undefined,
    severity: severity || undefined,
    search: search || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
  }), [page, stationId, eventType, direction, severity, search, fromDate, toDate]);

  const statsFilters = useMemo(() => ({
    station_id: stationId || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
  }), [stationId, fromDate, toDate]);

  const { data, isLoading, error } = useOcppLogs(filters);
  const { data: statsData } = useOcppLogStats(statsFilters);

  const logs = data?.items || [];
  const totalPages = data?.pages || 1;
  const total = data?.total || 0;
  const bySeverity = statsData?.by_severity || {};

  const statsCards = [
    { label: "Всего", value: statsData?.total ?? 0, icon: "solar:document-text-linear", color: "text-blue-500" },
    { label: "Info", value: bySeverity["info"] ?? 0, icon: "solar:info-circle-linear", color: "text-sky-400" },
    { label: "Warning", value: bySeverity["warning"] ?? 0, icon: "solar:danger-triangle-linear", color: "text-amber-400" },
    { label: "Error", value: (bySeverity["error"] ?? 0) + (bySeverity["critical"] ?? 0), icon: "solar:close-circle-linear", color: "text-red-400" },
  ];

  const resetFilters = () => {
    setStationId(""); setEventType(""); setDirection(""); setSeverity("");
    setSearch(""); setFromDate(""); setToDate(""); setPage(1);
  };

  const hasFilters = stationId || eventType || direction || severity || search || fromDate || toDate;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const collapseAll = () => setExpandedIds(new Set());
  const expandAll = () => setExpandedIds(new Set(logs.map((l) => l.id)));

  const inputCls = "w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors";

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <AdminPageHeader
          title="OCPP Логи"
          subtitle="Мониторинг OCPP событий"
          helpText="Все сообщения между сервером и зарядными станциями. Кликните по строке, чтобы раскрыть payload и детали."
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statsCards.map((s) => (
          <AdminStatCard key={s.label} label={s.label} value={s.value.toLocaleString()} icon={s.icon} />
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search always visible */}
        <div className="flex-1 min-w-[200px] relative">
          <Icon icon="solar:magnifer-linear" width={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Поиск: станция, событие, ошибка..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 text-zinc-900 dark:text-white placeholder-zinc-400 transition-all"
          />
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl border transition-colors ${showFilters
              ? "bg-red-600 text-white border-red-600"
              : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
        >
          <Icon icon="solar:filter-linear" width={16} />
          Фильтры
          {hasFilters && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
        </button>

        {hasFilters && (
          <button onClick={resetFilters} className="text-sm text-zinc-500 hover:text-red-500 transition-colors">
            Сбросить
          </button>
        )}

        {/* Expand / collapse */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={expandAll}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all"
          >
            <Icon icon="solar:alt-arrow-down-linear" width={13} />
            Раскрыть все
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all"
          >
            <Icon icon="solar:alt-arrow-up-linear" width={13} />
            Свернуть все
          </button>
        </div>

        <span className="text-sm text-zinc-500 whitespace-nowrap">{total.toLocaleString()} записей</span>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Station ID</label>
              <input value={stationId} onChange={(e) => { setStationId(e.target.value); setPage(1); }} className={inputCls} placeholder="SIM-TEST" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Тип события</label>
              <select value={eventType} onChange={(e) => { setEventType(e.target.value); setPage(1); }} className={inputCls}>
                <option value="">Все</option>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Направление</label>
              <select value={direction} onChange={(e) => { setDirection(e.target.value); setPage(1); }} className={inputCls}>
                <option value="">Все</option>
                <option value="inbound">Входящее</option>
                <option value="outbound">Исходящее</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Severity</label>
              <select value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }} className={inputCls}>
                <option value="">Все</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">От</label>
              <input type="datetime-local" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">До</label>
              <input type="datetime-local" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className={inputCls} />
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Icon icon="solar:refresh-linear" width={32} className="text-red-500 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0 mt-0.5" width={18} />
          <p className="text-red-400 text-sm">{error instanceof Error ? error.message : "Не удалось загрузить логи"}</p>
        </div>
      )}

      {/* Tree Table */}
      {!isLoading && !error && logs.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Column headers */}
          <div className="hidden md:flex items-center gap-0 px-0 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
            <div className="w-0.5 flex-shrink-0" />
            <div className="w-8 flex-shrink-0" />
            <div className="w-12">Ур.</div>
            <div className="w-28 hidden md:block">Время</div>
            <div className="w-28 hidden lg:block">Станция</div>
            <div className="flex-1">Событие</div>
            <div className="w-28 hidden sm:block">Направление</div>
            <div className="w-20 hidden xl:block">Время (ms)</div>
            <div className="w-40 hidden lg:block">Ошибка</div>
            <div className="w-8" />
          </div>

          {/* Rows */}
          {logs.map((log) => (
            <LogRow
              key={log.id}
              log={log}
              isExpanded={expandedIds.has(log.id)}
              onToggle={() => toggleExpand(log.id)}
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && logs.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
          <Icon icon="solar:document-text-linear" width={32} className="text-zinc-400 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">{hasFilters ? "Нет логов по заданным фильтрам" : "Пока нет OCPP логов"}</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <AdminPagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={30}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

export default OwnerLogsPage;
