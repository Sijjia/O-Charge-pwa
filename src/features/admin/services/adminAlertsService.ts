import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";

const AlertSchema = z.object({
  id: z.string(),
  type: z.string(),
  severity: z.enum(["critical", "warning", "info"]),
  title: z.string(),
  message: z.string(),
  station_id: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  acknowledged: z.boolean(),
});

const AlertsResponseSchema = z.object({
  success: z.boolean(),
  alerts: z.array(AlertSchema),
  total: z.number(),
  unacknowledged: z.number(),
});

export type Alert = z.infer<typeof AlertSchema>;
export type AlertsResponse = z.infer<typeof AlertsResponseSchema>;

const BASE = "/api/v1/admin/alerts";

export const adminAlertsService = {
  async getAlerts(severity?: string): Promise<AlertsResponse> {
    const sp = new URLSearchParams();
    if (severity) sp.set("severity", severity);
    const query = sp.toString();
    return fetchJson(
      query ? `${BASE}?${query}` : BASE,
      { method: "GET" },
      AlertsResponseSchema,
    );
  },

  async acknowledge(alertId: string) {
    return fetchJson(
      `${BASE}/${alertId}/acknowledge`,
      { method: "POST" },
      z.object({ success: z.boolean(), message: z.string() }),
    );
  },
};
