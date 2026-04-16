import { Icon } from "@iconify/react";
import { usePartnerStations } from "@/features/partner/hooks/usePartnerStations";

interface Incident {
  id: string;
  stationName: string;
  stationSerial: string;
  type: "offline" | "connector_error" | "session_fail" | "maintenance";
  message: string;
  since: string;
  severity: "critical" | "warning" | "info";
}

const SEVERITY_CONFIG = {
  critical: {
    label: "Критично",
    bg: "bg-red-500/10 border-red-500/20",
    text: "text-red-500",
    icon: "solar:danger-triangle-bold-duotone",
    badge: "bg-red-500/20 text-red-400",
  },
  warning: {
    label: "Предупреждение",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    text: "text-yellow-500",
    icon: "solar:bell-bing-bold-duotone",
    badge: "bg-yellow-500/20 text-yellow-400",
  },
  info: {
    label: "Информация",
    bg: "bg-blue-500/10 border-blue-500/20",
    text: "text-blue-500",
    icon: "solar:info-circle-bold-duotone",
    badge: "bg-blue-500/20 text-blue-400",
  },
};

const TYPE_LABELS: Record<Incident["type"], string> = {
  offline: "Оффлайн",
  connector_error: "Ошибка коннектора",
  session_fail: "Сбой сессии",
  maintenance: "Обслуживание",
};

function buildIncidentsFromStations(stations: any[]): Incident[] {
  const incidents: Incident[] = [];

  stations.forEach((station) => {
    const status = (station.status || "").toLowerCase();

    if (status === "offline" || status === "unavailable") {
      incidents.push({
        id: `offline-${station.id}`,
        stationName: station.name || station.serial_number,
        stationSerial: station.serial_number,
        type: "offline",
        message: "Станция не отвечает на запросы OCPP",
        since: station.last_heartbeat_at || station.updated_at || "-",
        severity: "critical",
      });
    } else if (status === "maintenance" || status === "unavailable_maintenance") {
      incidents.push({
        id: `maint-${station.id}`,
        stationName: station.name || station.serial_number,
        stationSerial: station.serial_number,
        type: "maintenance",
        message: "Плановое техническое обслуживание",
        since: station.updated_at || "-",
        severity: "warning",
      });
    } else if (status === "faulted") {
      incidents.push({
        id: `fault-${station.id}`,
        stationName: station.name || station.serial_number,
        stationSerial: station.serial_number,
        type: "connector_error",
        message: "Зафиксирована неисправность оборудования",
        since: station.updated_at || "-",
        severity: "critical",
      });
    }
  });

  return incidents;
}

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === "-") return "—";
  try {
    return new Date(dateStr).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function PartnerIncidentsPage() {
  const { data: stations = [], isLoading } = usePartnerStations();
  const incidents = buildIncidentsFromStations(stations);

  const critical = incidents.filter((i) => i.severity === "critical");
  const warnings = incidents.filter((i) => i.severity === "warning");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Инциденты</h1>
              <p className="text-zinc-500 dark:text-gray-400 mt-1 text-sm">
                Проблемы с вашими станциями — оффлайн, ошибки, обслуживание
              </p>
            </div>
            {incidents.length > 0 && (
              <div className="flex items-center gap-2">
                {critical.length > 0 && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 text-sm font-medium">
                    <Icon icon="solar:danger-triangle-bold-duotone" width={16} />
                    {critical.length} критичных
                  </span>
                )}
                {warnings.length > 0 && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-500 text-sm font-medium">
                    <Icon icon="solar:bell-bing-bold-duotone" width={16} />
                    {warnings.length} предупреждений
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">

        {/* Loading */}
        {isLoading && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-16 text-center">
            <Icon icon="solar:refresh-linear" width={40} className="text-red-500 animate-spin mx-auto mb-3" />
            <p className="text-zinc-500 dark:text-gray-400 text-sm">Загрузка данных...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && incidents.length === 0 && (
          <>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-center py-16 px-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Icon icon="solar:shield-check-bold-duotone" width={32} className="text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                  Нет активных инцидентов
                </h3>
                <p className="text-zinc-500 dark:text-gray-400 text-sm max-w-md mx-auto">
                  Все ваши станции работают в штатном режиме.
                  Инциденты появятся здесь автоматически при обнаружении проблем.
                </p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Icon icon="solar:info-circle-bold-duotone" width={22} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-600 dark:text-blue-300 mb-2 text-sm">
                    Что отслеживается
                  </h3>
                  <ul className="space-y-1.5 text-sm text-blue-400">
                    <li>• Оффлайн-статус ваших станций</li>
                    <li>• Ошибки коннекторов по OCPP протоколу</li>
                    <li>• Станции на техническом обслуживании</li>
                    <li>• Неисправности оборудования</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Incident list */}
        {!isLoading && incidents.length > 0 && (
          <>
            {incidents.map((incident) => {
              const cfg = SEVERITY_CONFIG[incident.severity];
              return (
                <div
                  key={incident.id}
                  className={`border rounded-xl p-5 ${cfg.bg}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
                        <Icon icon={cfg.icon} width={22} className={cfg.text} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-zinc-900 dark:text-white text-sm">
                            {incident.stationName}
                          </span>
                          <span className="text-xs text-zinc-400 font-mono">
                            {incident.stationSerial}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">
                          {incident.message}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                            {TYPE_LABELS[incident.type]}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">С</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 font-mono mt-0.5">
                        {formatDate(incident.since)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Icon icon="solar:info-circle-bold-duotone" width={22} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-400">
                  Для устранения неисправностей обратитесь в службу поддержки Red Petroleum.
                  Данные обновляются автоматически при изменении статуса станций.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
