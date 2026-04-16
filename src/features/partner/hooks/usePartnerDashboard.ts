/**
 * Hook для получения данных dashboard партнёра
 * GET /api/v1/partner/dashboard + demo fallback
 */

import { useQuery } from "@tanstack/react-query";
import { fetchJson, z } from "@/api/unifiedClient";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";
import { demoPartnerDashboard } from "@/shared/demo/demoData";
import type { DemoDashboard } from "@/shared/demo/demoData";
import { logger } from "@/shared/utils/logger";

const zPartnerDashboard = z.object({
  success: z.boolean(),
  data: z.object({
    stations_total: z.number(),
    stations_online: z.number(),
    stations_charging: z.number().optional(),
    stations_offline: z.number().optional(),
    sessions_today: z.number(),
    sessions_month: z.number(),
    revenue_today: z.number(),
    revenue_week: z.number().optional(),
    revenue_month: z.number(),
    revenue_total: z.number().optional(),
    energy_today_kwh: z.number().optional(),
    energy_month_kwh: z.number().optional(),
    partner_share_percent: z.number().optional(),
    partner_revenue_month: z.number().optional(),
  }),
});

export function usePartnerDashboard() {
  return useQuery({
    queryKey: ["partner-dashboard"],
    queryFn: async (): Promise<DemoDashboard> => {
      if (isDemoModeActive()) {
        logger.debug("[usePartnerDashboard] Demo mode — returning mock data");
        return demoPartnerDashboard;
      }

      const response = await fetchJson(
        "/api/v1/partner/dashboard",
        { method: "GET" },
        zPartnerDashboard,
      );
      return response.data as DemoDashboard;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
