import type { Station, Location } from "../../../api/types";
import { calculateDistance } from "@/shared/utils/geo";

/**
 * Тип для UI компонентов - объединяет Station с данными Location
 * Используется в компонентах StationCard, StationList, StationMap
 */
export interface StationWithLocation extends Station {
  // Данные из Location
  locationName?: string;
  locationAddress?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
}

/**
 * Утилита для преобразования Station из Location в StationWithLocation
 */
export function enrichStationWithLocation(
  station: Station,
  location: Location,
  userLocation?: { lat: number; lng: number },
): StationWithLocation {
  const enriched: StationWithLocation = {
    ...station,
    location_id: location.id, // ← КРИТИЧНО: добавляем location_id для favorites!
    locationName: location.name,
    locationAddress: location.address,
    city: location.city ?? undefined,
    latitude: location.latitude,
    longitude: location.longitude,
  };

  // Добавляем расстояние если есть координаты пользователя
  if (userLocation && location.latitude && location.longitude) {
    enriched.distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      location.latitude,
      location.longitude,
    );
  }

  return enriched;
}

/**
 * Утилита для извлечения всех станций из локаций с обогащением
 * Optimized: single loop instead of flatMap + map
 */
export function extractStationsFromLocations(
  locations: Location[],
  userLocation?: { lat: number; lng: number },
): StationWithLocation[] {
  const result: StationWithLocation[] = [];

  for (let i = 0; i < locations.length; i++) {
    const location = locations[i];
    if (!location) continue;

    const stations = location.stations || [];

    for (let j = 0; j < stations.length; j++) {
      const station = stations[j];
      if (!station) continue;

      result.push(enrichStationWithLocation(station, location, userLocation));
    }
  }

  return result;
}

// calculateDistance теперь импортируется из @/shared/utils/geo
