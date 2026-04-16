import { useState, useRef, useMemo, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useStations } from "@/features/stations/hooks/useStations";
import { useFavorites } from "@/features/favorites/hooks/useFavorites";
import { useAuthStatus } from "@/features/auth/hooks/useAuth";
import { StationListSkeleton } from "@/shared/components/SkeletonLoaders";
import { StationCardCompact } from "@/features/stations/components/StationCardCompact";

/**
 * Типы фильтров
 */
type FilterType = "all" | "available" | "favorites" | "nearby";

/**
 * Проверяет доступность станции для зарядки
 */
const isStationAvailable = (status: string): boolean => {
  return status === "available" || status === "active";
};

/**
 * Получает текст статуса для отображения
 */
const getStationStatusText = (status: string): string => {
  switch (status) {
    case "available":
    case "active":
      return "";
    case "occupied":
      return "Занята";
    case "maintenance":
      return "На обслуживании";
    case "offline":
    default:
      return "Недоступна";
  }
};

// Export для использования в тестах
export { isStationAvailable, getStationStatusText };

export const StationsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStatus();
  const isFavoritesPage = location.pathname === "/favorites";
  const { isFavorite } = useFavorites();

  const { data: stations = [], isLoading: loading } = useStations(false);

  // Состояние фильтров
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    isFavoritesPage ? "favorites" : "all",
  );

  // Синхронизируем фильтр с URL при смене роута /stations ↔ /favorites
  // (компонент не ремаунтится, поэтому useState не переинициализируется)
  useEffect(() => {
    setActiveFilter(isFavoritesPage ? "favorites" : "all");
  }, [isFavoritesPage]);

  // Уникальные города
  const cities = useMemo(
    () => [...new Set(stations.map((s) => s.city).filter(Boolean))].sort(),
    [stations],
  );
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Фильтрация станций
  const filteredStations = useMemo(() => {
    let result = [...stations];

    // Поиск по названию и адресу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.locationName?.toLowerCase().includes(query) ||
          s.locationAddress?.toLowerCase().includes(query) ||
          s.model?.toLowerCase().includes(query),
      );
    }

    // Фильтр по типу
    switch (activeFilter) {
      case "available":
        result = result.filter((s) => isStationAvailable(s.status));
        break;
      case "favorites":
        result = result.filter(
          (s) => s.location_id && isFavorite(s.location_id),
        );
        break;
      case "nearby":
        // Сортировка по расстоянию (если есть)
        result = result
          .filter((s) => s.distance !== undefined)
          .sort((a, b) => (a.distance || 0) - (b.distance || 0));
        break;
    }

    // Фильтр по городу
    if (selectedCity) {
      result = result.filter((s) => s.city === selectedCity);
    }

    return result;
  }, [stations, searchQuery, activeFilter, selectedCity, isFavorite]);

  // Виртуализация для длинных списков
  const parentRef = useRef<HTMLDivElement>(null);
  const shouldVirtualize = filteredStations.length >= 15;

  const virtualizer = useVirtualizer({
    count: filteredStations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Компактные карточки ~100px
    enabled: shouldVirtualize,
  });

  // Фильтр-чипы
  const filterChips: Array<{
    id: FilterType;
    label: string;
    icon?: React.ReactNode;
  }> = [
    { id: "all", label: "Все" },
    { id: "available", label: "Свободные" },
    { id: "nearby", label: "Рядом", icon: <Icon icon="solar:map-point-linear" width={14} /> },
    ...(isAuthenticated
      ? [
          {
            id: "favorites" as FilterType,
            label: "Избранные",
            icon: <Icon icon="solar:heart-linear" width={14} />,
          },
        ]
      : []),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] transition-colors duration-300">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm shadow-black/5 dark:shadow-black/20 border-b border-zinc-200 dark:border-white/5 sticky-header-safe transition-colors duration-300">
          <div className="flex items-center px-4 pb-4">
            <button
              onClick={() => navigate(-1)}
              className="mr-3 p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full min-w-touch min-h-touch flex items-center justify-center transition-colors"
            >
              <Icon icon="solar:arrow-left-linear" width={24} className="text-zinc-600 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
              {isFavoritesPage ? "Избранное" : "Станции"}
            </h1>
          </div>
        </div>
        <StationListSkeleton />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-zinc-50 dark:bg-[#050507] text-zinc-900 dark:text-zinc-100 transition-colors duration-300"
      style={{ paddingBottom: "calc(var(--nav-height) + 16px)" }}
    >
      {/* Header */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm shadow-black/5 dark:shadow-black/20 border-b border-zinc-200 dark:border-white/5 sticky-header-safe z-10 transition-colors duration-300">
        <div className="flex items-center px-4 pb-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 min-w-touch min-h-touch flex items-center justify-center transition-colors"
          >
            <Icon icon="solar:arrow-left-linear" width={24} className="text-zinc-600 dark:text-zinc-300" />
          </button>
          <h1 className="text-lg font-semibold ml-1 text-zinc-900 dark:text-white">
            {isFavoritesPage ? "Избранное" : "Станции"}
          </h1>
          <span className="ml-auto text-sm text-zinc-500 dark:text-gray-500">
            {filteredStations.length} станций
          </span>
        </div>

        {/* Поиск */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Icon icon="solar:magnifer-linear" width={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск станции..."
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-transparent rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:bg-zinc-900 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
              >
                <Icon icon="solar:close-linear" width={16} className="text-zinc-400 dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Фильтр-чипы */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filterChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id)}
                className={`ev-chip flex-shrink-0 ${
                  activeFilter === chip.id
                    ? "ev-chip--active"
                    : "ev-chip--default"
                }`}
              >
                {chip.icon && <span className="mr-1">{chip.icon}</span>}
                {chip.label}
              </button>
            ))}

            {/* Разделитель */}
            {cities.length > 1 && (
              <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 self-center mx-1 flex-shrink-0 transition-colors" />
            )}

            {/* Города */}
            {cities.length > 1 &&
              cities.map((city) => (
                <button
                  key={city}
                  onClick={() =>
                    setSelectedCity(
                      selectedCity === city ? null : (city ?? null),
                    )
                  }
                  className={`ev-chip flex-shrink-0 ${
                    selectedCity === city
                      ? "ev-chip--active"
                      : "ev-chip--default"
                  }`}
                >
                  {city}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Список станций */}
      <div
        ref={parentRef}
        className="px-4 pt-3"
        style={{
          height: shouldVirtualize ? "calc(100vh - 200px)" : "auto",
          overflow: shouldVirtualize ? "auto" : "visible",
        }}
      >
        {filteredStations.length === 0 ? (
          <div className="text-center py-12">
            {activeFilter === "favorites" ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none flex items-center justify-center mx-auto mb-4 text-zinc-400 dark:text-zinc-500 transition-colors">
                  <Icon icon="solar:heart-broken-linear" width={32} />
                </div>
                <p className="text-zinc-700 dark:text-gray-500 text-base font-medium">
                  Список пуст
                </p>
                <p className="text-zinc-500 dark:text-gray-400 text-sm mt-1 max-w-[240px] mx-auto leading-relaxed">
                  Добавьте станции в избранное для быстрого доступа к ним
                </p>
              </>
            ) : searchQuery ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none flex items-center justify-center mx-auto mb-4 text-zinc-400 dark:text-zinc-500 transition-colors">
                  <Icon icon="solar:magnifer-linear" width={32} />
                </div>
                <p className="text-zinc-700 dark:text-gray-500 text-base font-medium">
                  Ничего не найдено
                </p>
                <p className="text-zinc-500 dark:text-gray-400 text-sm mt-1">
                  Попробуйте изменить запрос
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none flex items-center justify-center mx-auto mb-4 text-zinc-400 dark:text-zinc-500 transition-colors">
                  <Icon icon="solar:map-point-linear" width={32} />
                </div>
                <p className="text-zinc-700 dark:text-gray-500 text-base font-medium">
                  Станции не найдены
                </p>
                <p className="text-zinc-500 dark:text-gray-400 text-sm mt-1">
                  Попробуйте изменить фильтры
                </p>
              </>
            )}
          </div>
        ) : shouldVirtualize ? (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const station = filteredStations[virtualItem.index];
              if (!station) return null;

              return (
                <div
                  key={station.id}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  className="pb-3"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <StationCardCompact
                    station={station}
                    onSelect={() =>
                      navigate(`/charging/${station.serial_number}`)
                    }
                    showDistance={
                      activeFilter === "nearby" || !!station.distance
                    }
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStations.map((station) => (
              <StationCardCompact
                key={station.id}
                station={station}
                onSelect={() => navigate(`/charging/${station.serial_number}`)}
                showDistance={activeFilter === "nearby" || !!station.distance}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
