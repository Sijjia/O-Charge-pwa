import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";

// --- Zod Schemas ---

const PartnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  company_name: z.string().nullable(),
  station_count: z.number(),
  total_revenue: z.number(),
  commission_rate: z.number(),
  is_active: z.boolean(),
  created_at: z.string().nullable(),
});

const PartnersListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(PartnerSchema),
  total: z.number(),
}).passthrough();

// --- Types (inferred from schemas) ---

export type Partner = z.infer<typeof PartnerSchema>;
export type PartnersListResponse = z.infer<typeof PartnersListResponseSchema>;

export interface PartnerFilters {
  limit?: number;
  offset?: number;
  search?: string;
}

const BASE = "/api/v1/admin/partners";

// --- Partner Detail Schema ---

const PartnerStationSchema = z.object({
  id: z.string(),
  serial_number: z.string(),
  model: z.string(),
  location: z.string(),
  status: z.enum(["active", "inactive", "maintenance"]),
  power_capacity: z.number(),
  total_revenue: z.number(),
  last_heartbeat: z.string(),
});

const RevenueByDaySchema = z.object({
  date: z.string(),
  revenue: z.number(),
});

const PartnerDetailSchema = z.object({
  id: z.string(),
  company_name: z.string(),
  contact_name: z.string(),
  phone: z.string(),
  email: z.string(),
  billing_type: z.enum(["prepaid", "postpaid"]),
  balance: z.number(),
  revenue_share: z.number(),
  kpi: z.object({
    total_stations: z.number(),
    active_sessions: z.number(),
    today_revenue: z.number(),
    month_revenue: z.number(),
  }),
  stations: z.array(PartnerStationSchema),
  revenue_by_day: z.array(RevenueByDaySchema),
});

const PartnerDetailResponseSchema = z.object({
  success: z.boolean(),
  data: PartnerDetailSchema,
}).passthrough();

export type PartnerDetail = z.infer<typeof PartnerDetailSchema>;
export type PartnerDetailResponse = z.infer<typeof PartnerDetailResponseSchema>;

// --- Partners Select Schema (for dropdown) ---

const PartnerSelectItemSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  label: z.string(),
});

const PartnersSelectResponseSchema = z.object({
  success: z.boolean(),
  partners: z.array(PartnerSelectItemSchema),
}).passthrough();

export type PartnerSelectItem = z.infer<typeof PartnerSelectItemSchema>;
export type PartnersSelectResponse = z.infer<typeof PartnersSelectResponseSchema>;

export const adminPartnersService = {
  async listPartners(params?: PartnerFilters): Promise<PartnersListResponse> {
    const sp = new URLSearchParams();
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.offset) sp.set("offset", String(params.offset));
    if (params?.search) sp.set("search", params.search);
    const query = sp.toString();
    const url = query ? `${BASE}?${query}` : BASE;
    return fetchJson(url, { method: "GET" }, PartnersListResponseSchema);
  },

  async selectPartners(): Promise<PartnersSelectResponse> {
    return fetchJson(`${BASE}/select`, { method: "GET" }, PartnersSelectResponseSchema);
  },

  async getPartnerDetail(partnerId: string): Promise<PartnerDetailResponse> {
    return fetchJson(`${BASE}/${partnerId}`, { method: "GET" }, PartnerDetailResponseSchema);
  },
};
