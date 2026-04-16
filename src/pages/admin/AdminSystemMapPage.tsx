/**
 * Admin System Map v2 — Live Architecture Visualization
 *
 * SVG-canvas with animated data packets, curved bezier connections,
 * hover popups with request details, Framer Motion staggered entry,
 * glow effects, and blueprint-style background grid.
 *
 * In demo mode: shows simulated data with DEMO badge
 * In production: fetches real data from admin APIs
 */

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { fetchJson } from "@/api/unifiedClient";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { useAdminAnalyticsOverview } from "@/features/admin/hooks/useAdminAnalytics";
import { demoStations } from "@/shared/demo/demoData";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NodeDef {
  id: string;
  label: string;
  icon: string;
  iconColor: string;
  x: number; // % of canvas width
  y: number; // % of canvas height
}

interface SampleRequest {
  method: string;
  path: string;
  status: number;
  time: string;
}

interface ConnectionDef {
  id: string;
  from: string;
  to: string;
  label: string;
  protocol: string;
  color: string;
  packetCount: number;
  bidirectional: boolean;
  samples: SampleRequest[];
}

interface NodeMetrics {
  status: "online" | "warning" | "error" | "neutral";
  pulse: boolean;
  metrics: { label: string; value: string | number }[];
}

/* ------------------------------------------------------------------ */
/*  Canvas Constants                                                   */
/* ------------------------------------------------------------------ */

const CANVAS_W = 1200;
const CANVAS_H = 920;

/* ------------------------------------------------------------------ */
/*  Node Positions                                                     */
/* ------------------------------------------------------------------ */

const NODE_DEFS: NodeDef[] = [
  { id: "clients", label: "Клиенты", icon: "solar:users-group-two-rounded-bold-duotone", iconColor: "text-blue-500", x: 10, y: 8 },
  { id: "cars", label: "Электромобили", icon: "solar:electric-refueling-bold-duotone", iconColor: "text-lime-500", x: 85, y: 8 },
  { id: "pwa", label: "PWA Приложение", icon: "solar:smartphone-bold-duotone", iconColor: "text-violet-500", x: 10, y: 26 },
  { id: "stations", label: "Зарядные станции", icon: "solar:charging-socket-bold-duotone", iconColor: "text-emerald-500", x: 85, y: 26 },
  { id: "nginx", label: "Nginx Прокси", icon: "solar:shield-network-bold-duotone", iconColor: "text-emerald-500", x: 48, y: 42 },
  { id: "api", label: "FastAPI", icon: "solar:server-bold-duotone", iconColor: "text-amber-500", x: 15, y: 60 },
  { id: "redis", label: "Redis", icon: "solar:database-bold-duotone", iconColor: "text-red-500", x: 48, y: 60 },
  { id: "ocpp", label: "OCPP Сервер", icon: "solar:bolt-circle-bold-duotone", iconColor: "text-yellow-500", x: 82, y: 60 },
  { id: "postgres", label: "PostgreSQL", icon: "solar:database-bold-duotone", iconColor: "text-blue-600", x: 48, y: 80 },
  { id: "payment", label: "Оплата API", icon: "solar:card-bold-duotone", iconColor: "text-green-500", x: 15, y: 94 },
  { id: "sms", label: "SMS Провайдер", icon: "solar:letter-bold-duotone", iconColor: "text-cyan-500", x: 82, y: 94 },
];

/* ------------------------------------------------------------------ */
/*  Connection Definitions                                             */
/* ------------------------------------------------------------------ */

const CONNECTION_DEFS: ConnectionDef[] = [
  {
    id: "clients-pwa", from: "clients", to: "pwa",
    label: "Действия", protocol: "UI Events",
    color: "#3b82f6", packetCount: 2, bidirectional: true,
    samples: [
      { method: "TAP", path: "Open Map", status: 200, time: "client" },
      { method: "BTN", path: "Start Charging", status: 200, time: "client" },
    ],
  },
  {
    id: "cars-stations", from: "cars", to: "stations",
    label: "Зарядка", protocol: "CCS2 / GBT",
    color: "#eab308", packetCount: 1, bidirectional: true,
    samples: [
      { method: "DC", path: "CCS2 120kW", status: 200, time: "active" },
      { method: "AC", path: "GB/T 22kW", status: 200, time: "active" },
    ],
  },
  {
    id: "pwa-nginx", from: "pwa", to: "nginx",
    label: "API & Assets", protocol: "HTTPS TLS 1.3",
    color: "#8b5cf6", packetCount: 3, bidirectional: true,
    samples: [
      { method: "GET", path: "/api/v1/sessions", status: 200, time: "45ms" },
      { method: "POST", path: "/api/v1/start", status: 200, time: "89ms" },
    ],
  },
  {
    id: "stations-nginx", from: "stations", to: "nginx",
    label: "OCPP WSS", protocol: "WSS / TLS 1.2",
    color: "#eab308", packetCount: 2, bidirectional: true,
    samples: [
      { method: "WSS", path: "/ws/{station_id}", status: 101, time: "12ms" },
      { method: "PING", path: "Keep-Alive", status: 200, time: "5ms" },
    ],
  },
  {
    id: "nginx-api", from: "nginx", to: "api",
    label: "HTTP Прокси", protocol: "HTTP/1.1",
    color: "#10b981", packetCount: 3, bidirectional: true,
    samples: [
      { method: "POST", path: "/auth/sms/verify", status: 200, time: "89ms" },
      { method: "GET", path: "/locations", status: 200, time: "45ms" },
      { method: "POST", path: "/charging/start", status: 200, time: "340ms" },
    ],
  },
  {
    id: "nginx-ocpp", from: "nginx", to: "ocpp",
    label: "WS Прокси", protocol: "WS UPGRADE",
    color: "#eab308", packetCount: 2, bidirectional: true,
    samples: [
      { method: "WS", path: "/ws/{station_id}", status: 101, time: "2ms" },
      { method: "DATA", path: "MeterValues", status: 200, time: "1ms" },
    ],
  },
  {
    id: "api-redis", from: "api", to: "redis",
    label: "Кэш & Шина", protocol: "RESPv3",
    color: "#ef4444", packetCount: 3, bidirectional: true,
    samples: [
      { method: "PUB", path: "ocpp:cmd:EVP-001", status: 200, time: "2ms" },
      { method: "GET", path: "session:active", status: 200, time: "1ms" },
    ],
  },
  {
    id: "ocpp-redis", from: "ocpp", to: "redis",
    label: "Команды", protocol: "RESPv3",
    color: "#ef4444", packetCount: 2, bidirectional: true,
    samples: [
      { method: "SUB", path: "ocpp:cmd:*", status: 200, time: "1ms" },
      { method: "SET", path: "station:online", status: 200, time: "1ms" },
    ],
  },
  {
    id: "api-postgres", from: "api", to: "postgres",
    label: "ORM Запросы", protocol: "PostgreSQL Wire",
    color: "#3b82f6", packetCount: 4, bidirectional: true,
    samples: [
      { method: "SELECT", path: "users (idx_scan)", status: 200, time: "4ms" },
      { method: "INSERT", path: "charging_sessions", status: 201, time: "8ms" },
      { method: "UPDATE", path: "users.balance", status: 200, time: "5ms" },
    ],
  },
  {
    id: "ocpp-postgres", from: "ocpp", to: "postgres",
    label: "Логи OCPP", protocol: "PostgreSQL Wire",
    color: "#6366f1", packetCount: 2, bidirectional: false,
    samples: [
      { method: "INSERT", path: "ocpp_messages", status: 201, time: "6ms" },
      { method: "UPDATE", path: "station_status", status: 200, time: "4ms" },
    ],
  },
  {
    id: "api-payment", from: "api", to: "payment",
    label: "Списания API", protocol: "HTTPS REST",
    color: "#10b981", packetCount: 1, bidirectional: false,
    samples: [
      { method: "POST", path: "/topup-qr (O!Dengi)", status: 200, time: "450ms" },
      { method: "POST", path: "/topup-card (OBANK)", status: 200, time: "320ms" },
    ],
  },
  {
    id: "api-sms", from: "api", to: "sms",
    label: "Отправка OTP", protocol: "HTTPS XML/JSON",
    color: "#06b6d4", packetCount: 1, bidirectional: false,
    samples: [
      { method: "POST", path: "Nikita SMS (OTP)", status: 200, time: "800ms" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Utility: compute SVG cubic bezier path                             */
/* ------------------------------------------------------------------ */

function computePath(from: NodeDef, to: NodeDef): string {
  const sx = (from.x / 100) * CANVAS_W;
  const sy = (from.y / 100) * CANVAS_H;
  const tx = (to.x / 100) * CANVAS_W;
  const ty = (to.y / 100) * CANVAS_H;
  const my = (sy + ty) / 2;
  return `M ${sx},${sy} C ${sx},${my} ${tx},${my} ${tx},${ty}`;
}

function computeReversePath(from: NodeDef, to: NodeDef): string {
  const sx = (from.x / 100) * CANVAS_W;
  const sy = (from.y / 100) * CANVAS_H;
  const tx = (to.x / 100) * CANVAS_W;
  const ty = (to.y / 100) * CANVAS_H;
  const my = (sy + ty) / 2;
  return `M ${tx},${ty} C ${tx},${my} ${sx},${my} ${sx},${sy}`;
}

function getMidpoint(from: NodeDef, to: NodeDef): { x: number; y: number } {
  return {
    x: ((from.x + to.x) / 2 / 100) * CANVAS_W,
    y: ((from.y + to.y) / 2 / 100) * CANVAS_H,
  };
}

/* ------------------------------------------------------------------ */
/*  Hook: Online stations (real or demo)                               */
/* ------------------------------------------------------------------ */

const OnlineStationsSchema = z
  .object({
    stations: z.array(z.object({
      station_id: z.string(),
      serial_number: z.string().optional(),
      status: z.string().optional(),
      last_heartbeat: z.string().nullable().optional(),
    })).optional(),
    count: z.number().optional(),
  })
  .passthrough();

function useOnlineStations() {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "stations", "online"],
    queryFn: async () => {
      if (isDemoModeActive()) {
        const online = demoStations.filter((s) => s.status === "online" || s.status === "charging");
        return {
          stations: online.map((s) => ({
            station_id: s.id,
            serial_number: s.serial_number,
            status: s.status,
            last_heartbeat: s.last_heartbeat,
          })),
          count: online.length,
        };
      }
      return fetchJson("/api/v1/admin/logs/stations/online", { method: "GET" }, OnlineStationsSchema);
    },
    enabled: isAuthenticated,
    refetchInterval: 10_000,
    staleTime: 5_000,
    retry: 1,
  });
}

/* ------------------------------------------------------------------ */
/*  Hook: Active sessions                                              */
/* ------------------------------------------------------------------ */

const ActiveSessionsSchema = z.object({
  success: z.boolean(),
  data: z.array(z.object({ status: z.string() }).passthrough()),
  total: z.number(),
}).passthrough();

function useActiveSessions() {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "sessions", "active-count"],
    queryFn: async () => {
      if (isDemoModeActive()) {
        return { total: 8, charging: 6, started: 2 };
      }
      const res = await fetchJson(
        "/api/v1/admin/sessions?status=started&limit=1&offset=0",
        { method: "GET" },
        ActiveSessionsSchema,
      );
      return { total: res.total, charging: res.total, started: 0 };
    },
    enabled: isAuthenticated,
    refetchInterval: 15_000,
    staleTime: 10_000,
    retry: 1,
  });
}

/* ------------------------------------------------------------------ */
/*  Hook: Canvas scale (responsive)                                    */
/* ------------------------------------------------------------------ */

function useCanvasScale() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setScale(Math.min(1, w / CANVAS_W));
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return { containerRef, scale };
}

/* ------------------------------------------------------------------ */
/*  StatusDot                                                          */
/* ------------------------------------------------------------------ */

const statusColors: Record<string, string> = {
  online: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  neutral: "bg-zinc-400",
};

function StatusDot({ status, pulse }: { status: string; pulse?: boolean }) {
  const color = statusColors[status] || statusColors["neutral"];
  return (
    <span className="relative flex h-2.5 w-2.5">
      {pulse && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  SystemNode — Framer Motion entry + breathing glow                  */
/* ------------------------------------------------------------------ */

const glowColors: Record<string, string> = {
  online: "0 0 18px rgba(16,185,129,0.25)",
  warning: "0 0 18px rgba(245,158,11,0.25)",
  error: "0 0 18px rgba(239,68,68,0.25)",
  neutral: "none",
};

function SystemNode({
  node,
  nodeMetrics,
  index,
  highlighted,
}: {
  node: NodeDef;
  nodeMetrics: NodeMetrics;
  index: number;
  highlighted: boolean;
}) {
  const { status, pulse, metrics } = nodeMetrics;
  const borderClass =
    status === "online" ? "border-emerald-500/40 dark:border-emerald-500/30" :
      status === "warning" ? "border-amber-500/40 dark:border-amber-500/30" :
        status === "error" ? "border-red-500/40 dark:border-red-500/30" :
          "border-zinc-300 dark:border-zinc-700";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{
        opacity: 1,
        scale: highlighted ? 1.06 : 1,
        y: 0,
        boxShadow: pulse
          ? [glowColors[status], "0 0 30px rgba(16,185,129,0.35)", glowColors[status]]
          : glowColors[status] || "none",
      }}
      transition={{
        opacity: { delay: index * 0.08, duration: 0.5 },
        scale: { delay: index * 0.08, type: "spring", stiffness: 260, damping: 20 },
        y: { delay: index * 0.08, type: "spring", stiffness: 260, damping: 20 },
        boxShadow: pulse ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 },
      }}
      style={{
        position: "absolute",
        left: `${node.x}%`,
        top: `${node.y}%`,
        transform: "translate(-50%, -50%)",
        width: 180,
      }}
      className={`
        bg-white dark:bg-zinc-900 rounded-xl border-2 p-3 cursor-default select-none
        shadow-sm dark:shadow-none transition-colors
        ${borderClass}
        ${highlighted ? "ring-2 ring-white/50 dark:ring-white/20 z-10" : ""}
      `}
    >
      <div className="absolute -top-1 -left-1">
        <StatusDot status={status} pulse={pulse} />
      </div>

      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
          <Icon icon={node.icon} width={20} className={node.iconColor} />
        </div>
        <p className="text-xs font-semibold text-zinc-900 dark:text-white leading-tight">{node.label}</p>
      </div>

      <div className="space-y-1">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center justify-between text-[10px]">
            <span className="text-zinc-500 dark:text-zinc-400">{m.label}</span>
            <span className="font-mono font-medium text-zinc-900 dark:text-white">{m.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  AnimatedConnection — SVG path + glow + animated packets            */
/* ------------------------------------------------------------------ */

function AnimatedConnection({
  conn,
  fromNode,
  toNode,
  active,
  hovered,
  onHover,
  onLeave,
}: {
  conn: ConnectionDef;
  fromNode: NodeDef;
  toNode: NodeDef;
  active: boolean;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const pathD = computePath(fromNode, toNode);
  const dur = 2.5 + conn.packetCount * 0.3; // slower for more packets
  const opacity = active ? (hovered ? 1 : 0.7) : 0.2;

  return (
    <g>
      {/* Glow layer */}
      {active && (
        <path
          d={pathD}
          fill="none"
          stroke={conn.color}
          strokeWidth={hovered ? 6 : 4}
          opacity={hovered ? 0.4 : 0.15}
          filter="url(#glow)"
          className="transition-all duration-300"
        />
      )}

      {/* Main visible path */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={conn.color}
        strokeWidth={hovered ? 2.5 : 1.5}
        strokeDasharray={active ? "none" : "6 4"}
        opacity={opacity}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
        className="transition-all duration-300"
      />

      {/* Invisible hit area for hover */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        style={{ cursor: "pointer" }}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      />

      {/* Forward packets */}
      {active && Array.from({ length: conn.packetCount }).map((_, i) => {
        const offset = -(i * dur) / conn.packetCount;
        return (
          <g key={`fwd-${i}`}>
            {/* Comet tail */}
            <circle r={5} fill={conn.color} opacity={0.15}>
              <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${offset + 0.12}s`} path={pathD} />
            </circle>
            {/* Main packet */}
            <circle r={3} fill={conn.color} opacity={0.9}>
              <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${offset}s`} path={pathD} />
            </circle>
          </g>
        );
      })}

      {/* Reverse packets (for bidirectional) */}
      {active && conn.bidirectional && Array.from({ length: Math.max(1, conn.packetCount - 1) }).map((_, i) => {
        const revPath = computeReversePath(fromNode, toNode);
        const revDur = dur + 0.5;
        const offset = -(i * revDur) / Math.max(1, conn.packetCount - 1);
        return (
          <g key={`rev-${i}`}>
            <circle r={5} fill={conn.color} opacity={0.1}>
              <animateMotion dur={`${revDur}s`} repeatCount="indefinite" begin={`${offset + 0.12}s`} path={revPath} />
            </circle>
            <circle r={2.5} fill={conn.color} opacity={0.5}>
              <animateMotion dur={`${revDur}s`} repeatCount="indefinite" begin={`${offset}s`} path={revPath} />
            </circle>
          </g>
        );
      })}

      {/* Protocol label at midpoint */}
      {(() => {
        const mid = getMidpoint(fromNode, toNode);
        return (
          <g>
            <rect
              x={mid.x - 36}
              y={mid.y - 8}
              width={72}
              height={16}
              rx={4}
              fill={hovered ? conn.color : "rgba(24,24,27,0.8)"}
              opacity={hovered ? 0.9 : 0.7}
              className="transition-all duration-300"
            />
            <text
              x={mid.x}
              y={mid.y + 4}
              textAnchor="middle"
              fill="white"
              fontSize={8}
              fontFamily="monospace"
              fontWeight={600}
            >
              {conn.label}
            </text>
          </g>
        );
      })()}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  ConnectionPopup — hover card with live request log                 */
/* ------------------------------------------------------------------ */

function ConnectionPopup({
  conn,
  fromNode,
  toNode,
}: {
  conn: ConnectionDef;
  fromNode: NodeDef;
  toNode: NodeDef;
  scale: number;
}) {
  const mid = getMidpoint(fromNode, toNode);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 5 }}
      transition={{ duration: 0.15 }}
      className="absolute pointer-events-none z-30"
      style={{
        left: mid.x,
        top: mid.y - 20,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="bg-zinc-900/95 border border-zinc-700 rounded-lg p-3 shadow-xl min-w-[220px] backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-white">{conn.label}</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold"
            style={{ backgroundColor: conn.color + "30", color: conn.color }}
          >
            {conn.protocol}
          </span>
        </div>

        <div className="flex items-center gap-1 mb-2 text-[10px] text-zinc-400">
          <span>{fromNode.label}</span>
          <span>{conn.bidirectional ? "<->" : "->"}</span>
          <span>{toNode.label}</span>
        </div>

        <div className="space-y-1">
          {conn.samples.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              <span
                className="px-1 py-0.5 rounded font-mono font-bold text-[9px]"
                style={{
                  backgroundColor:
                    s.method === "GET" || s.method === "SELECT" ? "#3b82f620" :
                      s.method === "POST" || s.method === "INSERT" ? "#10b98120" :
                        s.method === "WS" || s.method === "SUB" || s.method === "PUB" ? "#eab30820" :
                          "#6366f120",
                  color:
                    s.method === "GET" || s.method === "SELECT" ? "#60a5fa" :
                      s.method === "POST" || s.method === "INSERT" ? "#34d399" :
                        s.method === "WS" || s.method === "SUB" || s.method === "PUB" ? "#fbbf24" :
                          "#a5b4fc",
                }}
              >
                {s.method}
              </span>
              <span className="text-zinc-300 font-mono truncate flex-1">{s.path}</span>
              <span className="text-emerald-400 font-mono">{s.status}</span>
              <span className="text-zinc-500 font-mono">{s.time}</span>
            </div>
          ))}
        </div>

        <div className="mt-2 pt-1.5 border-t border-zinc-700/50 flex items-center gap-2 text-[9px] text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: conn.color }} />
            {conn.packetCount} пакетов/цикл
          </span>
          {conn.bidirectional && <span>Двусторонний</span>}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  LiveStatsBar                                                       */
/* ------------------------------------------------------------------ */

function LiveStatsBar({
  totalStations,
  onlineCount,
  activeSessions,
  todayEnergy,
  todayRevenue,
  requestCount,
}: {
  totalStations: number;
  onlineCount: number;
  activeSessions: number;
  todayEnergy: number;
  todayRevenue: number;
  requestCount: number;
}) {
  const items = [
    { value: totalStations, label: "Станции", color: "text-white" },
    { value: onlineCount, label: "Онлайн", color: "text-emerald-400" },
    { value: activeSessions, label: "Зарядка", color: "text-blue-400" },
    { value: Math.round(todayEnergy), label: "кВтч сегодня", color: "text-amber-400" },
    { value: Math.round(todayRevenue), label: "KGS сегодня", color: "text-green-400" },
    { value: requestCount, label: "Запросы", color: "text-violet-400" },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {items.map((item, i) => (
            <div key={i} className="text-center">
              <p className={`text-lg sm:text-xl font-bold font-mono ${item.color}`}>{item.value}</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  OnlineStationsList                                                 */
/* ------------------------------------------------------------------ */

function OnlineStationsList({
  stations,
  isDemo,
}: {
  stations: { station_id: string; serial_number?: string; status?: string }[];
  isDemo: boolean;
}) {
  if (!stations.length) return null;

  return (
    <div className="mt-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <StatusDot status="online" pulse />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          Станции онлайн ({stations.length})
        </h3>
        {isDemo && (
          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 rounded">
            DEMO
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {stations.slice(0, 24).map((s) => (
          <div
            key={s.station_id}
            className={`
              flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border
              ${s.status === "charging"
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
              }
            `}
          >
            <StatusDot status={s.status === "charging" ? "warning" : "online"} pulse={s.status === "charging"} />
            <span className="font-mono text-zinc-700 dark:text-zinc-300 truncate text-[11px]">
              {s.serial_number || s.station_id}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Legend                                                             */
/* ------------------------------------------------------------------ */

function Legend({ isDemo }: { isDemo: boolean }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
      <div className="flex items-center gap-1.5">
        <StatusDot status="online" /> <span>Онлайн</span>
      </div>
      <div className="flex items-center gap-1.5">
        <StatusDot status="warning" /> <span>Предупреждение</span>
      </div>
      <div className="flex items-center gap-1.5">
        <StatusDot status="error" /> <span>Ошибка</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-6 h-0.5 bg-emerald-500 rounded" /> <span>Активное соединение</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-6 h-0.5 bg-zinc-500 rounded border-dashed border-t border-zinc-400" /> <span>Неактивно</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> <span>Пакет данных</span>
      </div>
      {isDemo && (
        <div className="flex items-center gap-1.5">
          <Icon icon="solar:test-tube-bold" width={14} className="text-amber-500" />
          <span className="text-amber-500">Симуляция</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export function AdminSystemMapPage() {
  const isDemo = isDemoModeActive();
  const { containerRef, scale } = useCanvasScale();
  const [hoveredConn, setHoveredConn] = useState<string | null>(null);
  const [requestCount, setRequestCount] = useState(0);

  // Live request counter simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setRequestCount((c) => c + Math.floor(Math.random() * 5) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Real data hooks
  const { data: analyticsData } = useAdminAnalyticsOverview();
  const { data: onlineData } = useOnlineStations();
  const { data: sessionsData } = useActiveSessions();

  const stats = analyticsData?.data;
  const onlineCount = onlineData?.count ?? 0;
  const totalStations = stats?.total_stations ?? (isDemo ? 35 : 0);
  const activeSessions = sessionsData?.total ?? 0;
  const todayRevenue = stats?.revenue_today ?? 0;
  const todayEnergy = stats?.energy_today ?? 0;
  const totalClients = stats?.active_users ?? (isDemo ? 1247 : 0);

  // Node lookup map
  const nodeMap = useMemo(() => {
    const m: Record<string, NodeDef> = {};
    for (const n of NODE_DEFS) m[n.id] = n;
    return m;
  }, []);

  // Node runtime metrics
  const nodeMetricsMap = useMemo((): Record<string, NodeMetrics> => ({
    clients: {
      status: "online", pulse: activeSessions > 0,
      metrics: [
        { label: "Всего", value: totalClients },
        { label: "Активных", value: activeSessions },
      ],
    },
    cars: {
      status: activeSessions > 0 ? "online" : "neutral", pulse: activeSessions > 0,
      metrics: [
        { label: "Заряжается", value: activeSessions },
        { label: "кВтч сегодня", value: todayEnergy.toFixed(1) },
      ],
    },
    pwa: {
      status: "online", pulse: false,
      metrics: [
        { label: "Стек", value: "React + Vite" },
        { label: "Хост", value: "VPS Nginx" },
      ],
    },
    nginx: {
      status: "online", pulse: true,
      metrics: [
        { label: "SSL", value: "Let's Encrypt" },
        { label: "Порт", value: "443 -> 9210" },
      ],
    },
    api: {
      status: "online", pulse: true,
      metrics: [
        { label: "Эндпоинты", value: "150+" },
        { label: "Сессии", value: stats?.sessions_today ?? 0 },
      ],
    },
    ocpp: {
      status: onlineCount > 0 ? "online" : "warning", pulse: onlineCount > 0,
      metrics: [
        { label: "Протокол", value: "1.6J + 2.0.1" },
        { label: "Онлайн", value: onlineCount },
      ],
    },
    postgres: {
      status: "online", pulse: false,
      metrics: [
        { label: "Хост", value: "Supabase" },
        { label: "Таблицы", value: "34" },
        { label: "RLS", value: "Активен" },
      ],
    },
    redis: {
      status: "online", pulse: false,
      metrics: [
        { label: "Роль", value: "Pub/Sub + Кэш" },
        { label: "WS relay", value: "Да" },
      ],
    },
    stations: {
      status: onlineCount > 0 ? "online" : "warning", pulse: activeSessions > 0,
      metrics: [
        { label: "Всего", value: totalStations },
        { label: "Онлайн", value: onlineCount },
        { label: "Заряжается", value: activeSessions },
      ],
    },
    payment: {
      status: "online", pulse: false,
      metrics: [
        { label: "OBANK", value: "H2H" },
        { label: "O!Dengi", value: "QR" },
        { label: "Выручка", value: `${todayRevenue.toFixed(0)} сом` },
      ],
    },
    sms: {
      status: "online", pulse: false,
      metrics: [
        { label: "Провайдер", value: "Nikita SMS" },
        { label: "OTP", value: "6 цифр" },
      ],
    },
  }), [stats, onlineCount, activeSessions, totalStations, todayRevenue, todayEnergy, totalClients]);

  // Connection activity state
  const isConnectionActive = useCallback(
    (conn: ConnectionDef): boolean => {
      if (conn.id === "cars-stations" || conn.id === "stations-nginx" || conn.id === "nginx-ocpp") return onlineCount > 0 || activeSessions > 0;
      return true;
    },
    [onlineCount, activeSessions],
  );

  // Highlighted nodes (from hovered connection)
  const highlightedNodes = useMemo<Set<string>>(() => {
    if (!hoveredConn) return new Set();
    const conn = CONNECTION_DEFS.find((c) => c.id === hoveredConn);
    if (!conn) return new Set();
    return new Set([conn.from, conn.to]);
  }, [hoveredConn]);

  // Hovered connection data for popup
  const hoveredConnData = useMemo(() => {
    if (!hoveredConn) return null;
    return CONNECTION_DEFS.find((c) => c.id === hoveredConn) ?? null;
  }, [hoveredConn]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <AdminPageHeader
              title="Карта системы"
              helpText="Визуализация архитектуры в реальном времени. Наведите на соединения для просмотра деталей запросов."
              subtitle="Топология инфраструктуры и потоки данных"
            />
            {isDemo ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-full">
                <Icon icon="solar:test-tube-bold" width={16} className="text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">СИМУЛЯЦИЯ</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 rounded-full">
                <StatusDot status="online" pulse />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">ОНЛАЙН</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Stats Bar */}
      <LiveStatsBar
        totalStations={totalStations}
        onlineCount={onlineCount}
        activeSessions={activeSessions}
        todayEnergy={todayEnergy}
        todayRevenue={todayRevenue}
        requestCount={requestCount}
      />

      {/* Architecture Canvas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div ref={containerRef} className="relative overflow-x-hidden overflow-y-auto" style={{ height: Math.min(CANVAS_H * scale, 700), maxHeight: "70vh" }}>
          <div
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
            className="relative"
          >
            {/* SVG Layer — connections, grid, glow */}
            <svg
              className="absolute inset-0"
              width={CANVAS_W}
              height={CANVAS_H}
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              style={{ zIndex: 1 }}
            >
              <defs>
                {/* Glow filter */}
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Background grid pattern */}
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path
                    d="M 30 0 L 0 0 0 30"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-zinc-200 dark:text-zinc-800/50"
                  />
                </pattern>
                <pattern id="grid-lg" width="150" height="150" patternUnits="userSpaceOnUse">
                  <rect width="150" height="150" fill="url(#grid)" />
                  <path
                    d="M 150 0 L 0 0 0 150"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-zinc-300 dark:text-zinc-800/80"
                  />
                </pattern>
              </defs>

              {/* Background grid */}
              <rect width="100%" height="100%" fill="url(#grid-lg)" />

              {/* Connection paths */}
              {CONNECTION_DEFS.map((conn) => {
                const fromNode = nodeMap[conn.from]!;
                const toNode = nodeMap[conn.to]!;
                return (
                  <AnimatedConnection
                    key={conn.id}
                    conn={conn}
                    fromNode={fromNode}
                    toNode={toNode}
                    active={isConnectionActive(conn)}
                    hovered={hoveredConn === conn.id}
                    onHover={() => setHoveredConn(conn.id)}
                    onLeave={() => setHoveredConn(null)}
                  />
                );
              })}
            </svg>

            {/* HTML Layer — nodes */}
            <div className="absolute inset-0" style={{ zIndex: 2 }}>
              {NODE_DEFS.map((node, index) => (
                <SystemNode
                  key={node.id}
                  node={node}
                  nodeMetrics={nodeMetricsMap[node.id]!}
                  index={index}
                  highlighted={highlightedNodes.has(node.id)}
                />
              ))}
            </div>

            {/* Popup Layer — connection details */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
              <AnimatePresence>
                {hoveredConnData && (
                  <ConnectionPopup
                    key={hoveredConnData.id}
                    conn={hoveredConnData}
                    fromNode={nodeMap[hoveredConnData.from]!}
                    toNode={nodeMap[hoveredConnData.to]!}
                    scale={scale}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* Online Stations List */}
        {onlineData?.stations && onlineData.stations.length > 0 && (
          <OnlineStationsList stations={onlineData.stations} isDemo={isDemo} />
        )}

        {/* Legend */}
        <Legend isDemo={isDemo} />
      </div>
    </div>
  );
}
