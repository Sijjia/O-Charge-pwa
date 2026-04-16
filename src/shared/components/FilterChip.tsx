import { type ReactNode } from "react";

interface FilterChipProps {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * Reusable filter chip — used on MapHome and any future filter rows.
 * Active state uses the brand red accent.
 */
export function FilterChip({
  label,
  icon,
  active = false,
  onClick,
  className = "",
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
        "whitespace-nowrap border transition-all duration-200 active:scale-95",
        active
          ? "bg-red-600 border-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.4)]"
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-red-500/40 hover:text-red-500",
        className,
      ].join(" ")}
      aria-pressed={active}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {label}
    </button>
  );
}
