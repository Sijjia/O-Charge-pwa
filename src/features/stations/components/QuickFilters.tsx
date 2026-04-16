import { Icon } from "@iconify/react";
import { FilterChip } from "@/shared/components/FilterChip";

export type StationFilter =
    | "all"
    | "available"
    | "fast"
    | "type2"
    | "ccs2"
    | "gbt";

interface QuickFiltersProps {
    /** Currently active filter */
    value: StationFilter;
    onChange: (filter: StationFilter) => void;
    /** Total visible station count */
    count?: number;
}

const FILTERS: { id: StationFilter; label: string; icon?: string }[] = [
    { id: "all", label: "Все" },
    { id: "available", label: "Свободные", icon: "solar:check-circle-bold" },
    { id: "fast", label: "DC ≥50 кВт", icon: "solar:bolt-bold" },
    { id: "type2", label: "Type 2" },
    { id: "ccs2", label: "CCS2" },
    { id: "gbt", label: "GB/T" },
];

/**
 * Horizontal scrollable fast-filter row for the map screen.
 * Shows filtered station count when a filter is active.
 */
export function QuickFilters({ value, onChange, count }: QuickFiltersProps) {
    return (
        <div className="flex items-center gap-2">
            {/* Scrollable chips */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5 min-w-0">
                {FILTERS.map((f) => (
                    <FilterChip
                        key={f.id}
                        label={f.label}
                        icon={
                            f.icon ? (
                                <Icon icon={f.icon} width={12} />
                            ) : undefined
                        }
                        active={value === f.id}
                        onClick={() => onChange(f.id)}
                    />
                ))}
            </div>

            {/* Count badge — only visible when a non-"all" filter is active */}
            {value !== "all" && count !== undefined && (
                <span className="shrink-0 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {count} ст.
                </span>
            )}
        </div>
    );
}
