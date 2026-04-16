import { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { StationCard } from "./StationCard";
import type { Station } from "../../../api/types";
import type { StationWithLocation } from "../types";
import { useFavorites } from "../../favorites/hooks/useFavorites";
import { useAuthStatus } from "../../auth/hooks/useAuth";
import { calculateDistance } from "@/shared/utils/geo";

interface StationListProps {
  stations: StationWithLocation[];
  userLocation?: [number, number];
  onStationSelect?: (station: Station) => void;
  searchQuery?: string;
}

export function StationList({
  stations = [],
  userLocation,
  onStationSelect,
  searchQuery = "",
}: StationListProps) {
  const [sortBy, setSortBy] = useState<"distance" | "name" | "status">(
    "distance",
  );
  const [filterStatus, setFilterStatus] = useState<Station["status"] | "all">(
    "all",
  );
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const { isAuthenticated } = useAuthStatus();
  const { favorites } = useFavorites();

  // calculateDistance теперь импортируется из @/shared/utils/geo

  // Обработанные станции с расстоянием
  const processedStations = useMemo(() => {
    return stations.map((station) => ({
      ...station,
      distance:
        userLocation && station.latitude != null && station.longitude != null
          ? calculateDistance(
              userLocation[0],
              userLocation[1],
              station.latitude,
              station.longitude,
            )
          : undefined,
    }));
  }, [stations, userLocation]);

  // Фильтрация и сортировка
  const filteredAndSortedStations = useMemo(() => {
    let filtered = processedStations;

    // Фильтр по поисковому запросу
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((station) => {
        const name = (station.locationName ?? station.model).toLowerCase();
        const address = (station.locationAddress ?? "").toLowerCase();
        return name.includes(q) || address.includes(q);
      });
    }

    // Фильтр по избранным
    if (showOnlyFavorites && favorites.length > 0) {
      filtered = filtered.filter((station) => favorites.includes(station.id));
    }

    // Фильтр по статусу
    if (filterStatus !== "all") {
      filtered = filtered.filter((station) => station.status === filterStatus);
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "distance":
          if (!a.distance || !b.distance) return 0;
          return a.distance - b.distance;
        case "name":
          return (a.locationName || a.model).localeCompare(
            b.locationName || b.model,
            "ru",
          );
        case "status": {
          const statusOrder: Record<string, number> = {
            active: 0,
            maintenance: 1,
            inactive: 2,
          };
          return (
            (statusOrder[a.status] ?? 999) - (statusOrder[b.status] ?? 999)
          );
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    processedStations,
    searchQuery,
    filterStatus,
    sortBy,
    showOnlyFavorites,
    favorites,
  ]);

  const getStatusCount = (status: Station["status"]) => {
    return processedStations.filter((station) => station.status === status)
      .length;
  };

  const getStatusText = (status: Station["status"] | "all") => {
    const statusMap: Record<Station["status"] | "all", string> = {
      all: "Все",
      active: "Активные",
      inactive: "Неактивные",
      maintenance: "Обслуживание",
    };
    return statusMap[status];
  };

  return (
    <div className="flex flex-col h-full">
      {/* Поиск и фильтры */}
      <div className="bg-zinc-900 p-4 border-b space-y-3">
        {/* Фильтр избранных */}
        {isAuthenticated && favorites.length > 0 && (
          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showOnlyFavorites
                ? "bg-red-500/10 text-red-600 border-2 border-red-500/20"
                : "bg-zinc-900/50 text-gray-300 border-2 border-zinc-800 hover:bg-zinc-800"
            }`}
          >
            <Icon
              icon={showOnlyFavorites ? "solar:heart-bold" : "solar:heart-linear"}
              width={20}
            />
            <span>
              {showOnlyFavorites
                ? "Показаны только избранные"
                : "Показать избранные"}
              {` (${favorites.length})`}
            </span>
          </button>
        )}

        {/* Фильтр по статусу */}
        <div className="flex space-x-2 overflow-x-auto">
          {(["all", "active", "inactive", "maintenance"] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                }`}
              >
                {getStatusText(status)}
                {status !== "all" && (
                  <span className="ml-1 text-xs">
                    ({getStatusCount(status)})
                  </span>
                )}
              </button>
            ),
          )}
        </div>

        {/* Сортировка */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Сортировка:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-sm border border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="distance">По расстоянию</option>
            <option value="name">По названию</option>
            <option value="status">По статусу</option>
          </select>
        </div>
      </div>

      {/* Список станций */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedStations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg
              className="w-12 h-12 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.563M15.97 17.97l-4.97-4.97"
              />
            </svg>
            <p className="text-lg font-medium mb-2">Станции не найдены</p>
            <p className="text-sm text-center">
              {searchQuery
                ? "Попробуйте изменить поисковый запрос"
                : "Попробуйте изменить фильтры"}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="text-sm text-gray-400 mb-3">
              Найдено: {filteredAndSortedStations.length} станций
            </div>
            {filteredAndSortedStations.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                onSelect={() => onStationSelect?.(station)}
                showDistance={!!userLocation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
