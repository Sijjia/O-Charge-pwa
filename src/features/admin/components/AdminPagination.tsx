import { Icon } from "@iconify/react";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: AdminPaginationProps) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  const pages = getVisiblePages(page, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      <span className="text-xs text-zinc-500 font-medium">
        Показано{" "}
        <span className="text-zinc-900 dark:text-white">
          {from}-{to}
        </span>{" "}
        из{" "}
        <span className="text-zinc-900 dark:text-white">
          {totalItems.toLocaleString()}
        </span>
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors disabled:opacity-50"
        >
          <Icon icon="solar:alt-arrow-left-linear" width={16} />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="text-zinc-400 text-xs px-1">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? "bg-red-600 text-white shadow-sm shadow-red-600/20"
                  : "hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors disabled:opacity-50"
        >
          <Icon icon="solar:alt-arrow-right-linear" width={16} />
        </button>
      </div>
    </div>
  );
}

function getVisiblePages(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
