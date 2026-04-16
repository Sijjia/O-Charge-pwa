import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { unifiedClient } from "@/api/unifiedClient";
import {
  LocationsResponseSchema,
  StationStatusSchema,
} from "../schemas/offlineSchemas";
import { addBreadcrumb } from "@/shared/monitoring/sentry";
import { logger } from "@/shared/utils/logger";

const LOCATIONS_QK = ["locations", "include_stations=true"] as const;
const STATION_STATUS_QK = (id: string) => ["station-status", id] as const;

export function useWarmupOfflineData() {
  useEffect(() => {
    let cancelled = false;

    const warmup = async () => {
      try {
        addBreadcrumb({
          category: "pwa",
          message: "warmup:start",
          level: "info",
        });
        // 1) Prefetch locations with stations
        await queryClient.prefetchQuery({
          queryKey: LOCATIONS_QK,
          queryFn: async () => {
            const res = await unifiedClient.get(
              "/api/v1/locations?include_stations=true",
              {
                schema: LocationsResponseSchema,
              },
            );
            return res;
          },
          staleTime: 1000 * 60 * 5,
        });

        // 2) Prefetch last viewed station status (if any)
        const lastStationId = safeGetLocalStorage("last_station_id");
        if (lastStationId) {
          await queryClient.prefetchQuery({
            queryKey: STATION_STATUS_QK(lastStationId),
            queryFn: async () => {
              return unifiedClient.get(
                `/api/v1/station/status/${encodeURIComponent(lastStationId)}`,
                {
                  schema: StationStatusSchema,
                },
              );
            },
            staleTime: 1000 * 60 * 2,
          });
        }

        if (!cancelled) {
          addBreadcrumb({
            category: "pwa",
            message: "warmup:done",
            level: "info",
          });
          if (!import.meta.env.PROD) logger.info("[PWA] Warmup completed");
        }
      } catch (error) {
        if (!import.meta.env.PROD) logger.error("[PWA] Warmup failed", error);
      }
    };

    // fire and forget
    void warmup();

    return () => {
      cancelled = true;
    };
  }, []);
}

function safeGetLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
