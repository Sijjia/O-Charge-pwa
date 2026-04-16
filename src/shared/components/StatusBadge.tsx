import type { ReactNode } from "react";

type Kind = "connector" | "station" | "location";

interface StatusBadgeProps {
  kind: Kind;
  status: string;
  className?: string;
  icon?: ReactNode;
}

const LABELS: Record<Kind, Record<string, string>> = {
  connector: {
    available: "Свободен",
    occupied: "Занят",
    error: "Ошибка",
    maintenance: "Обслуживание",
  },
  station: {
    available: "Онлайн",
    offline: "Оффлайн",
    maintenance: "Обслуживание",
  },
  location: {
    healthy: "Доступна",
    degraded: "Частично",
    offline: "Оффлайн",
  },
};

const CLASSES: Record<Kind, Record<string, string>> = {
  connector: {
    available: "bg-green-500/15 text-green-400",
    occupied: "bg-orange-500/15 text-orange-400",
    error: "bg-red-500/15 text-red-400",
    maintenance: "bg-yellow-500/15 text-yellow-400",
  },
  station: {
    available: "bg-green-500/15 text-green-400",
    offline: "bg-zinc-800 text-gray-300",
    maintenance: "bg-yellow-500/15 text-yellow-400",
  },
  location: {
    healthy: "bg-green-500/15 text-green-400",
    degraded: "bg-yellow-500/15 text-yellow-400",
    offline: "bg-zinc-800 text-gray-300",
  },
};

export function StatusBadge({
  kind,
  status,
  className = "",
  icon,
}: StatusBadgeProps) {
  const normalized = (status || "").toLowerCase();
  const label = LABELS[kind][normalized] ?? status;
  const color = CLASSES[kind][normalized] ?? "bg-zinc-800 text-gray-300";
  return (
    <span
      className={`inline-flex items-center gap-2 px-2 py-1 text-xs font-medium rounded-full ${color} ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}
