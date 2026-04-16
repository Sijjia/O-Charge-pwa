import { useState, useRef, useMemo, useEffect, useCallback, memo } from "react";
import { load } from "@2gis/mapgl";
import { Clusterer } from "@2gis/mapgl-clusterer";
import { AnimatePresence } from "framer-motion";
import { StationSelectionModal } from "@/shared/components/StationSelectionModal";
import type { Location } from "@/api/types";
import { logger } from "@/shared/utils/logger";
import { useThemeStore } from "@/shared/stores/themeStore";
import {
  createLocationMarkerSVG,
  createUserLocationMarkerSVG,
  createClusterMarkerSVG,
} from "@/shared/utils/mapMarkers";

const DGIS_STYLE_LIGHT = "c080bb6a-8134-4993-93a1-5b4d8c36a59b";
const DGIS_STYLE_DARK = "e05ac437-fcc2-4845-ad74-b1de9ce07555";

function getDgisStyleId(mode: "light" | "dark" | "system"): string {
  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  return isDark ? DGIS_STYLE_DARK : DGIS_STYLE_LIGHT;
}

// 2GIS MapGL types
type MapglAPI = Awaited<ReturnType<typeof load>>;
type MapInstance = InstanceType<MapglAPI["Map"]>;

interface StationMapProps {
  locations: Location[];
  userLocation?: [number, number]; // [lat, lng]
  focusLocation?: { lat: number; lng: number; zoom?: number };
  /** Автоцентрироваться на местоположении пользователя при первой загрузке */
  autoCenterOnUser?: boolean;
  /** Коллбэк для поиска ближайшей свободной станции */
  onNearestAvailableClick?: () => void;
}

// Bishkek center [lng, lat] — 2GIS uses [lng, lat] format
const BISHKEK_CENTER: [number, number] = [74.5698, 42.8746];

/**
 * Мемоизированный контейнер карты — предотвращает ре-рендер DOM
 */
const MapContainer = memo(
  ({ id }: { id: string }) => (
    <div id={id} style={{ width: "100%", height: "100%" }} />
  ),
  () => true,
);
MapContainer.displayName = "MapContainer";

/**
 * Компонент карты 2GIS с маркерами локаций
 *
 * Логика цветов маркеров:
 * - ЗЕЛЁНЫЙ: location.status === 'available' или 'partial'
 * - ЖЁЛТЫЙ: location.status === 'occupied'
 * - СЕРЫЙ: location.status === 'offline' или 'maintenance'
 */
export function StationMap({
  locations = [],
  userLocation,
  focusLocation,
  autoCenterOnUser = true,
  onNearestAvailableClick,
}: StationMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [hasAutoCentered, setHasAutoCentered] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<MapInstance | null>(null);
  const mapglAPIRef = useRef<MapglAPI | null>(null);
  const clustererRef = useRef<Clusterer | null>(null);
  const userMarkerRef = useRef<InstanceType<MapglAPI["Marker"]> | null>(null);
  const locationMapRef = useRef<Map<string, Location>>(new Map());

  /**
   * Собирает summary коннекторов из данных локации
   */
  const getConnectorSummary = useCallback((location: Location) => {
    if (location.status === "offline" || location.status === "maintenance") {
      const total =
        location.connectors_summary?.total || location.connectors_count || 1;
      return { available: 0, occupied: 0, faulted: 0, offline: total };
    }

    if (location.connectors_summary) {
      return {
        available: location.connectors_summary.available || 0,
        occupied: location.connectors_summary.occupied || 0,
        faulted: location.connectors_summary.faulted || 0,
        offline: 0,
      };
    }

    switch (location.status) {
      case "available":
        return { available: 1, occupied: 0, faulted: 0, offline: 0 };
      case "partial":
        return { available: 1, occupied: 1, faulted: 0, offline: 0 };
      case "occupied":
        return { available: 0, occupied: 1, faulted: 0, offline: 0 };
      default:
        return { available: 0, occupied: 0, faulted: 0, offline: 1 };
    }
  }, []);

  /**
   * Кэш иконок маркеров
   */
  const iconCache = useMemo(() => {
    const cache: Record<string, string> = {};
    const validLocations = locations.filter(
      (loc) => loc.latitude != null && loc.longitude != null,
    );

    validLocations.forEach((location) => {
      const summary = getConnectorSummary(location);
      const stationsCount =
        location.stations?.length || location.stations_count || 1;
      const cacheKey = `${summary.available}-${summary.occupied}-${summary.faulted}-${summary.offline}-${stationsCount}`;

      if (!cache[cacheKey]) {
        cache[cacheKey] = createLocationMarkerSVG(summary, {
          size: 44,
          ringWidth: 5,
          stationsCount,
          showIcon: stationsCount === 1,
        });
      }
    });

    return cache;
  }, [locations, getConnectorSummary]);

  /**
   * Иконка маркера пользователя
   */
  const userIconUrl = useMemo(() => createUserLocationMarkerSVG(28), []);

  /**
   * Иконка кластера
   */
  const clusterIconUrl = useMemo(() => createClusterMarkerSVG(0, 48), []);

  const themeMode = useThemeStore((s) => s.mode);

  /**
   * Инициализация карты 2GIS
   */
  useEffect(() => {
    let map: MapInstance | null = null;
    let destroyed = false;

    // Определяем начальный центр
    const initialCenter: [number, number] = focusLocation
      ? [focusLocation.lng, focusLocation.lat]
      : userLocation
        ? [userLocation[1], userLocation[0]] // [lat, lng] → [lng, lat]
        : BISHKEK_CENTER;

    const initialZoom = focusLocation?.zoom || 13;

    load().then((mapglAPI) => {
      if (destroyed) return;

      mapglAPIRef.current = mapglAPI;

      map = new mapglAPI.Map("dgis-map-container", {
        center: initialCenter,
        zoom: initialZoom,
        key: import.meta.env.VITE_2GIS_API_KEY || "",
        style: getDgisStyleId(themeMode),
        zoomControl: "bottomRight",
        lang: "ru",
      });

      mapRef.current = map;
      setMapReady(true);

      logger.debug("[StationMap] 2GIS map initialized", {
        center: initialCenter,
        zoom: initialZoom,
      });
    });

    return () => {
      destroyed = true;
      if (clustererRef.current) {
        clustererRef.current.destroy();
        clustererRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.destroy();
        userMarkerRef.current = null;
      }
      if (map) {
        map.destroy();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Переключение стиля карты при смене темы
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.setStyleById(getDgisStyleId(themeMode));
  }, [themeMode, mapReady]);

  /**
   * Автоцентрирование на пользователе
   */
  useEffect(() => {
    if (
      autoCenterOnUser &&
      userLocation &&
      !hasAutoCentered &&
      !focusLocation &&
      mapRef.current
    ) {
      mapRef.current.setCenter([userLocation[1], userLocation[0]]); // [lat, lng] → [lng, lat]
      mapRef.current.setZoom(14);
      setHasAutoCentered(true);
      logger.debug(
        "[StationMap] Auto-centered on user location:",
        userLocation,
      );
    }
  }, [userLocation, autoCenterOnUser, hasAutoCentered, focusLocation]);

  /**
   * Маркер местоположения пользователя
   */
  useEffect(() => {
    const mapglAPI = mapglAPIRef.current;
    const map = mapRef.current;
    if (!mapglAPI || !map) return;

    // Удаляем старый маркер
    if (userMarkerRef.current) {
      userMarkerRef.current.destroy();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const marker = new mapglAPI.Marker(map, {
        coordinates: [userLocation[1], userLocation[0]], // [lat, lng] → [lng, lat]
        icon: userIconUrl,
        size: [28, 28],
        anchor: [14, 14],
      });
      userMarkerRef.current = marker;
    }
  }, [userLocation, userIconUrl]);

  /**
   * Обновление маркеров и кластеров при изменении locations
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Ждём готовности карты
    const setupMarkers = () => {
      // Удаляем старый кластер
      if (clustererRef.current) {
        clustererRef.current.destroy();
        clustererRef.current = null;
      }

      const validLocations = locations.filter(
        (loc) => loc.latitude != null && loc.longitude != null,
      );

      logger.debug("[StationMap] Rendering markers:", validLocations.length);

      // Строим карту location ID → Location для обработчика кликов
      const locMap = new Map<string, Location>();
      const inputMarkers = validLocations.map((location) => {
        const summary = getConnectorSummary(location);
        const stationsCount =
          location.stations?.length || location.stations_count || 1;
        const cacheKey = `${summary.available}-${summary.occupied}-${summary.faulted}-${summary.offline}-${stationsCount}`;
        const iconUrl = iconCache[cacheKey];

        locMap.set(location.id, location);

        return {
          coordinates: [location.longitude!, location.latitude!] as [
            number,
            number,
          ],
          icon: iconUrl,
          size: [44, 44] as [number, number],
          userData: location.id,
        };
      });

      locationMapRef.current = locMap;

      // Создаём кластер
      const clusterer = new Clusterer(map, {
        radius: 60,
        clusterStyle: (pointsCount: number) => ({
          type: "html" as const,
          html: `<div style="
            width: 48px; height: 48px;
            background: url('${clusterIconUrl}') center/contain no-repeat;
            display: flex; align-items: center; justify-content: center;
            font-family: Inter, system-ui, sans-serif;
            font-size: 13px; font-weight: 600; color: #6B7280;
            cursor: pointer;
          ">${pointsCount}</div>`,
        }),
      });

      clusterer.load(inputMarkers);

      // Обработчик кликов по маркерам
      clusterer.on("click", (event) => {
        if (event.target.type === "marker") {
          const locationId = event.target.data.userData as string;
          const location = locationMapRef.current.get(locationId);
          if (location) {
            setSelectedLocation(location);
          }
        } else if (event.target.type === "cluster") {
          // Зум на кластер
          const clusterData = event.target.data;
          if (clusterData && Array.isArray(clusterData)) {
            const coords = clusterData.map(
              (m: { coordinates: number[] }) => m.coordinates as [number, number],
            );
            if (coords.length > 0) {
              const lngs = coords.map((c: [number, number]) => c[0]);
              const lats = coords.map((c: [number, number]) => c[1]);
              const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
              const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
              map.setCenter([centerLng, centerLat]);
              map.setZoom(map.getZoom() + 2);
            }
          }
        }
      });

      clustererRef.current = clusterer;
    };

    // Небольшая задержка чтобы карта успела инициализироваться
    const timer = setTimeout(setupMarkers, 300);
    return () => clearTimeout(timer);
  }, [locations, iconCache, clusterIconUrl, getConnectorSummary, mapReady]);

  /**
   * Закрытие модального окна
   */
  const handleCloseModal = useCallback(() => {
    setSelectedLocation(null);
  }, []);

  return (
    <div className="relative h-full w-full">
      <MapContainer id="dgis-map-container" />

      {/* Floating Nearest Available Button */}
      {userLocation && onNearestAvailableClick && (
        <button
          onClick={onNearestAvailableClick}
          className="absolute right-4 bottom-32 z-10 w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
          aria-label="Найти ближайшую свободную станцию"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor" />
            <circle cx="12" cy="9" r="2.5" fill="white" className="dark:fill-zinc-800" />
          </svg>
          {/* Pulse effect */}
          <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-800 rounded-full animate-pulse" />
        </button>
      )}

      {/* Модальное окно выбора станции */}
      <AnimatePresence>
        {selectedLocation && selectedLocation.stations && (
          <StationSelectionModal
            stations={selectedLocation.stations}
            locationName={selectedLocation.name}
            isOpen={!!selectedLocation}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
