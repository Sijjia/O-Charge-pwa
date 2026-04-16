/**
 * Hook для получения списка сессий партнёра
 * GET /api/v1/partner/sessions?page=&station_id= + demo fallback
 */

import { useQuery } from "@tanstack/react-query";
import { fetchJson, z } from "@/api/unifiedClient";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";
import { DEMO_PARTNER_SESSIONS } from "@/shared/demo/demoData";
import type { DemoSession } from "@/shared/demo/demoData";
import { logger } from "@/shared/utils/logger";

const zPartnerSessions = z.object({
  success: z.boolean(),
  data: z.array(
    z.object({
      id: z.string(),
      station_id: z.string(),
      station_name: z.string().optional(),
      connector_id: z.number().optional(),
      status: z.string(),
      energy_kwh: z.number(),
      amount: z.number(),
      partner_share: z.number().optional(),
      started_at: z.string(),
      ended_at: z.string().nullable(),
      duration_minutes: z.number().optional(),
      user_phone: z.string().optional(),
    }),
  ),
  total: z.number().optional(),
  page: z.number().optional(),
  per_page: z.number().optional(),
});

interface UsePartnerSessionsOptions {
  page?: number;
  stationId?: string;
}

export function usePartnerSessions(options: UsePartnerSessionsOptions = {}) {
  const { page = 1, stationId } = options;

  return useQuery({
    queryKey: ["partner-sessions", page, stationId],
    queryFn: async (): Promise<{ sessions: DemoSession[]; total: number }> => {
      if (isDemoModeActive()) {
        logger.debug("[usePartnerSessions] Demo mode — returning partner-filtered sessions");
        let filtered = DEMO_PARTNER_SESSIONS;
        if (stationId) {
          filtered = filtered.filter((s) => s.station_id === stationId);
        }
        const perPage = 10;
        const start = (page - 1) * perPage;
        return {
          sessions: filtered.slice(start, start + perPage),
          total: filtered.length,
        };
      }

      const params = new URLSearchParams({ page: String(page) });
      if (stationId) params.set("station_id", stationId);

      const response = await fetchJson(
        `/api/v1/partner/sessions?${params}`,
        { method: "GET" },
        zPartnerSessions,
      );
      return {
        sessions: response.data as DemoSession[],
        total: response.total ?? response.data.length,
      };
    },
    staleTime: 30_000,
  });
}
