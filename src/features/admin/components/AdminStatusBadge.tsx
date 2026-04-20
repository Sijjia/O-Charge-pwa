import { Icon } from "@iconify/react";

type BadgeVariant =
  | "online"
  | "offline"
  | "charging"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "neutral";

const variants: Record<
  BadgeVariant,
  { bg: string; text: string; border: string; dot?: string; icon?: string }
> = {
  online: {
    bg: "bg-emerald-100/50 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-500/20",
    dot: "bg-emerald-500 animate-pulse",
  },
  offline: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-200 dark:border-zinc-700",
    dot: "bg-zinc-400 dark:bg-zinc-500",
  },
  charging: {
    bg: "bg-amber-100/50 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-500/20",
    icon: "solar:bolt-circle-bold",
  },
  success: {
    bg: "bg-emerald-100/50 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-500/20",
    icon: "solar:check-circle-linear",
  },
  error: {
    bg: "bg-[#fff0f7] dark:bg-[#f0047f]/10",
    text: "text-[#f0047f] dark:text-[#f078b7]",
    border: "border-[#ffc2df] dark:border-[#5c0030]/30",
    icon: "solar:close-circle-linear",
  },
  warning: {
    bg: "bg-amber-100/50 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-500/20",
    icon: "solar:danger-triangle-linear",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-500/20",
    icon: "solar:info-circle-linear",
  },
  neutral: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-200 dark:border-zinc-700",
  },
};

interface AdminStatusBadgeProps {
  variant: BadgeVariant;
  label: string;
}

export function AdminStatusBadge({ variant, label }: AdminStatusBadgeProps) {
  const v = variants[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${v.bg} ${v.text} ${v.border}`}
    >
      {v.dot && <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />}
      {v.icon && <Icon icon={v.icon} width={14} />}
      {label}
    </span>
  );
}
