/**
 * Hook для получения списка станций партнёра
 * GET /api/v1/partner/stations + demo fallback
 */

import { useQuery } from "@tanstack/react-query";
import { fetchJson, z } from "@/api/unifiedClient";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";
import { DEMO_PARTNER_STATIONS } from "@/shared/demo/demoData";
import type { DemoStation } from "@/shared/demo/demoData";
import { logger } from "@/shared/utils/logger";

const zPartnerStations = z.object({
  success: z.boolean(),
  data: z.array(
    z.object({
      id: z.string(),
      serial_number: z.string(),
      name: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
      latitude: z.number().nullable().optional(),
      longitude: z.number().nullable().optional(),
      status: z.string(),
      power_kw: z.number().nullable().optional(),
      connectors: z.number().nullable().optional(),
      price_per_kwh: z.number().nullable().optional(),
      model: z.string().nullable().optional(),
      last_heartbeat: z.string().nullable().optional(),
    }),
  ),
});

export function usePartnerStations() {
  return useQuery({
    queryKey: ["partner-stations"],
    queryFn: async (): Promise<DemoStation[]> => {
      if (isDemoModeActive()) {
        logger.debug("[usePartnerStations] Demo mode — returning 12 partner stations (not all 35)");
        return DEMO_PARTNER_STATIONS;
      }

      const response = await fetchJson(
        "/api/v1/partner/stations",
        { method: "GET" },
        zPartnerStations,
      );
      return response.data as DemoStation[];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
