import { useState } from "react";
import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";
import { adminStationsService } from "@/features/admin/services/adminStationsService";
import { adminSessionsService } from "@/features/admin/services/adminSessionsService";
import type { OwnerLocation } from "@/features/owner/hooks/useOwnerLocations";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Link, useNavigate } from "react-router-dom";
import { usePanelBase } from "@/shared/hooks/usePanelBase";
import { pluralize } from "@/shared/utils/formatters";

// -----------------------------------------------------------------------------
// Session Row
// -----------------------------------------------------------------------------
function SessionRow({ session, paddingLeft }: { session: any; paddingLeft: number }) {
    const base = usePanelBase();
    const navigate = useNavigate();
    return (
        <tr
            onClick={() => navigate(`${base}/sessions/${session.id}`)}
            className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors text-sm cursor-pointer border-b border-zinc-100 dark:border-white/[0.02] last:border-0"
        >
            <td className="py-3 px-6" style={{ paddingLeft: `${paddingLeft}px` }}>
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 group-hover:text-red-500 transition-colors">
                    <Icon icon="solar:history-linear" width={16} />
                    <span>Сессия #{session.id.slice(0, 8)}</span>
                    <Icon icon="solar:arrow-right-up-linear" width={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </td>
            <td className="py-3 px-6">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${session.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : session.status === "in_progress" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}>
                    {session.status === "completed" ? "Завершена" : session.status === "in_progress" ? "В процессе" : "Остановлена"}
                </span>
            </td>
            <td className="py-3 px-6 text-zinc-500 dark:text-zinc-400">
                {new Date(session.started_at || session.start_time || session.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </td>
            <td className="py-3 px-6 font-medium text-zinc-900 dark:text-white">
                {session.energy_kwh?.toFixed(1) ?? 0} кВтч
            </td>
            <td className="py-3 px-6 font-medium text-zinc-900 dark:text-white">
                {(session.cost ?? session.amount ?? 0)} сом
            </td>
        </tr>
    );
}

// -----------------------------------------------------------------------------
// Connector (Port) Row
// -----------------------------------------------------------------------------
function ConnectorRow({ connector, stationId, paddingLeft }: { connector: any; stationId: string; paddingLeft: number }) {
    const [expanded, setExpanded] = useState(false);
    const base = usePanelBase();
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ['station-connector-sessions', stationId, connector.connector_number],
        queryFn: async () => {
            const res = await adminSessionsService.listSessions({
                station_id: stationId,
                connector_id: connector.connector_number,
                limit: 10,
            });
            return res.data;
        },
        enabled: expanded
    });

    const connectorUrl = `${base}/stations/${stationId}/connector/${connector.connector_number}`;

    return (
        <>
            <tr
                onClick={() => setExpanded(!expanded)}
                className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors text-sm cursor-pointer border-b border-zinc-100 dark:border-white/[0.02] last:border-0"
            >
                <td className="py-3 px-6" style={{ paddingLeft: `${paddingLeft}px` }}>
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <Icon
                            icon="solar:alt-arrow-right-linear"
                            width={16}
                            className={`transition-transform text-zinc-400 ${expanded ? "rotate-90" : ""}`}
                        />
                        <Icon icon="solar:plug-circle-linear" width={18} className="text-zinc-400" />
                        <span className="font-medium">Порт {connector.connector_number}</span>
                        <span className="text-xs text-zinc-500">({connector.connector_type})</span>
                    </div>
                </td>
                <td className="py-3 px-6">
                    <StatusBadge kind="connector" status={connector.status} />
                </td>
                <td className="py-3 px-6 text-zinc-500 dark:text-zinc-400">
                    MAX: {connector.max_power || "—"} кВт
                </td>
                <td className="py-3 px-6">
                    {data && data.length > 0 && (
                        <span className="text-xs text-zinc-400">{data.length} сессий</span>
                    )}
                </td>
                <td className="py-3 px-6 text-right">
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(connectorUrl); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-500 hover:text-red-500 bg-zinc-50 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title="Подробная информация о порте"
                    >
                        <Icon icon="solar:arrow-right-up-linear" width={14} />
                        Подробнее
                    </button>
                </td>
            </tr>

            {expanded && isLoading && (
                <tr>
                    <td colSpan={5} className="py-2 text-center text-xs text-zinc-500" style={{ paddingLeft: `${paddingLeft + 24}px` }}>
                        Загрузка сессий...
                    </td>
                </tr>
            )}

            {expanded && data?.length === 0 && (
                <tr>
                    <td colSpan={5} className="py-2 text-center text-xs text-zinc-500" style={{ paddingLeft: `${paddingLeft + 24}px` }}>
                        Нет недавних сессий на этом порту
                    </td>
                </tr>
            )}

            {expanded && data?.map(session => (
                <SessionRow key={session.id} session={session} paddingLeft={paddingLeft + 24} />
            ))}
        </>
    );
}

// -----------------------------------------------------------------------------
// Station Row
// -----------------------------------------------------------------------------
function StationRow({ station, paddingLeft }: { station: any; paddingLeft: number }) {
    const [expanded, setExpanded] = useState(false);
    const base = usePanelBase();

    const { data, isLoading } = useQuery({
        queryKey: ['owner-station-details', station.id],
        queryFn: async () => adminStationsService.getStation(station.id),
        enabled: expanded
    });

    return (
        <>
            <tr
                onClick={() => setExpanded(!expanded)}
                className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors text-sm cursor-pointer border-b border-zinc-100 dark:border-white/[0.02] last:border-0"
            >
                <td className="py-4 px-6" style={{ paddingLeft: `${paddingLeft}px` }}> {/* 24 */}
                    <div className="flex items-center gap-2">
                        <Icon
                            icon="solar:alt-arrow-right-linear"
                            width={16}
                            className={`transition-transform text-zinc-400 ${expanded ? "rotate-90" : ""}`}
                        />
                        <Icon icon="solar:ev-station-linear" width={20} className="text-zinc-500" />
                        <Link
                            to={`${base}/stations/${station.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-zinc-900 dark:text-white hover:text-red-500 transition-colors"
                        >
                            {station.model || `Станция ${station.id.slice(0, 8)}`}
                        </Link>
                        {station.is_partner && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                Партнерская
                            </span>
                        )}
                    </div>
                </td>
                <td className="py-4 px-6">
                    <StatusBadge kind="station" status={station.is_online ? "available" : "offline"} />
                </td>
                <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400">
                    С/Н: {station.id.slice(0, 8)}
                </td>
                <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400">
                    {station.active_sessions || 0} акт. сессий
                </td>
                <td className="py-4 px-6 text-right flex items-center justify-end gap-2">
                    <Link
                        to={`${base}/stations/${station.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-500 hover:text-red-500 bg-zinc-50 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                        <Icon icon="solar:arrow-right-up-linear" width={14} />
                        Открыть
                    </Link>
                    <Link
                        to={`${base}/stations/${station.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-zinc-400 hover:text-red-500 transition-colors"
                    >
                        <Icon icon="solar:pen-linear" width={18} />
                    </Link>
                </td>
            </tr>

            {expanded && isLoading && (
                <tr>
                    <td colSpan={5} className="py-3 text-center text-sm text-zinc-500" style={{ paddingLeft: `${paddingLeft + 24}px` }}>
                        <Icon icon="solar:refresh-linear" width={16} className="animate-spin inline mr-2" />
                        Загрузка портов...
                    </td>
                </tr>
            )}

            {expanded && data?.connectors?.length === 0 && (
                <tr>
                    <td colSpan={5} className="py-3 text-center text-sm text-zinc-500" style={{ paddingLeft: `${paddingLeft + 24}px` }}>
                        Нет настроенных портов
                    </td>
                </tr>
            )}

            {expanded && data?.connectors?.map((conn: any) => (
                <ConnectorRow key={conn.connector_number} connector={conn} stationId={station.id} paddingLeft={paddingLeft + 24} />
            ))}
        </>
    );
}

// -----------------------------------------------------------------------------
// Location Row
// -----------------------------------------------------------------------------
function LocationRow({ location }: { location: OwnerLocation }) {
    const [expanded, setExpanded] = useState(false);
    const base = usePanelBase();

    const { data, isLoading } = useQuery({
        queryKey: ['location-stations', location.id],
        queryFn: async () => adminStationsService.listStations({ location_id: location.id }),
        enabled: expanded
    });

    return (
        <>
            <tr
                onClick={() => setExpanded(!expanded)}
                className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer border-b border-zinc-200 dark:border-zinc-800"
            >
                <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                        <Icon
                            icon="solar:alt-arrow-right-linear"
                            width={20}
                            className={`transition-transform text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 ${expanded ? "rotate-90" : ""}`}
                        />
                        <Icon icon="solar:map-point-linear" width={24} className="text-red-500" />
                        <div>
                            <Link
                                to={`${base}/locations/${location.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-bold text-zinc-900 dark:text-white hover:text-red-500 transition-colors block leading-tight"
                            >
                                {location.name}
                            </Link>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                {location.address}, {location.city}
                            </span>
                        </div>
                    </div>
                </td>
                <td className="py-4 px-6">
                    <StatusBadge kind="station" status={location.status === 'active' ? 'available' : location.status === 'maintenance' ? 'maintenance' : 'offline'} />
                </td>
                <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 text-sm">
                    {location.status === 'active' ? 'Работает' : 'Неактивна'}
                </td>
                <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        <Icon icon="solar:battery-charge-linear" width={14} />
                        {pluralize(location.stations_count || 0, 'станция', 'станции', 'станций')}
                    </span>
                </td>
                <td className="py-4 px-6 text-right">
                    <Link
                        to={`${base}/locations/${location.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                        <Icon icon="solar:pen-linear" width={18} />
                    </Link>
                </td>
            </tr>

            {/* Children (Stations) */}
            {expanded && isLoading && (
                <tr>
                    <td colSpan={5} className="py-6 text-center text-sm text-zinc-500">
                        <Icon icon="solar:refresh-linear" width={24} className="animate-spin text-red-500 mx-auto mb-2" />
                        Загрузка станций...
                    </td>
                </tr>
            )}

            {expanded && data?.data?.length === 0 && (
                <tr>
                    <td colSpan={5} className="py-6 text-center text-sm text-zinc-500">
                        Нет привязанных станций к данной локации
                    </td>
                </tr>
            )}

            {expanded && data?.data?.map(station => (
                <StationRow key={station.id} station={station} paddingLeft={40} />
            ))}
        </>
    );
}

// -----------------------------------------------------------------------------
// Main Table Component
// -----------------------------------------------------------------------------
interface OwnerLocationsTreeTableProps {
    locations: OwnerLocation[];
}

export function OwnerLocationsTreeTable({ locations }: OwnerLocationsTreeTableProps) {
    if (locations.length === 0) {
        return (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center">
                <Icon icon="solar:map-point-linear" width={48} className="text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500 dark:text-gray-400">Локации не найдены</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#111621] md:rounded-3xl border-y md:border border-zinc-200 dark:border-white/[0.04] overflow-hidden md:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] md:dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] transition-all overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-white/5">
                    <tr>
                        <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest w-[35%]">
                            Локация / Устройство
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest w-[15%]">
                            Статус
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest w-[20%]">
                            Детали
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest w-[20%]">
                            Метрики
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest w-[10%] text-right">
                            Действия
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {locations.map(loc => (
                        <LocationRow key={loc.id} location={loc} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
