import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Icon } from "@iconify/react";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";

const API_BASE = import.meta.env.VITE_API_URL || "";

// ─── Types ─────────────────────────────────────────────────────────────────

interface LogEntry {
  id: string;
  timestamp: string;
  level: "DEBUG" | "INFO" | "WARNING" | "ERROR";
  message: string;
  module?: string;
  function?: string;
  extra?: Record<string, unknown>;
}

// ─── SSE Reader ──────────────────────────────────────────────────────────────

async function fetchSSE(
  url: string,
  eventName: string,
  onEvent: (data: LogEntry) => void,
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
    if (!resp.ok || !resp.body) { onError(); return; }
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
        let evtName = ""; let evtData = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) evtName = line.slice(7).trim();
          else if (line.startsWith("data: ")) evtData = line.slice(6);
        }
        if (evtName === eventName && evtData) {
          try { onEvent(JSON.parse(evtData)); } catch { /* ignore */ }
        }
      }
    }
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    onError();
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Level = LogEntry["level"];

const LEVEL_META: Record<Level, { color: string; bar: string; bg: string; icon: string; label: string }> = {
  DEBUG: { color: "text-sky-400", bar: "bg-sky-500", bg: "bg-sky-500/5  hover:bg-sky-500/10", icon: "solar:bug-linear", label: "DEBUG" },
  INFO: { color: "text-emerald-400", bar: "bg-emerald-500", bg: "bg-emerald-500/5 hover:bg-emerald-500/10", icon: "solar:info-circle-linear", label: "INFO" },
  WARNING: { color: "text-amber-400", bar: "bg-amber-500", bg: "bg-amber-500/5  hover:bg-amber-500/10", icon: "solar:warning-circle-linear", label: "WARN" },
  ERROR: { color: "text-red-400", bar: "bg-red-500", bg: "bg-red-500/5    hover:bg-red-500/10", icon: "solar:danger-circle-linear", label: "ERROR" },
};

function fmt(ts: string) {
  const d = new Date(ts);
  return {
    date: d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }),
    time: d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    ms: d.getMilliseconds().toString().padStart(3, "0"),
  };
}

function tryParse(msg: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(msg);
    if (typeof parsed === "object" && parsed !== null) return parsed as Record<string, unknown>;
  } catch { /* ok */ }
  return null;
}

function JsonTree({ data, depth = 0 }: { data: unknown; depth?: number }) {
  const [collapsed, setCollapsed] = useState(depth > 1);

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-zinc-500">[]</span>;
    return (
      <span>
        <button onClick={() => setCollapsed(!collapsed)} className="text-zinc-400 hover:text-white mr-1 font-mono">
          {collapsed ? "▶" : "▼"}
        </button>
        {collapsed ? (
          <span className="text-zinc-500">[{data.length} items]</span>
        ) : (
          <span className="block pl-4 border-l border-zinc-700 ml-1">
            {data.map((item, i) => (
              <span key={i} className="block">
                <span className="text-zinc-500">{i}: </span>
                <JsonTree data={item} depth={depth + 1} />
                {i < data.length - 1 && <span className="text-zinc-600">,</span>}
              </span>
            ))}
          </span>
        )}
      </span>
    );
  }

  if (typeof data === "object" && data !== null) {
    const entries = Object.entries(data);
    if (entries.length === 0) return <span className="text-zinc-500">{"{}"}</span>;
    return (
      <span>
        <button onClick={() => setCollapsed(!collapsed)} className="text-zinc-400 hover:text-white mr-1 font-mono">
          {collapsed ? "▶" : "▼"}
        </button>
        {collapsed ? (
          <span className="text-zinc-500">{"{"}…{"}"}</span>
        ) : (
          <span className="block pl-4 border-l border-zinc-700 ml-1">
            {entries.map(([k, v], i) => (
              <span key={k} className="block">
                <span className="text-sky-300">{k}</span>
                <span className="text-zinc-500">: </span>
                <JsonTree data={v} depth={depth + 1} />
                {i < entries.length - 1 && <span className="text-zinc-600">,</span>}
              </span>
            ))}
          </span>
        )}
      </span>
    );
  }

  if (typeof data === "string") return <span className="text-amber-300">"{data}"</span>;
  if (typeof data === "number") return <span className="text-violet-300">{String(data)}</span>;
  if (typeof data === "boolean") return <span className="text-sky-300">{String(data)}</span>;
  if (data === null) return <span className="text-zinc-500">null</span>;
  return <span className="text-white">{String(data)}</span>;
}

// ─── Single Log Row ───────────────────────────────────────────────────────────

function LogRow({ log, isExpanded, onToggle }: { log: LogEntry; isExpanded: boolean; onToggle: () => void }) {
  const meta = LEVEL_META[log.level];
  const ts = fmt(log.timestamp);
  const parsed = tryParse(log.message);
  const hasMeta = !!(log.module || log.function || parsed || log.extra);

  const [copied, setCopied] = useState(false);
  const copyLog = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      {/* Main row */}
      <div
        onClick={hasMeta ? onToggle : undefined}
        className={`
          flex items-start gap-3 px-4 py-2.5 border-b border-zinc-800/60 transition-all select-none
          ${hasMeta ? "cursor-pointer" : "cursor-default"}
          ${isExpanded ? "bg-zinc-800/60" : `${meta.bg} dark:${meta.bg}`}
        `}
      >
        {/* Left accent bar */}
        <div className={`w-0.5 self-stretch rounded-full ${meta.bar} flex-shrink-0 opacity-80`} />

        {/* Chevron */}
        <div className="w-4 flex-shrink-0 flex items-center justify-center pt-0.5">
          {hasMeta ? (
            <Icon
              icon={isExpanded ? "solar:alt-arrow-down-linear" : "solar:alt-arrow-right-linear"}
              width={12}
              className="text-zinc-500"
            />
          ) : (
            <span className="w-3 h-3" />
          )}
        </div>

        {/* Level badge */}
        <span className={`flex-shrink-0 text-[10px] font-bold tracking-wider ${meta.color} w-12`}>
          {meta.label}
        </span>

        {/* Time */}
        <span className="flex-shrink-0 text-[10px] font-mono text-zinc-500 pt-0.5 w-24">
          {ts.time}<span className="text-zinc-700">.{ts.ms}</span>
        </span>

        {/* Module badge */}
        {log.module && (
          <span className="flex-shrink-0 text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono hidden sm:block">
            {log.module}{log.function ? `::${log.function}` : ""}
          </span>
        )}

        {/* Message */}
        <span className={`flex-1 text-xs font-mono leading-relaxed truncate ${isExpanded ? "text-white" : "text-zinc-300"}`}>
          {log.message}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={copyLog}
            title="Скопировать"
            className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700 transition-all"
          >
            <Icon icon={copied ? "solar:check-circle-linear" : "solar:copy-linear"} width={13} className={copied ? "text-emerald-400" : ""} />
          </button>
        </div>
      </div>

      {/* Expanded detail panel */}
      {isExpanded && hasMeta && (
        <div className="bg-zinc-950 border-b border-zinc-800 px-4 py-3 font-mono text-xs relative">
          {/* Copy button in detail */}
          <button
            onClick={copyLog}
            className="absolute top-3 right-4 flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Icon icon={copied ? "solar:check-circle-linear" : "solar:copy-line-duotone"} width={13} className={copied ? "text-emerald-400" : ""} />
            {copied ? "Скопировано" : "Копировать"}
          </button>

          <div className="space-y-3">
            {/* Metadata row */}
            <div className="flex flex-wrap gap-4 text-zinc-500">
              <span>
                <span className="text-zinc-600">ID: </span>
                <span className="text-zinc-400">{log.id}</span>
              </span>
              <span>
                <span className="text-zinc-600">Время: </span>
                <span className="text-zinc-400">{ts.date} {ts.time}.{ts.ms}</span>
              </span>
              {log.module && (
                <span>
                  <span className="text-zinc-600">Модуль: </span>
                  <span className="text-sky-400">{log.module}</span>
                </span>
              )}
              {log.function && (
                <span>
                  <span className="text-zinc-600">Функция: </span>
                  <span className="text-violet-400">{log.function}</span>
                </span>
              )}
            </div>

            {/* Message (if JSON) */}
            {parsed ? (
              <div>
                <div className="text-[10px] text-zinc-600 font-sans mb-1 uppercase tracking-wider">Сообщение (JSON)</div>
                <JsonTree data={parsed} depth={0} />
              </div>
            ) : (
              <div>
                <div className="text-[10px] text-zinc-600 font-sans mb-1 uppercase tracking-wider">Сообщение</div>
                <span className="text-zinc-200 whitespace-pre-wrap break-all">{log.message}</span>
              </div>
            )}

            {/* Extra data */}
            {log.extra && (
              <div>
                <div className="text-[10px] text-zinc-600 font-sans mb-1 uppercase tracking-wider">Детали</div>
                <JsonTree data={log.extra} depth={0} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<Level | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"table" | "terminal">("table");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const connectToLogs = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const url = `${API_BASE}/api/v1/admin/logs/stream`;
    fetchSSE(
      url,
      "log",
      (entry) => setLogs((prev) => [...prev, entry].slice(-1000)),
      () => setIsConnected(true),
      () => {
        setIsConnected(false);
        setTimeout(() => { if (!ctrl.signal.aborted) connectToLogs(); }, 3000);
      },
      ctrl.signal,
    );
  }, []);

  useEffect(() => {
    connectToLogs();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [connectToLogs]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filter !== "ALL" && log.level !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          log.message.toLowerCase().includes(q) ||
          (log.module?.toLowerCase().includes(q) ?? false) ||
          (log.function?.toLowerCase().includes(q) ?? false) ||
          log.level.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, filter, search]);

  const levelCounts = useMemo(() =>
    logs.reduce((acc, l) => ({ ...acc, [l.level]: (acc[l.level] ?? 0) + 1 }), {} as Record<string, number>),
    [logs]
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const collapseAll = () => setExpandedIds(new Set());
  const expandAll = () => setExpandedIds(new Set(filteredLogs.map((l) => l.id)));

  return (
    <div className="p-4 md:p-8 space-y-5">
      <AdminPageHeader
        title="Логи сервера"
        subtitle="Real-time мониторинг"
        helpText="Потоковые логи бэкенд-сервера: API запросы, WebSocket, OCPP, ошибки."
      />

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["DEBUG", "INFO", "WARNING", "ERROR"] as const).map((lvl) => {
          const m = LEVEL_META[lvl];
          const count = levelCounts[lvl] ?? 0;
          return (
            <button
              key={lvl}
              onClick={() => setFilter(filter === lvl ? "ALL" : lvl)}
              className={`
                relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
                ${filter === lvl
                  ? `border-transparent ${m.bar.replace("bg-", "bg-").replace("-500", "-500/20")} ring-1 ring-inset ring-current`
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
                }
              `}
              style={filter === lvl ? { color: undefined } : undefined}
            >
              <div className={`w-1 self-stretch rounded-full ${m.bar} flex-shrink-0`} />
              <div className="text-left">
                <div className={`text-xs font-bold ${m.color}`}>{m.label}</div>
                <div className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{count}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[180px] relative">
          <Icon icon="solar:magnifer-linear" width={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Поиск по логам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/40 text-zinc-900 dark:text-white placeholder-zinc-400 transition-all"
          />
        </div>

        {/* Connection  */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${isConnected
            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
            : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400"
          }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
          {isConnected ? "Online" : "Reconnecting..."}
        </div>

        {/* View toggle */}
        <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 gap-1">
          {(["table", "terminal"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${view === v ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
            >
              <Icon icon={v === "table" ? "solar:table-2-linear" : "solar:terminal-linear"} width={14} />
              {v === "table" ? "Таблица" : "Терминал"}
            </button>
          ))}
        </div>

        {/* Expand/collapse */}
        {view === "table" && (
          <>
            <button
              onClick={expandAll}
              className="px-3 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-1.5"
            >
              <Icon icon="solar:alt-arrow-down-linear" width={14} />
              Раскрыть все
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-1.5"
            >
              <Icon icon="solar:alt-arrow-up-linear" width={14} />
              Свернуть все
            </button>
          </>
        )}

        {/* Auto-scroll & clear */}
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${autoScroll
              ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
        >
          <Icon icon="solar:arrow-down-linear" width={14} />
          Автоскролл
        </button>
        <button
          onClick={() => { setLogs([]); setExpandedIds(new Set()); }}
          className="p-2 rounded-xl text-zinc-500 hover:text-red-500 dark:hover:text-red-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
          title="Очистить логи"
        >
          <Icon icon="solar:trash-bin-linear" width={16} />
        </button>
      </div>

      {/* Logs Panel */}
      <div className="bg-zinc-900 dark:bg-black/80 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col" style={{ height: "calc(100vh - 380px)", minHeight: "400px" }}>

        {/* Table header (only in table mode) */}
        {view === "table" && (
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800 bg-zinc-800/60 text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
            <div className="w-0.5 flex-shrink-0" />
            <div className="w-4 flex-shrink-0" />
            <div className="w-12">Уровень</div>
            <div className="w-24">Время</div>
            <div className="hidden sm:block w-32">Модуль</div>
            <div className="flex-1">Сообщение</div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-3">
              <Icon icon="solar:inbox-linear" width={40} />
              <p className="text-sm">
                {search ? "Ничего не найдено" : isConnected ? "Ожидание логов..." : "Подключение к серверу..."}
              </p>
            </div>
          ) : view === "table" ? (
            <div className="group/list">
              {filteredLogs.map((log) => (
                <div key={log.id} className="group">
                  <LogRow
                    log={log}
                    isExpanded={expandedIds.has(log.id)}
                    onToggle={() => toggleExpand(log.id)}
                  />
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          ) : (
            <div className="p-4 space-y-1 font-mono text-xs">
              {filteredLogs.map((log) => {
                const m = LEVEL_META[log.level];
                const ts = fmt(log.timestamp);
                return (
                  <div key={log.id} className="flex items-baseline gap-2 leading-relaxed">
                    <span className="text-zinc-600 flex-shrink-0">{ts.time}</span>
                    <span className={`font-bold flex-shrink-0 w-12 ${m.color}`}>{m.label}</span>
                    {log.module && <span className="text-zinc-600 flex-shrink-0 hidden sm:inline">[{log.module}]</span>}
                    <span className="text-zinc-300 break-all">{log.message}</span>
                  </div>
                );
              })}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 px-4 py-2 flex items-center justify-between text-xs text-zinc-600 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span>{isConnected ? "SSE активен" : "Переподключение..."}</span>
          </div>
          <span className="tabular-nums">{filteredLogs.length} из {logs.length} записей</span>
        </div>
      </div>
    </div>
  );
}
