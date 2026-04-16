import { Icon } from "@iconify/react";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: string;
  className?: string;
}

export function FilterSelect({
  label,
  options,
  value,
  onChange,
  icon = "solar:filter-linear",
  className = "w-full md:w-48",
}: FilterSelectProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="w-full appearance-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-4 pr-10 py-2.5 text-sm text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <Icon icon={icon} width={16} className="text-zinc-400" />
      </div>
    </div>
  );
}

interface AdminFilterBarProps {
  children: React.ReactNode;
}

export function AdminFilterBar({ children }: AdminFilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3">{children}</div>
  );
}
