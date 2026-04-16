import { useState } from "react";
import { Icon } from "@iconify/react";
import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";
import { useQuery } from "@tanstack/react-query";
import { useAssignTariff } from "../hooks/useAdminTariffs";

const StationSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  station_id: z.string().optional(),
  status: z.string().optional(),
}).passthrough();

const StationsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(StationSchema),
}).passthrough();

interface Props {
  planId: string;
  planName: string;
  onClose: () => void;
}

export function AssignTariffModal({ planId, planName, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: stationsData, isLoading } = useQuery({
    queryKey: ["admin", "stations-for-tariff"],
    queryFn: () => fetchJson("/api/v1/admin/stations", { method: "GET" }, StationsResponseSchema),
  });

  const assignMutation = useAssignTariff();
  const stations = stationsData?.data || [];

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === stations.length) setSelected(new Set());
    else setSelected(new Set(stations.map((s) => s.id)));
  };

  const handleAssign = async () => {
    if (selected.size === 0) return;
    await assignMutation.mutateAsync({ planId, stationIds: Array.from(selected) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Назначить тариф</h2>
            <p className="text-sm text-zinc-500">{planName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <Icon icon="solar:close-linear" width={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Stations List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Icon icon="solar:refresh-linear" width={24} className="text-red-500 animate-spin" />
            </div>
          ) : stations.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">Нет доступных станций</p>
          ) : (
            <div className="space-y-1">
              <button
                onClick={toggleAll}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  selected.size === stations.length
                    ? "bg-red-600 border-red-600"
                    : "border-zinc-300 dark:border-zinc-600"
                }`}>
                  {selected.size === stations.length && <Icon icon="solar:check-read-linear" width={14} className="text-white" />}
                </div>
                Выбрать все ({stations.length})
              </button>

              {stations.map((station) => (
                <button
                  key={station.id}
                  onClick={() => toggle(station.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selected.has(station.id)
                      ? "bg-red-600 border-red-600"
                      : "border-zinc-300 dark:border-zinc-600"
                  }`}>
                    {selected.has(station.id) && <Icon icon="solar:check-read-linear" width={14} className="text-white" />}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm text-zinc-900 dark:text-white font-medium truncate">
                      {station.name || station.station_id || station.id}
                    </p>
                    {station.station_id && station.name && (
                      <p className="text-xs text-zinc-500 font-mono">{station.station_id}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <span className="text-sm text-zinc-500">Выбрано: {selected.size}</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
              Отмена
            </button>
            <button
              onClick={handleAssign}
              disabled={selected.size === 0 || assignMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {assignMutation.isPending && <Icon icon="solar:refresh-linear" width={14} className="animate-spin" />}
              Назначить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
