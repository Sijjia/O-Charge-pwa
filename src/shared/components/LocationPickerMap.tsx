import { useState, useRef, useEffect, useId, memo } from "react";
import { load } from "@2gis/mapgl";
import { Icon } from "@iconify/react";
import { useThemeStore } from "@/shared/stores/themeStore";

const DGIS_STYLE_LIGHT = "c080bb6a-8134-4993-93a1-5b4d8c36a59b";
const DGIS_STYLE_DARK = "e05ac437-fcc2-4845-ad74-b1de9ce07555";

function getIsDark(mode: "light" | "dark" | "system"): boolean {
  return (
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
}

function getDgisStyleId(mode: "light" | "dark" | "system"): string {
  return getIsDark(mode) ? DGIS_STYLE_DARK : DGIS_STYLE_LIGHT;
}

type MapglAPI = Awaited<ReturnType<typeof load>>;
type MapInstance = InstanceType<MapglAPI["Map"]>;
type MarkerInstance = InstanceType<MapglAPI["Marker"]>;

interface LocationPickerMapProps {
    initialCenter?: [number, number]; // [lat, lng]
    initialZoom?: number;
    value?: { lat: number; lng: number };
    onChange?: (coords: { lat: number; lng: number }) => void;
    readOnly?: boolean;
    className?: string;
}

const BISHKEK_CENTER: [number, number] = [74.5698, 42.8746]; // [lng, lat]

const MapContainer = memo(
    ({ id, className }: { id: string; className?: string }) => (
        <div id={id} className={`w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden ${className || 'h-64'}`} />
    ),
    () => true
);
MapContainer.displayName = "MapContainer";

export function LocationPickerMap({
    initialCenter,
    initialZoom = 13,
    value,
    onChange,
    readOnly = false,
    className
}: LocationPickerMapProps) {
    const reactId = useId();
    const containerId = useRef(`mapgl-${reactId.replace(/:/g, "")}`).current;

    const [mapReady, setMapReady] = useState(false);
    const mapRef = useRef<MapInstance | null>(null);
    const mapglAPIRef = useRef<MapglAPI | null>(null);
    const markerRef = useRef<MarkerInstance | null>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const readOnlyRef = useRef(readOnly);
    readOnlyRef.current = readOnly;
    const themeMode = useThemeStore((s) => s.mode);

    useEffect(() => {
        let map: MapInstance | null = null;
        let destroyed = false;

        const centerLngLat: [number, number] = value
            ? [value.lng, value.lat]
            : initialCenter
                ? [initialCenter[1], initialCenter[0]]
                : BISHKEK_CENTER;

        load().then((mapglAPI) => {
            if (destroyed) return;
            mapglAPIRef.current = mapglAPI;

            map = new mapglAPI.Map(containerId, {
                center: centerLngLat,
                zoom: initialZoom,
                key: import.meta.env.VITE_2GIS_API_KEY || "",
                style: getDgisStyleId(themeMode),
                zoomControl: "bottomRight",
                lang: "ru",
            });

            mapRef.current = map;
            setMapReady(true);

            map.on('click', (e: any) => {
                if (readOnlyRef.current) return;
                if (e.lngLat && onChangeRef.current) {
                    const [lng, lat] = e.lngLat;
                    onChangeRef.current({ lat, lng });
                }
            });
        });

        return () => {
            destroyed = true;
            if (markerRef.current) {
                markerRef.current.destroy();
                markerRef.current = null;
            }
            if (map) {
                map.destroy();
                mapRef.current = null;
            }
        };
    }, []);

    // Переключение стиля карты при смене темы
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        map.setStyleById(getDgisStyleId(themeMode));
    }, [themeMode, mapReady]);

    // Sync Marker with Value
    useEffect(() => {
        const mapglAPI = mapglAPIRef.current;
        const map = mapRef.current;

        if (!mapglAPI || !map || !mapReady) return;

        if (value && value.lat && value.lng) {
            if (!markerRef.current) {
                markerRef.current = new mapglAPI.Marker(map, {
                    coordinates: [value.lng, value.lat],
                    icon: 'https://api.iconify.design/solar/map-point-bold.svg?color=%23ef4444&width=36&height=36',
                    size: [36, 36],
                    anchor: [18, 36]
                });
                map.setCenter([value.lng, value.lat]);
            } else {
                markerRef.current.setCoordinates([value.lng, value.lat]);
                map.setCenter([value.lng, value.lat]);
            }
        } else if (markerRef.current) {
            markerRef.current.destroy();
            markerRef.current = null;
        }
    }, [value, mapReady]);

    return (
        <div className="relative">
            <MapContainer id={containerId} className={className} />
            {!mapReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-sm z-10 rounded-xl">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium font-mono text-zinc-500">INIT_MAPGL...</span>
                    </div>
                </div>
            )}
            {!readOnly && (
                <div className="absolute top-2 left-2 pointer-events-none z-10">
                    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
                        <Icon icon="solar:mouse-minimalistic-linear" className="text-zinc-500" />
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Кликните по карте чтобы выбрать координаты
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
