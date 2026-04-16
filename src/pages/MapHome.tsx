import { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useLocations } from "../features/locations/hooks/useLocations";
import { StationMap } from "../features/stations/components/StationMap";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useBalance } from "../features/balance/hooks/useBalance";
import { SimpleTopup } from "../features/balance/components/SimpleTopup";

import {
  Link,
  useNavigate,
  useLocation as useRouterLocation,
} from "react-router-dom";
import { debounce } from "../shared/utils/debounce";
import {
  QuickFilters,
  type StationFilter,
} from "../features/stations/components/QuickFilters";
import { MapLegend } from "../shared/components/MapLegend";
import { HelpTip } from "../shared/components/HelpTip";

export default function MapHome() {
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const [activeFilter, setActiveFilter] = useState<StationFilter>("all");
  const [focusLocation, setFocusLocation] = useState<
    { lat: number; lng: number; zoom?: number } | undefined
  >(undefined);
  const { user } = useAuth();
  const { data: balance } = useBalance();

  // Получаем локации со станциями (requestGeolocation: true для карты)
  const { locations, isLoading, error, userLocation } = useLocations(true);

  // Debounced search update (300ms delay)
  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => setDebouncedSearchQuery(value), 300),
    []
  );

  // Update debounced query when search query changes
  useEffect(() => {
    debouncedSetSearch(searchQuery);
  }, [searchQuery, debouncedSetSearch]);

  // Обрабатываем навигацию со страницы списка станций
  useEffect(() => {
    if (routerLocation.state?.focusLocation && locations) {
      setFocusLocation(routerLocation.state.focusLocation);
      navigate(routerLocation.pathname, { replace: true });
    }
  }, [routerLocation.state, locations, navigate, routerLocation.pathname]);

  // Фильтрация по тексту + быстрым фильтрам
  const filteredLocations = useMemo(() => {
    if (!locations) return [];
    let result = locations;

    // Текстовый поиск
    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      result = result.filter(
        (loc) =>
          loc.name.toLowerCase().includes(q) ||
          loc.address.toLowerCase().includes(q),
      );
    }

    // Быстрые фильтры
    switch (activeFilter) {
      case "available":
        result = result.filter((loc) => loc.status === "available");
        break;
      case "fast":
        // Станции с мощностью ≥50 кВт
        result = result.filter(
          (loc) =>
            (loc as unknown as { max_power_kw?: number }).max_power_kw != null &&
            (loc as unknown as { max_power_kw?: number }).max_power_kw! >= 50,
        );
        break;
      case "type2":
        result = result.filter((loc) =>
          (loc as unknown as { connector_types?: string[] }).connector_types
            ?.some((t) => t?.toLowerCase().includes("type2") || t?.toLowerCase().includes("type 2")),
        );
        break;
      case "ccs2":
        result = result.filter((loc) =>
          (loc as unknown as { connector_types?: string[] }).connector_types
            ?.some((t) => t?.toLowerCase().includes("ccs")),
        );
        break;
      case "gbt":
        result = result.filter((loc) =>
          (loc as unknown as { connector_types?: string[] }).connector_types
            ?.some((t) => t?.toLowerCase().includes("gbt") || t?.toLowerCase().includes("gb/t")),
        );
        break;
      default:
        break;
    }

    return result;
  }, [locations, debouncedSearchQuery, activeFilter]);

  // Haversine formula calculation for distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleNearestAvailable = () => {
    if (!userLocation || !locations.length) return;

    let nearestLoc: any = null;
    let minDistance = Infinity;

    locations.forEach(loc => {
      // Look for available
      if (loc.status === "available" || loc.status === "partial") {
        if (loc.latitude && loc.longitude) {
          const dist = calculateDistance(
            userLocation.lat, userLocation.lng,
            loc.latitude, loc.longitude
          );
          if (dist < minDistance) {
            minDistance = dist;
            nearestLoc = loc;
          }
        }
      }
    });

    if (nearestLoc) {
      setFocusLocation({
        lat: nearestLoc.latitude!,
        lng: nearestLoc.longitude!,
        zoom: 15
      });
    }
  };

  const userLocationCoords: [number, number] | undefined = userLocation
    ? [userLocation.lat, userLocation.lng]
    : undefined;

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon icon="solar:danger-triangle-linear" width={48} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
            Ошибка загрузки
          </h2>
          <p className="text-zinc-500 dark:text-gray-400 mb-6">
            Не удалось загрузить список станций
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-red-600 to-red-500 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg shadow-black/40 hover:shadow-xl transition-all"
          >
            Попробовать снова
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Fullscreen Map */}
      <div className="absolute inset-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-zinc-100 dark:bg-zinc-800">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
              </div>
              <p className="text-zinc-500 dark:text-gray-400">Загрузка карты...</p>
            </motion.div>
          </div>
        ) : (
          <StationMap
            locations={filteredLocations}
            userLocation={userLocationCoords}
            focusLocation={focusLocation}
            onNearestAvailableClick={handleNearestAvailable}
          />
        )}
      </div>

      {/* Top Controls Overlay */}
      <div className="absolute top-0 left-0 right-0 px-4 pb-3 safe-area-top pointer-events-none">
        <div className="pointer-events-auto">
          {/* Search Bar */}
          <AnimatePresence mode="wait">
            {showSearch ? (
              <motion.div
                key="search-open"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg shadow-black/10 dark:shadow-black/40 p-2 mb-2"
              >
                <div className="relative">
                  <Icon
                    icon="solar:magnifer-linear"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
                  />
                  <input
                    type="text"
                    placeholder="Найти станцию..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                    autoFocus
                    aria-label="Поиск станций"
                  />
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-gray-300"
                    aria-label="Закрыть поиск"
                  >
                    <Icon icon="solar:close-circle-linear" className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="search-closed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowSearch(true)}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg shadow-black/10 dark:shadow-black/40 px-4 py-3 flex items-center gap-2 w-full mb-2"
                aria-label="Открыть поиск"
              >
                <Icon
                  icon="solar:magnifer-linear"
                  className="w-5 h-5 text-zinc-400 dark:text-gray-400"
                />
                <span className="text-zinc-500 dark:text-gray-500 flex-1 text-left">
                  Поиск станций...
                </span>
                {/* Station count hint */}
                {!isLoading && locations && (
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                    {filteredLocations.length} ст.
                    <HelpTip text="Нажмите на маркер станции на карте, чтобы увидеть детали и начать зарядку." />
                  </span>
                )}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Quick Filters Row */}
          {!showSearch && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <QuickFilters
                value={activeFilter}
                onChange={setActiveFilter}
                count={filteredLocations.length}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Compact Balance Widget (Top Right) — icon + amount only, tap to topup */}
      {user && balance && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setShowTopup(true)}
          className="absolute top-4 right-4 bg-white dark:bg-zinc-900 rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40 py-2 px-3 flex items-center gap-2 safe-area-top"
          style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
          aria-label={`Баланс: ${balance.balance.toFixed(0)} сом. Нажмите чтобы пополнить`}
        >
          <Icon
            icon="solar:wallet-money-bold"
            width={18}
            className="text-red-500 shrink-0"
          />
          <span className="text-sm font-bold text-zinc-900 dark:text-white">
            {balance.balance.toFixed(0)}{" "}
            <span className="text-xs font-medium text-zinc-500">сом</span>
          </span>
          <Icon
            icon="solar:add-circle-bold"
            width={16}
            className="text-red-400"
          />
        </motion.button>
      )}

      {/* Bottom-left controls: List of stations + Map Legend */}
      <div className="absolute left-4 flex flex-col gap-2" style={{ bottom: "calc(var(--nav-height, 72px) + 1.5rem)" }}>
        <Link
          to="/stations"
          className="bg-white dark:bg-zinc-900 rounded-full shadow-lg shadow-black/10 dark:shadow-black/40 p-3 hover:shadow-xl transition-shadow"
          title="Список станций"
          aria-label="Список станций"
        >
          <Icon
            icon="solar:list-bold"
            className="w-6 h-6 text-zinc-600 dark:text-gray-300"
          />
        </Link>
        {/* Map legend */}
        <MapLegend />
      </div>

      {/* Simple Topup Modal */}
      {showTopup && <SimpleTopup onClose={() => setShowTopup(false)} />}
    </div>
  );
}
