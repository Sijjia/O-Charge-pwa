import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { useAdminClients } from "@/features/admin/hooks/useAdminClients";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminDataTable, type Column } from "@/features/admin/components/AdminDataTable";
import { AdminSearchBar } from "@/features/admin/components/AdminSearchBar";
import { AdminFilterBar, FilterSelect } from "@/features/admin/components/AdminFilterBar";
import { AdminPagination } from "@/features/admin/components/AdminPagination";
import { AdminStatCard } from "@/features/admin/components/AdminStatCard";
import { AdminStatusBadge } from "@/features/admin/components/AdminStatusBadge";
import { AdminEmptyState } from "@/features/admin/components/AdminEmptyState";
import type { Client } from "@/features/admin/services/adminClientsService";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "true", label: "Активные" },
  { value: "false", label: "Неактивные" },
];

function formatDate(val: string | null) {
  if (!val) return "\u2014";
  return new Date(val).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function ClientModal({ client, onClose, onNavigate }: { client: Client; onClose: () => void; onNavigate: () => void }) {
  const fields = [
    { label: "Имя", value: client.name || "Без имени" },
    { label: "Телефон", value: client.phone },
    { label: "Баланс", value: `${client.balance.toLocaleString()} сом` },
    { label: "Сессий", value: client.total_sessions },
    { label: "Энергия", value: `${client.total_energy_kwh.toFixed(1)} кВтч` },
    { label: "Последняя сессия", value: formatDate(client.last_session_at) },
    { label: "Регистрация", value: formatDate(client.created_at) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${client.is_active ? "bg-emerald-500" : "bg-zinc-400"}`}>
              {(client.name ?? client.phone ?? "?")[0]!.toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{client.name || "Без имени"}</h2>
              <p className="text-xs text-zinc-500">{client.is_active ? "🟢 Активен" : "🔴 Неактивен"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
            <Icon icon="solar:close-circle-linear" width={22} />
          </button>
        </div>
        <div className="p-5 space-y-0">
          {fields.map((f) => (
            <div key={f.label} className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <span className="text-xs text-zinc-500">{f.label}</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-white">{f.value}</span>
            </div>
          ))}
        </div>
        <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
          <button onClick={onNavigate} className="btn btn-primary gap-1.5 py-2 px-4 text-sm">
            <Icon icon="solar:user-bold-duotone" width={16} />
            Полный профиль
          </button>
          <button onClick={onClose} className="btn btn-secondary py-2 px-4 text-sm">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminClientsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Client | null>(null);

  const filters = {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    search: search || undefined,
    is_active: statusFilter ? statusFilter === "true" : undefined,
  };

  const { data, isLoading, isError, error } = useAdminClients(filters);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const clients = data?.users ?? [];
  const total = data?.total ?? 0;

  const handleExportCSV = useCallback(() => {
    if (!clients.length) return;
    const headers = ["ID", "Имя", "Телефон", "Баланс", "Сессий", "Энергия", "Статус", "Регистрация"];
    const rows = clients.map((c) => [
      c.id,
      `"${c.name || 'Без имени'}"`,
      c.phone,
      c.balance,
      c.total_sessions,
      c.total_energy_kwh.toFixed(1),
      c.is_active ? "Активен" : "Неактивен",
      formatDate(c.created_at)
    ].join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `clients_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [clients]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Compute stat values from response
  const totalClients = total;
  const activeClients = clients.filter((c) => c.is_active).length;
  const avgBalance =
    clients.length > 0
      ? Math.round(clients.reduce((sum, c) => sum + c.balance, 0) / clients.length)
      : 0;

  const columns: Column<Client>[] = [
    {
      key: "client",
      header: "Клиент",
      render: (row) => (
        <div>
          <p className="text-sm text-zinc-900 dark:text-white font-medium">
            {row.name || "Без имени"}
          </p>
          <p className="text-sm text-zinc-500">{row.phone}</p>
        </div>
      ),
    },
    {
      key: "balance",
      header: "Баланс", helpText: "Сумма на личном счёте клиента. Списывается при каждой зарядке. Пополняется через приложение.",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-zinc-900 dark:text-white font-medium">
          {row.balance.toLocaleString()} сом
        </span>
      ),
    },
    {
      key: "sessions",
      header: "Сессии", helpText: "Сколько раз клиент заряжал электромобиль за всё время.",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-zinc-900 dark:text-white">
          {row.total_sessions}
        </span>
      ),
    },
    {
      key: "energy",
      header: "Энергия", helpText: "Суммарное количество электроэнергии (кВтч) которое клиент получил за все зарядки.",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-zinc-500">
          {row.total_energy_kwh.toFixed(1)} кВтч
        </span>
      ),
    },
    {
      key: "last_session",
      header: "Последняя сессия",
      render: (row) => (
        <span className="text-sm text-zinc-500">
          {formatDate(row.last_session_at)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Статус",
      render: (row) => (
        <AdminStatusBadge
          variant={row.is_active ? "online" : "offline"}
          label={row.is_active ? "Активен" : "Неактивен"}
        />
      ),
    },
    {
      key: "actions" as keyof Client,
      header: "",
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/admin/clients/${row.id}`)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-blue-500 transition-colors" title="Профиль">
            <Icon icon="solar:user-linear" width={16} />
          </button>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <AdminPageHeader title="Клиенты" subtitle="Управление клиентами" helpText="База всех зарегистрированных пользователей приложения. Можно посмотреть баланс, историю зарядок, заблокировать или разблокировать аккаунт." />
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center">
          <Icon icon="solar:danger-triangle-linear" width={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-sm text-zinc-500">
            {error instanceof Error ? error.message : "Не удалось загрузить клиентов"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <AdminPageHeader title="Клиенты" subtitle="Управление клиентами" helpText="База всех зарегистрированных пользователей приложения. Можно посмотреть баланс, историю зарядок, заблокировать или разблокировать аккаунт." />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminStatCard
          label="Всего клиентов" helpText="Общее число зарегистрированных пользователей в системе"
          value={totalClients}
          icon="solar:users-group-rounded-linear"
        />
        <AdminStatCard
          label="Активных" helpText="Клиенты которые не заблокированы и могут пользоваться зарядками"
          value={activeClients}
          icon="solar:user-check-linear"
        />
        <AdminStatCard
          label="Сессий за сегодня"
          value={(data as Record<string, unknown>)?.['today_sessions'] as number ?? 0}
          icon="solar:bolt-circle-linear"
        />
        <AdminStatCard
          label="Средний баланс" helpText="Средняя сумма на счетах всех клиентов на текущей странице"
          value={`${avgBalance} сом`}
          icon="solar:wallet-linear"
        />
      </div>

      {/* Filters */}
      <AdminFilterBar>
        <div className="flex w-full md:w-auto flex-1">
          <AdminSearchBar
            placeholder="Поиск по имени или телефону..."
            value={search}
            onChange={handleSearch}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto shrink-0 mt-3 md:mt-0 items-center justify-between md:justify-start">
          <FilterSelect
            label="Статус"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={handleStatusChange}
          />
          <button
            onClick={handleExportCSV}
            disabled={!clients.length}
            className="btn btn-secondary gap-2 px-4 py-2 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon icon="solar:export-linear" width={18} />
            <span className="hidden sm:inline">Экспорт CSV</span>
          </button>
        </div>
      </AdminFilterBar>

      {/* Table or Empty State */}
      {!isLoading && clients.length === 0 && !search && !statusFilter ? (
        <AdminEmptyState
          icon="solar:users-group-rounded-linear"
          title="Нет клиентов"
          description="Клиенты появятся здесь после регистрации"
        />
      ) : (
        <AdminDataTable<Client>
          columns={columns}
          data={clients}
          keyExtractor={(row) => row.id}
          loading={isLoading}
          onRowClick={(row) => setSelected(row)}
          emptyMessage="Клиенты не найдены"
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
      {selected && (
        <ClientModal
          client={selected}
          onClose={() => setSelected(null)}
          onNavigate={() => { const id = selected.id; setSelected(null); navigate(`/admin/clients/${id}`); }}
        />
      )}
    </div>
  );
}
