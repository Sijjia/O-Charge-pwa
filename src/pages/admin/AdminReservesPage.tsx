import { Icon } from "@iconify/react";
import { useState, useCallback } from "react";
import { useAdminReserves } from "@/features/admin/hooks/useAdminReserves";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminDataTable, type Column } from "@/features/admin/components/AdminDataTable";
import { AdminFilterBar, FilterSelect } from "@/features/admin/components/AdminFilterBar";
import { AdminPagination } from "@/features/admin/components/AdminPagination";
import { AdminStatCard } from "@/features/admin/components/AdminStatCard";
import { AdminStatusBadge } from "@/features/admin/components/AdminStatusBadge";
import { AdminEmptyState } from "@/features/admin/components/AdminEmptyState";
import type { Reserve } from "@/features/admin/services/adminReservesService";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "completed", label: "Завершённые" },
  { value: "cancelled", label: "Отменённые" },
];

function statusToVariant(status: string) {
  switch (status) {
    case "active":
      return "charging" as const;
    case "completed":
      return "success" as const;
    case "cancelled":
      return "error" as const;
    case "expired":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "active":
      return "Активен";
    case "completed":
      return "Завершён";
    case "cancelled":
      return "Отменён";
    case "expired":
      return "Истёк";
    default:
      return status;
  }
}

function formatDateTime(val: string | null) {
  if (!val) return "\u2014";
  return new Date(val).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReserveModal({ reserve, onClose }: { reserve: Reserve; onClose: () => void }) {
  const fields = [
    { label: "ID", value: reserve.id },
    { label: "Станция", value: reserve.station_name ?? reserve.station_id },
    { label: "Клиент", value: reserve.user_phone ?? reserve.user_id },
    { label: "Коннектор", value: `#${reserve.connector_number}` },
    { label: "Начало", value: formatDateTime(reserve.start_time) },
    { label: "Конец", value: formatDateTime(reserve.end_time) },
    { label: "Статус", value: statusLabel(reserve.status) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Бронирование</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{reserve.station_name ?? reserve.station_id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
            <Icon icon="solar:close-circle-linear" width={22} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex justify-center mb-2">
            <AdminStatusBadge variant={statusToVariant(reserve.status)} label={statusLabel(reserve.status)} />
          </div>
          {fields.map((f) => (
            <div key={f.label} className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <span className="text-xs text-zinc-500">{f.label}</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-white">{f.value}</span>
            </div>
          ))}
        </div>
        <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
          {reserve.status === "active" && (
            <button className="btn btn-primary gap-1.5 py-2 px-4 text-sm">
              <Icon icon="solar:close-circle-linear" width={16} />
              Отменить бронь
            </button>
          )}
          <button onClick={onClose} className="btn btn-secondary py-2 px-4 text-sm">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminReservesPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Reserve | null>(null);

  const filters = {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    status: statusFilter || undefined,
  };

  const { data, isLoading, isError, error } = useAdminReserves(filters);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const reserves = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Stats computed from current data
  const activeCount = reserves.filter((r) => r.status === "active").length;
  const expiredCount = reserves.filter(
    (r) => r.status === "expired" || r.status === "cancelled",
  ).length;

  const columns: Column<Reserve>[] = [
    {
      key: "id",
      header: "ID",
      render: (row) => (
        <span className="font-mono text-xs text-zinc-500">
          {row.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      key: "station",
      header: "Станция",
      render: (row) => (
        <span className="text-sm text-zinc-900 dark:text-white">
          {row.station_name ?? row.station_id}
        </span>
      ),
    },
    {
      key: "client",
      header: "Клиент",
      render: (row) => (
        <span className="text-sm text-zinc-500">
          {row.user_phone ?? row.user_id}
        </span>
      ),
    },
    {
      key: "connector",
      header: "Коннектор",
      render: (row) => (
        <span className="text-sm text-zinc-900 dark:text-white">
          #{row.connector_number}
        </span>
      ),
    },
    {
      key: "start",
      header: "Начало",
      render: (row) => (
        <span className="text-sm text-zinc-500">
          {formatDateTime(row.start_time)}
        </span>
      ),
    },
    {
      key: "end",
      header: "Конец",
      render: (row) => (
        <span className="text-sm text-zinc-500">
          {formatDateTime(row.end_time)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Статус",
      render: (row) => (
        <AdminStatusBadge
          variant={statusToVariant(row.status)}
          label={statusLabel(row.status)}
        />
      ),
    },
    {
      key: "actions" as keyof Reserve,
      header: "",
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setSelected(row)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-blue-500 transition-colors" title="Подробнее">
            <Icon icon="solar:eye-linear" width={16} />
          </button>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AdminPageHeader title="Резервы" subtitle="Мониторинг бронирований" helpText="Бронирования коннекторов пользователями. Когда клиент бронирует станцию через приложение, запись появляется здесь. Можно отменить активную бронь." />
          </div>
        </div>
        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center">
            <Icon icon="solar:danger-triangle-linear" width={48} className="text-red-500 mx-auto mb-4" />
            <p className="text-sm text-zinc-500">
              {error instanceof Error ? error.message : "Не удалось загрузить бронирования"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdminPageHeader title="Резервы" subtitle="Мониторинг бронирований" helpText="Бронирования коннекторов пользователями. Когда клиент бронирует станцию через приложение, запись появляется здесь. Можно отменить активную бронь." />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AdminStatCard
            label="Всего"
            value={total}
            icon="solar:bookmark-linear"
          />
          <AdminStatCard
            label="Активных"
            value={activeCount}
            icon="solar:play-circle-linear"
          />
          <AdminStatCard
            label="Истёкших" helpText="Бронирования которые истекли или были отменены"
            value={expiredCount}
            icon="solar:clock-circle-linear"
          />
        </div>

        {/* Filters */}
        <AdminFilterBar>
          <FilterSelect
            label="Статус"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={handleStatusChange}
          />
        </AdminFilterBar>

        {/* Table or Empty State */}
        {!isLoading && reserves.length === 0 && !statusFilter ? (
          <AdminEmptyState
            icon="solar:bookmark-linear"
            title="Нет бронирований"
            description="Бронирования появятся здесь после создания"
          />
        ) : (
          <AdminDataTable<Reserve>
            columns={columns}
            data={reserves}
            keyExtractor={(row) => row.id}
            loading={isLoading}
            onRowClick={(row) => setSelected(row)}
            emptyMessage="Бронирования не найдены"
          />
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <AdminPagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}

        {/* Modal */}
        {selected && <ReserveModal reserve={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}
