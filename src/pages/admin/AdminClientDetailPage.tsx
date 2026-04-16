import { Icon } from "@iconify/react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminClientDetail } from "@/features/admin/hooks/useAdminClients";
import { useAdminSessions } from "@/features/admin/hooks/useAdminSessions";
import { AdminStatusBadge } from "@/features/admin/components/AdminStatusBadge";

function formatDate(val: string | null) {
  if (!val) return "\u2014";
  return new Date(val).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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

export function AdminClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useAdminClientDetail(id);

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        <div className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
          <div className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
          <div className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <button
          onClick={() => navigate("/admin/clients")}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <Icon icon="solar:alt-arrow-left-linear" width={16} />
          Назад к клиентам
        </button>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center">
          <Icon icon="solar:danger-triangle-linear" width={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-sm text-zinc-500">
            {error instanceof Error ? error.message : "Не удалось загрузить клиента"}
          </p>
        </div>
      </div>
    );
  }

  const client = data?.user;
  const { data: sessionsData, isLoading: sessionsLoading } = useAdminSessions(
    client ? { client_id: client.id, limit: 20 } : undefined
  );

  if (!client) return null;

  const sessions = sessionsData?.data ?? [];

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/admin/clients")}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <Icon icon="solar:alt-arrow-left-linear" width={16} />
        Назад к клиентам
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            {client.name || "Без имени"}
          </h1>
          <p className="font-mono text-xs text-zinc-500 mt-1">{client.id}</p>
        </div>
        <AdminStatusBadge
          variant={client.is_active ? "online" : "offline"}
          label={client.is_active ? "Активен" : "Неактивен"}
        />
      </div>

      {/* Info card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-5">
          Информация
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoRow icon="solar:phone-linear" label="Телефон" value={client.phone} />
          <InfoRow
            icon="solar:letter-linear"
            label="Email"
            value={client.email ?? "\u2014"}
          />
          <InfoRow
            icon="solar:wallet-linear"
            label="Баланс"
            value={`${client.balance.toLocaleString()} сом`}
          />
          <InfoRow
            icon="solar:calendar-linear"
            label="Дата регистрации"
            value={formatDateTime(client.created_at)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatBlock
          icon="solar:bolt-circle-linear"
          label="Всего сессий"
          value={String(client.total_sessions)}
        />
        <StatBlock
          icon="solar:flash-drive-linear"
          label="Всего энергии"
          value={`${client.total_energy_kwh.toFixed(1)} кВтч`}
        />
        <StatBlock
          icon="solar:calendar-mark-linear"
          label="Последняя сессия"
          value={formatDate(client.last_session_at)}
        />
      </div>

      {/* Sessions */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
            Сессии зарядки
          </h2>
        </div>
        {sessionsLoading ? (
          <div className="p-8 text-center">
            <Icon icon="solar:refresh-linear" width={24} className="text-zinc-400 animate-spin mx-auto" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            Нет сессий зарядки
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 uppercase">
                  <th className="text-left px-5 py-3 font-medium">Станция</th>
                  <th className="text-left px-5 py-3 font-medium">Статус</th>
                  <th className="text-right px-5 py-3 font-medium">Энергия</th>
                  <th className="text-right px-5 py-3 font-medium">Сумма</th>
                  <th className="text-right px-5 py-3 font-medium">Длительность</th>
                  <th className="text-right px-5 py-3 font-medium">Дата</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/sessions/${s.id}`)}
                  >
                    <td className="px-5 py-3 text-zinc-900 dark:text-white font-medium">
                      {s.station_name || s.station_id}
                    </td>
                    <td className="px-5 py-3">
                      <AdminStatusBadge
                        variant={s.status === "stopped" ? "online" : s.status === "started" ? "charging" : "offline"}
                        label={s.status === "stopped" ? "Завершена" : s.status === "started" ? "Активна" : s.status}
                      />
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-600 dark:text-zinc-300 tabular-nums">
                      {(s.energy_kwh ?? 0).toFixed(2)} кВтч
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-900 dark:text-white font-medium tabular-nums">
                      {(s.cost ?? 0).toFixed(0)} сом
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-600 dark:text-zinc-300 tabular-nums">
                      {s.duration_minutes ? `${s.duration_minutes} мин` : "—"}
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-500 tabular-nums">
                      {formatDateTime(s.started_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon icon={icon} width={18} className="text-zinc-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-sm text-zinc-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function StatBlock({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-3 mb-2">
        <Icon icon={icon} width={20} className="text-zinc-400" />
        <span className="text-xs font-medium text-zinc-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
        {value}
      </p>
    </div>
  );
}
