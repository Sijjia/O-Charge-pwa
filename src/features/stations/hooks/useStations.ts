import { useQuery } from "@tanstack/react-query";
import { rpApi } from "@/services/rpApi";
import { logger } from "@/shared/utils/logger";
import { usePageVisibility } from "@/shared/hooks/usePageVisibility";
import {
  extractStationsFromLocations,
  type StationWithLocation,
} from "../types";

// Get all stations from API with location data
export const useStations = (
  onlyAvailable = true,
  userLocation?: { lat: number; lng: number },
) => {
  const isPageVisible = usePageVisibility();

  return useQuery<StationWithLocation[]>({
    queryKey: ["stations-v3", onlyAvailable, userLocation],
    queryFn: async () => {
      try {
        // Получаем все локации со станциями
        const locations = await rpApi.getLocations(true);

        // Извлекаем и обогащаем станции данными локаций
        const allStations = extractStationsFromLocations(
          locations,
          userLocation,
        );

        // Фильтруем только активные станции если требуется
        const filteredStations = onlyAvailable
          ? allStations.filter((s) => s.status === "active")
          : allStations;

        return filteredStations;
      } catch (error) {
        logger.error("[useStations] Failed to load stations", { onlyAvailable, userLocation, error });
        throw error;
      }
    },
    staleTime: 1000 * 60, // 60 seconds - синхронизировано с useLocations
    gcTime: 1000 * 60 * 60, // 1 hour - храним в кеше
    refetchInterval: isPageVisible ? 1000 * 60 : false, // Автообновление каждые 60 секунд (Page Visibility API)
    refetchIntervalInBackground: false, // НЕ обновлять когда приложение в фоне (экономия батареи)
    refetchOnWindowFocus: true, // Обновлять при возврате в приложение
    refetchOnReconnect: true, // Обновлять при восстановлении сети
    retry: 2, // Retry failed requests in production
  });
};

// Get single station status (returns Station from API)
export const useStationStatus = (stationId: string) => {
  const isPageVisible = usePageVisibility();

  return useQuery({
    queryKey: ["station-status", stationId],
    queryFn: async () => {
      return await rpApi.getStationStatus(stationId);
    },
    enabled: !!stationId,
    refetchInterval: isPageVisible ? 45000 : false, // Update every 45 seconds (Page Visibility API)
  });
};

// Хук для поиска станций по разным полям
export const useStationSearch = (
  query: string,
  onlyAvailable = true,
  userLocation?: { lat: number; lng: number },
) => {
  const { data: allStations, ...restQuery } = useStations(
    onlyAvailable,
    userLocation,
  );

  const filteredStations = allStations?.filter(
    (station) =>
      station.model.toLowerCase().includes(query.toLowerCase()) ||
      station.serial_number.toLowerCase().includes(query.toLowerCase()) ||
      station.manufacturer.toLowerCase().includes(query.toLowerCase()) ||
      station.locationName?.toLowerCase().includes(query.toLowerCase()) ||
      station.locationAddress?.toLowerCase().includes(query.toLowerCase()),
  );

  return {
    data: filteredStations,
    ...restQuery,
  };
};

// Хук для получения статистики станций
export const useStationsStats = () => {
  const { data: stations } = useStations(false); // Получаем все станции для статистики

  const stats = {
    total: stations?.length || 0,
    active: stations?.filter((s) => s.status === "active").length || 0,
    inactive: stations?.filter((s) => s.status === "inactive").length || 0,
    maintenance:
      stations?.filter((s) => s.status === "maintenance").length || 0,
    totalConnectors:
      stations?.reduce((sum, s) => sum + s.connectors_count, 0) || 0,
    totalPower: stations?.reduce((sum, s) => sum + s.power_capacity, 0) || 0,
  };

  return stats;
};
