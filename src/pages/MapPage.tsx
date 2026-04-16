import { useState, useMemo, useCallback } from "react";
import { Icon } from "@iconify/react";
import { StationMap } from "../features/stations/components/StationMap";
import { useLocations } from "../features/locations/hooks/useLocations";

export const MapPage = () => {
  const { locations, isLoading, error, userLocation } = useLocations(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number; zoom?: number } | undefined>();

  // Filter locations by search query (name, address, station IDs)
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const q = searchQuery.toLowerCase().trim();
    return locations.filter(
      (loc) =>
        loc.name?.toLowerCase().includes(q) ||
        loc.address?.toLowerCase().includes(q) ||
        loc.city?.toLowerCase().includes(q) ||
        loc.stations?.some((s) => s.id?.toLowerCase().includes(q)),
    );
  }, [locations, searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleCenterOnUser = useCallback(() => {
    if (userLocation) {
      setFocusLocation({ lat: userLocation.lat, lng: userLocation.lng, zoom: 15 });
      // Reset after a tick so it can be re-triggered
      setTimeout(() => setFocusLocation(undefined), 100);
    }
  }, [userLocation]);

  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden transition-colors duration-500">
      {/* Top Search Bar */}
      <div className="absolute top-0 inset-x-0 z-20 p-4 pt-12 bg-gradient-to-b from-white/90 via-white/50 to-transparent dark:from-zinc-950/80 dark:via-zinc-950/40 dark:to-transparent pointer-events-none transition-colors duration-500">
        <div className="relative group pointer-events-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon
              icon="solar:magnifer-linear"
              width={20}
              className="text-zinc-400 dark:text-zinc-500 group-focus-within:text-zinc-800 dark:group-focus-within:text-white transition-colors"
            />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-12 py-3.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-1 focus:ring-red-600/50 focus:border-red-600/50 outline-none shadow-xl shadow-zinc-200/50 dark:shadow-black/20 transition-all"
            placeholder="Поиск по названию или адресу..."
          />
          {searchQuery && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={handleClearSearch}
                className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <Icon icon="solar:close-circle-linear" width={20} />
              </button>
            </div>
          )}
        </div>

        {/* Search results count when filtering */}
        {searchQuery.trim() && (
          <div className="mt-2 pointer-events-auto">
            <span className="px-3 py-1 text-xs rounded-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300">
              {filteredLocations.length === 0
                ? "Ничего не найдено"
                : `Найдено: ${filteredLocations.length}`}
            </span>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {!navigator.onLine && locations.length > 0 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
            <span className="px-3 py-1 text-xs rounded-full bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
              Оффлайн данные (карта может быть ограничена)
            </span>
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="spinner" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full p-4 text-center">
            <p className="text-red-600">
              Ошибка загрузки станций. Попробуйте позже.
            </p>
          </div>
        ) : (
          <StationMap
            locations={filteredLocations}
            userLocation={
              userLocation ? [userLocation.lat, userLocation.lng] : undefined
            }
            focusLocation={focusLocation}
          />
        )}
      </div>

      {/* GPS Button */}
      {userLocation && (
        <div className="absolute bottom-24 right-4 z-20">
          <button
            onClick={handleCenterOnUser}
            className="w-11 h-11 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 dark:text-white shadow-lg shadow-zinc-200/50 dark:shadow-black/20 active:scale-95 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
            title="Моё местоположение"
          >
            <Icon icon="solar:gps-linear" width={22} />
          </button>
        </div>
      )}
    </div>
  );
};
