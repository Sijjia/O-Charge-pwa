import type { DemoPartnerStation } from "@/shared/demo/demoData";

interface PartnerStationsTableProps {
  stations: DemoPartnerStation[];
}

export function PartnerStationsTable({ stations }: PartnerStationsTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
      case "inactive":
        return "bg-red-100/50 dark:bg-red-500/10 text-red-700 dark:text-red-400";
      case "maintenance":
        return "bg-amber-100/50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400";
      default:
        return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Активна";
      case "inactive":
        return "Неактивна";
      case "maintenance":
        return "Обслуживание";
      default:
        return status;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-gray-400">
              Серийный номер
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-gray-400">
              Модель
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-gray-400">
              Локация
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-gray-400">
              Статус
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 dark:text-gray-400">
              Доход
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-gray-400">
              Последний сигнал
            </th>
          </tr>
        </thead>
        <tbody>
          {stations.map((station) => (
            <tr
              key={station.id}
              className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <td className="px-4 py-3 text-sm text-zinc-900 dark:text-white font-medium">
                {station.serial_number}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-600 dark:text-gray-400">
                {station.model}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-600 dark:text-gray-400">
                {station.location}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(station.status)}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {getStatusLabel(station.status)}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-zinc-900 dark:text-white font-medium text-right">
                {station.total_revenue.toLocaleString("ru-KG")} с.
              </td>
              <td className="px-4 py-3 text-sm text-zinc-600 dark:text-gray-400">
                {new Date(station.last_heartbeat).toLocaleTimeString("ru", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
