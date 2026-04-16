import { memo, useCallback, useMemo } from "react";
import { Icon } from "@iconify/react";
import type { StationWithLocation } from "../types";
import { useFavorites } from "../../favorites/hooks/useFavorites";
import { useAuthStatus } from "../../auth/hooks/useAuth";
import { ConnectorStatusDots } from "@/shared/components/ConnectorStatusDots";

interface StationCardCompactProps {
  station: StationWithLocation;
  onSelect: () => void;
  showDistance?: boolean;
}

/**
 * Компактная карточка станции (~100px высота)
 *
 * Дизайн:
 * - Горизонтальная компоновка
 * - Слева: статус-индикатор + основная инфа
 * - Справа: кнопка избранного + расстояние
 * - Внизу: статус-точки коннекторов
 */
export const StationCardCompact = memo(function StationCardCompact({
  station,
  onSelect,
  showDistance = true,
}: StationCardCompactProps) {
  const { isAuthenticated } = useAuthStatus();
  const { isFavorite, toggleFavorite, isToggling } = useFavorites();

  // Статус станции для визуального индикатора
  const statusIndicator = useMemo(() => {
    switch (station.status) {
      case "active":
        return { color: "bg-ev-status-available", label: "Активна" };
      case "maintenance":
        return { color: "bg-ev-status-maintenance", label: "Обслуживание" };
      case "inactive":
      default:
        return { color: "bg-ev-status-offline", label: "Неактивна" };
    }
  }, [station.status]);

  // Форматирование расстояния
  const formattedDistance = useMemo(() => {
    if (!station.distance) return null;
    if (station.distance < 1) {
      return `${Math.round(station.distance * 1000)} м`;
    }
    return `${station.distance.toFixed(1)} км`;
  }, [station.distance]);

  // Статусы коннекторов из connectors_summary
  const connectorStatuses = useMemo(() => {
    const summary = station.connectors_summary;
    if (summary) {
      return {
        available: summary.available || 0,
        charging: 0,
        occupied: summary.occupied || 0,
        offline: 0,
        faulted: summary.faulted || 0,
      };
    }
    // Fallback если нет данных о коннекторах
    return {
      available:
        station.status === "active" ? station.connectors_count || 1 : 0,
      charging: 0,
      occupied: 0,
      offline: station.status !== "active" ? station.connectors_count || 1 : 0,
      faulted: 0,
    };
  }, [station.connectors_summary, station.connectors_count, station.status]);

  // Кнопка избранного
  const handleFavoriteToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (station.location_id) {
        toggleFavorite(station.location_id);
      }
    },
    [toggleFavorite, station.location_id],
  );

  // Открыть в картах
  const openInMaps = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (station.latitude && station.longitude) {
        const url = `https://2gis.kg/search/${station.latitude},${station.longitude}`;
        window.open(url, "_blank");
      }
    },
    [station.latitude, station.longitude],
  );

  const isAvailable = station.status === "active";

  return (
    <div
      onClick={isAvailable ? onSelect : undefined}
      className={`
        ev-card p-3 transition-all duration-200
        ${isAvailable ? "cursor-pointer active:scale-[0.98] hover:shadow-ev-md" : "opacity-75"}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Левая часть: статус-индикатор */}
        <div className="flex-shrink-0 pt-0.5">
          <div
            className={`w-2.5 h-2.5 rounded-full ${statusIndicator.color}`}
            title={statusIndicator.label}
          />
        </div>

        {/* Центральная часть: информация */}
        <div className="flex-1 min-w-0">
          {/* Название и адрес */}
          <h3 className="font-semibold text-white text-sm leading-tight truncate">
            {station.locationName || station.model}
          </h3>
          <p className="text-gray-500 text-xs mt-0.5 truncate">
            {station.locationAddress || "Адрес не указан"}
          </p>

          {/* Характеристики в одну строку */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            {/* Мощность */}
            <div className="flex items-center gap-1">
              <Icon icon="solar:bolt-linear" width={14} className="text-ev-status-occupied" />
              <span className="font-medium">
                {station.power_capacity || "—"} кВт
              </span>
            </div>

            {/* Цена */}
            <div className="flex items-center gap-1">
              <span className="text-gray-400">•</span>
              <span>{station.price_per_kwh || "—"} сом/кВт·ч</span>
            </div>

            {/* Коннекторы */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">•</span>
              <ConnectorStatusDots
                {...connectorStatuses}
                size="sm"
                maxDots={6}
              />
            </div>
          </div>
        </div>

        {/* Правая часть: действия */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {/* Избранное */}
          {isAuthenticated && station.location_id && (
            <button
              onClick={handleFavoriteToggle}
              disabled={isToggling}
              className="p-1.5 -m-1.5 rounded-full hover:bg-zinc-800 transition-colors min-w-touch min-h-touch flex items-center justify-center"
              title={
                isFavorite(station.location_id)
                  ? "Удалить из избранного"
                  : "Добавить в избранное"
              }
            >
              <Icon
                icon={isFavorite(station.location_id) ? "solar:heart-bold" : "solar:heart-linear"}
                width={20}
                className={`transition-colors ${
                  isFavorite(station.location_id)
                    ? "text-red-500"
                    : "text-gray-300 hover:text-red-400"
                }`}
              />
            </button>
          )}

          {/* Расстояние и навигация */}
          {showDistance && formattedDistance && (
            <button
              onClick={openInMaps}
              className="flex items-center gap-1 text-xs text-ev-green-600 font-medium hover:text-ev-green-700 transition-colors"
              title="Построить маршрут"
            >
              <Icon icon="solar:map-arrow-right-linear" width={14} />
              <span>{formattedDistance}</span>
            </button>
          )}
        </div>
      </div>

      {/* Информация о недоступности */}
      {!isAvailable && (
        <div className="mt-2 pt-2 border-t border-zinc-800">
          <p className="text-2xs text-gray-500">
            {station.status === "maintenance"
              ? "Станция на обслуживании"
              : "Станция временно недоступна"}
          </p>
        </div>
      )}
    </div>
  );
});
