import { useState, type ReactNode } from "react";
import { Icon } from "@iconify/react";
import { HelpTip } from "@/shared/components/HelpTip";

export interface Column<T> {
  key: string;
  header: string;
  helpText?: string;
  render: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  loading?: boolean;
}

export function AdminDataTable<T>({
  columns,
  data,
  onRowClick,
  keyExtractor,
  emptyMessage = "Нет данных",
  loading,
}: AdminDataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse bg-zinc-50 dark:bg-zinc-800/40" />
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm p-12 text-center">
        <Icon
          icon="solar:inbox-linear"
          width={48}
          className="text-zinc-300 dark:text-zinc-600 mx-auto mb-4"
        />
        <p className="text-sm text-zinc-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111621] md:rounded-3xl border-y md:border border-zinc-200 dark:border-white/[0.04] overflow-hidden md:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] md:dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] transition-all">

      {/* Mobile View (Cards) */}
      <div className="md:hidden flex flex-col gap-3 p-4 bg-zinc-50/50 dark:bg-transparent">
        {data.map((row, idx) => (
          <div
            key={keyExtractor(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={`bg-white dark:bg-[#1C212B] p-5 rounded-2xl border border-zinc-100 dark:border-white/5 shadow-sm dark:shadow-none ${onRowClick ? "cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group" : ""
              }`}
          >
            <div className="space-y-4 relative z-10 pr-6">
              {columns.map((col) => {
                const content = col.render(row, idx);
                if (!content) return null;
                return (
                  <div key={col.key} className={`flex flex-col gap-1 ${col.className ?? ""}`}>
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{col.header}</span>
                    <div className="text-sm text-zinc-900 dark:text-zinc-100">{content}</div>
                  </div>
                );
              })}
            </div>
            {onRowClick && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-400 group-active:text-red-500 group-active:bg-red-50 dark:group-active:bg-red-500/10 transition-colors">
                <Icon icon="solar:alt-arrow-right-linear" width={18} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-white/5">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={`py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ${col.sortable ? "cursor-pointer select-none hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors" : ""
                    } ${col.className ?? ""}`}
                >
                  <span className="flex items-center gap-1.5">
                    {col.header}
                    {col.helpText && <HelpTip text={col.helpText} />}
                    {col.sortable && sortKey === col.key && (
                      <Icon
                        icon={
                          sortDir === "asc"
                            ? "solar:sort-from-bottom-to-top-bold"
                            : "solar:sort-from-top-to-bottom-bold"
                        }
                        width={16}
                        className="text-zinc-900 dark:text-white"
                      />
                    )}
                  </span>
                </th>
              ))}
              {onRowClick && <th className="py-4 px-6 w-8" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.02]">
            {data.map((row, idx) => (
              <tr
                key={keyExtractor(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors ${onRowClick ? "cursor-pointer" : ""
                  }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`py-4 px-6 whitespace-nowrap align-middle ${col.className ?? ""}`}>
                    {col.render(row, idx)}
                  </td>
                ))}
                {onRowClick && (
                  <td className="py-4 px-6 text-center align-middle">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 dark:text-zinc-600 group-hover:bg-white dark:group-hover:bg-[#1C212B] group-hover:text-red-500 group-hover:shadow-sm border border-transparent group-hover:border-zinc-200 dark:group-hover:border-white/5 transition-all opacity-0 group-hover:opacity-100 -ml-2">
                      <Icon icon="solar:alt-arrow-right-linear" width={18} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
