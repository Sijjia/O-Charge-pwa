/**
 * Hook для получения данных по доходам партнёра
 * GET /api/v1/partner/revenue?from=&to=&group_by= + demo fallback
 */

import { useQuery } from "@tanstack/react-query";
import { fetchJson, z } from "@/api/unifiedClient";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";
import { generateRevenueData } from "@/shared/demo/demoData";
import type { DemoRevenueItem } from "@/shared/demo/demoData";
import { logger } from "@/shared/utils/logger";

const zPartnerRevenue = z.object({
  success: z.boolean(),
  data: z.array(
    z.object({
      date: z.string(),
      revenue: z.number(),
      energy_kwh: z.number().optional(),
      sessions: z.number().optional(),
      partner_share: z.number().optional(),
    }),
  ),
});

type Period = "today" | "week" | "month";

export function usePartnerRevenue(period: Period = "month") {
  return useQuery({
    queryKey: ["partner-revenue", period],
    queryFn: async (): Promise<DemoRevenueItem[]> => {
      if (isDemoModeActive()) {
        logger.debug("[usePartnerRevenue] Demo mode — returning mock data");
        return generateRevenueData(period);
      }

      const now = new Date();
      const from = new Date();
      if (period === "today") from.setHours(0, 0, 0, 0);
      else if (period === "week") from.setDate(now.getDate() - 7);
      else from.setDate(1);

      const groupBy = period === "today" ? "hour" : "day";
      const fromDate = from.toISOString().slice(0, 10);
      const toDate = now.toISOString().slice(0, 10);
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        group_by: groupBy,
      });

      const response = await fetchJson(
        `/api/v1/partner/revenue?${params}`,
        { method: "GET" },
        zPartnerRevenue,
      );
      return response.data as DemoRevenueItem[];
    },
    staleTime: 60_000,
  });
}
