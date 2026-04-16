import { Icon } from "@iconify/react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminSessionDetail } from "@/features/admin/hooks/useAdminSessions";
import { AdminStatusBadge } from "@/features/admin/components/AdminStatusBadge";

function statusToVariant(status: string) {
  switch (status) {
    case "active":
    case "charging":
      return "charging" as const;
    case "completed":
      return "success" as const;
    case "error":
    case "faulted":
      return "error" as const;
    default:
      return "neutral" as const;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "active":
      return "Активна";
    case "charging":
      return "Зарядка";
    case "completed":
      return "Завершена";
    case "error":
    case "faulted":
      return "Ошибка";
    default:
      return status;
  }
}

function formatDate(val: string | null) {
  if (!val) return "\u2014";
  return new Date(val).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number | null) {
  if (minutes === null || minutes === undefined) return "\u2014";
  if (minutes < 60) return `${Math.round(minutes)} мин`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h} ч ${m} мин`;
}

export function AdminSessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useAdminSessionDetail(id);

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        <div className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <button
          onClick={() => navigate("/admin/sessions")}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <Icon icon="solar:alt-arrow-left-linear" width={16} />
          Назад к сессиям
        </button>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center">
          <Icon icon="solar:danger-triangle-linear" width={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-sm text-zinc-500">
            {error instanceof Error ? error.message : "Не удалось загрузить сессию"}
          </p>
        </div>
      </div>
    );
  }

  const session = data?.session;
  if (!session) return null;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/admin/sessions")}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <Icon icon="solar:alt-arrow-left-linear" width={16} />
        Назад к сессиям
      </button>

      {/* Status banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Сессия
          </h1>
          <p className="font-mono text-xs text-zinc-500 mt-1">{session.id}</p>
        </div>
        <AdminStatusBadge
          variant={statusToVariant(session.status)}
          label={statusLabel(session.status)}
        />
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Session info */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
            Информация о сессии
          </h2>

          <div className="space-y-4">
            <InfoRow
              icon="solar:ev-station-linear"
              label="Станция"
              value={session.station_name ?? session.station_id}
              mono={!session.station_name}
            />
            <InfoRow
              icon="solar:user-linear"
              label="Пользователь"
              value={session.user_phone ?? session.user_id}
              mono={!session.user_phone}
            />
            <InfoRow
              icon="solar:calendar-linear"
              label="Начало"
              value={formatDate(session.started_at)}
            />
            <InfoRow
              icon="solar:calendar-check-linear"
              label="Конец"
              value={formatDate(session.ended_at)}
            />
            <InfoRow
              icon="solar:clock-circle-linear"
              label="Длительность"
              value={formatDuration(session.duration_minutes)}
            />
          </div>
        </div>

        {/* Right: Energy info */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
            Энергия и стоимость
          </h2>

          <div className="space-y-4">
            <InfoRow
              icon="solar:bolt-circle-linear"
              label="Энергия"
              value={session.energy_kwh !== null ? `${session.energy_kwh.toFixed(2)} кВтч` : "\u2014"}
            />
            <InfoRow
              icon="solar:wallet-linear"
              label="Стоимость"
              value={session.cost !== null ? `${session.cost.toFixed(0)} сом` : "\u2014"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: string;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon icon={icon} width={18} className="text-zinc-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p
          className={`text-sm text-zinc-900 dark:text-white ${
            mono ? "font-mono text-xs" : ""
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
