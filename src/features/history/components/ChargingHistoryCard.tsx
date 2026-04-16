import { memo, useMemo, useCallback } from "react";
import { Icon } from "@iconify/react";
import type { ChargingHistoryItem } from "../types";

interface ChargingHistoryCardProps {
  item: ChargingHistoryItem;
  onClick?: (item: ChargingHistoryItem) => void;
}

export const ChargingHistoryCard = memo(function ChargingHistoryCard({
  item,
  onClick,
}: ChargingHistoryCardProps) {
  // Memoize formatted date
  const formattedDate = useMemo(() => {
    const date = new Date(item.startTime);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }, [item.startTime]);

  // Memoize formatted duration
  const formattedDuration = useMemo(() => {
    const hours = Math.floor(item.duration / 3600);
    const minutes = Math.floor((item.duration % 3600) / 60);
    if (hours > 0) {
      return `${hours}ч ${minutes}мин`;
    }
    return `${minutes} мин`;
  }, [item.duration]);

  // Memoize status styling
  const statusConfig = useMemo(() => {
    const colorMap = {
      completed: { color: "bg-green-500/15 text-green-400", text: "Завершена" },
      stopped: { color: "bg-orange-500/15 text-orange-400", text: "Остановлена" },
      failed: { color: "bg-red-500/15 text-red-400", text: "Ошибка" },
      in_progress: { color: "bg-blue-500/15 text-blue-400", text: "Заряжается" },
    };
    return (
      colorMap[item.status as keyof typeof colorMap] || {
        color: "bg-zinc-800 text-gray-300",
        text: "Неизвестно",
      }
    );
  }, [item.status]);

  // Use callback for click handler
  const handleClick = useCallback(() => {
    onClick?.(item);
  }, [onClick, item]);

  return (
    <div
      onClick={handleClick}
      className="bg-zinc-900 rounded-lg shadow-sm shadow-black/20 border border-zinc-800 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-cyan-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon icon="solar:bolt-linear" width={20} className="text-cyan-600" />
          </div>
          <div>
            <h4 className="font-semibold text-white">{item.stationName}</h4>
            <p className="text-sm text-gray-500">{item.stationAddress}</p>
          </div>
        </div>
        <Icon icon="solar:alt-arrow-right-linear" width={20} className="text-gray-400" />
      </div>

      {/* Date and Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Icon icon="solar:calendar-linear" width={16} />
          <span>{formattedDate}</span>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
        >
          {statusConfig.text}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {/* Energy */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Icon icon="solar:bolt-linear" width={12} />
            <span className="text-xs">Энергия</span>
          </div>
          <p className="font-semibold text-sm">
            {item.energyConsumed.toFixed(1)} кВт·ч
          </p>
        </div>

        {/* Duration */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Icon icon="solar:clock-circle-linear" width={12} />
            <span className="text-xs">Время</span>
          </div>
          <p className="font-semibold text-sm">{formattedDuration}</p>
        </div>

        {/* Cost */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Icon icon="solar:dollar-linear" width={12} />
            <span className="text-xs">Стоимость</span>
          </div>
          <p className="font-semibold text-sm">
            {item.totalCost.toFixed(0)} сом
          </p>
        </div>
      </div>

      {/* Limit info if exists */}
      {item.limitType && item.limitType !== "none" && (
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <p className="text-xs text-gray-500">
            Лимит:{" "}
            {item.limitType === "energy"
              ? `${item.limitValue} кВт·ч`
              : `${item.limitValue} сом`}
          </p>
        </div>
      )}
    </div>
  );
});
