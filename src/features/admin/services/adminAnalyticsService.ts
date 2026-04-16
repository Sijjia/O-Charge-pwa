import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";

// --- Zod Schemas (what the UI pages expect) ---

const AnalyticsOverviewSchema = z.object({
  total_stations: z.number(),
  total_sessions: z.number(),
  total_revenue: z.number(),
  total_energy_kwh: z.number(),
  active_users: z.number(),
  sessions_today: z.number(),
  revenue_today: z.number(),
  energy_today: z.number(),
});

const ChartDataSchema = z.object({
  date: z.string(),
  sessions: z.number(),
  revenue: z.number(),
  energy: z.number(),
});

const AnalyticsOverviewResponseSchema = z.object({
  success: z.boolean(),
  data: AnalyticsOverviewSchema,
}).passthrough();

const ChartDataResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ChartDataSchema),
}).passthrough();

// --- Heatmap ---

const HeatmapResponseSchema = z.object({
  success: z.boolean(),
  days: z.number(),
  matrix: z.array(z.array(z.number())),
  day_labels: z.array(z.string()),
}).passthrough();

// --- User Growth ---

const UserGrowthPointSchema = z.object({
  period: z.string().nullable(),
  new_users: z.number(),
  cumulative: z.number(),
});

const UserGrowthResponseSchema = z.object({
  success: z.boolean(),
  group_by: z.string(),
  data: z.array(UserGrowthPointSchema),
}).passthrough();

// --- Uptime ---

const UptimeStationSchema = z.object({
  station_id: z.string(),
  uptime_pct: z.number(),
  downtime_minutes: z.number(),
  incidents_count: z.number(),
});

const UptimeResponseSchema = z.object({
  success: z.boolean(),
  days: z.number(),
  total_minutes: z.number(),
  avg_uptime_pct: z.number(),
  stations: z.array(UptimeStationSchema),
}).passthrough();

// --- Types (inferred from schemas) ---

export type AnalyticsOverview = z.infer<typeof AnalyticsOverviewSchema>;
export type ChartData = z.infer<typeof ChartDataSchema>;
export type AnalyticsOverviewResponse = z.infer<typeof AnalyticsOverviewResponseSchema>;
export type ChartDataResponse = z.infer<typeof ChartDataResponseSchema>;
export type HeatmapResponse = z.infer<typeof HeatmapResponseSchema>;
export type UserGrowthPoint = z.infer<typeof UserGrowthPointSchema>;
export type UserGrowthResponse = z.infer<typeof UserGrowthResponseSchema>;
export type UptimeStation = z.infer<typeof UptimeStationSchema>;
export type UptimeResponse = z.infer<typeof UptimeResponseSchema>;

export type ChartPeriod = "7d" | "30d" | "90d";

// --- Revenue by Partner ---

const RevenueByPartnerItemSchema = z.object({
  partner_id: z.string(),
  partner_name: z.string(),
  sessions: z.number(),
  total_revenue: z.number(),
  total_energy_kwh: z.number(),
  total_partner_share: z.number(),
  total_platform_share: z.number(),
  station_count: z.number(),
});

const RevenueByPartnerResponseSchema = z.object({
  success: z.boolean(),
  date_from: z.string(),
  date_to: z.string(),
  data: z.array(RevenueByPartnerItemSchema),
  totals: z.object({
    sessions: z.number(),
    revenue: z.number(),
    energy_kwh: z.number(),
    partner_share: z.number(),
    platform_share: z.number(),
  }),
}).passthrough();

// --- Revenue by Location ---

const RevenueByLocationItemSchema = z.object({
  location_id: z.string(),
  location_name: z.string(),
  location_address: z.string(),
  location_city: z.string(),
  station_count: z.number(),
  sessions: z.number(),
  total_revenue: z.number(),
  total_energy_kwh: z.number(),
});

const RevenueByLocationResponseSchema = z.object({
  success: z.boolean(),
  date_from: z.string(),
  date_to: z.string(),
  data: z.array(RevenueByLocationItemSchema),
  totals: z.object({
    sessions: z.number(),
    revenue: z.number(),
    energy_kwh: z.number(),
  }),
}).passthrough();

// --- Revenue Time Series (existing /revenue) ---

const RevenueTimeSeriesItemSchema = z.object({
  period: z.string().nullable(),
  sessions: z.number(),
  total_revenue: z.number(),
  total_energy_kwh: z.number(),
  total_partner_share: z.number(),
  total_platform_share: z.number(),
  avg_session_revenue: z.number(),
});

const RevenueTimeSeriesResponseSchema = z.object({
  success: z.boolean(),
  date_from: z.string(),
  date_to: z.string(),
  group_by: z.string(),
  data: z.array(RevenueTimeSeriesItemSchema),
  totals: z.object({
    sessions: z.number(),
    revenue: z.number(),
    energy_kwh: z.number(),
    partner_share: z.number(),
    platform_share: z.number(),
  }),
}).passthrough();

export type RevenueByPartnerItem = z.infer<typeof RevenueByPartnerItemSchema>;
export type RevenueByPartnerResponse = z.infer<typeof RevenueByPartnerResponseSchema>;
export type RevenueByLocationItem = z.infer<typeof RevenueByLocationItemSchema>;
export type RevenueByLocationResponse = z.infer<typeof RevenueByLocationResponseSchema>;
export type RevenueTimeSeriesItem = z.infer<typeof RevenueTimeSeriesItemSchema>;
export type RevenueTimeSeriesResponse = z.infer<typeof RevenueTimeSeriesResponseSchema>;

export interface RevenueFilters {
  dateFrom?: string;
  dateTo?: string;
  partnerId?: string;
  groupBy?: "day" | "week" | "month";
}

const BASE = "/api/v1/admin/analytics";

// Backend /overview returns: { infrastructure: {...}, revenue_today: {...}, revenue_week, revenue_month }
// We transform it into the flat structure the UI expects
interface BackendOverviewResponse {
  success: boolean;
  infrastructure: {
    total_stations: number;
    online_stations: number;
    total_locations: number;
    total_clients: number;
    active_sessions: number;
    total_partners: number;
  };
  revenue_today: { sessions: number; revenue: number; energy_kwh: number };
  revenue_week: { sessions: number; revenue: number; energy_kwh: number };
  revenue_month: { sessions: number; revenue: number; energy_kwh: number };
}

// Backend /revenue returns: { data: [{ period, sessions, total_revenue, total_energy_kwh, ... }], totals: {...} }
// We transform it into { data: [{ date, sessions, revenue, energy }] }
interface BackendRevenueItem {
  period: string;
  sessions: number;
  total_revenue: number;
  total_energy_kwh: number;
}

// Permissive schema for raw backend responses that we transform manually
const RawJsonSchema = z.record(z.any());

export const adminAnalyticsService = {
  async getOverview(): Promise<AnalyticsOverviewResponse> {
    const raw: BackendOverviewResponse = await fetchJson(
      `${BASE}/overview`,
      { method: "GET" },
      RawJsonSchema,
    ) as unknown as BackendOverviewResponse;

    const infra = raw.infrastructure;
    const today = raw.revenue_today;
    const month = raw.revenue_month;

    return {
      success: true,
      data: {
        total_stations: infra.total_stations,
        total_sessions: month.sessions,
        total_revenue: month.revenue,
        total_energy_kwh: month.energy_kwh,
        active_users: infra.total_clients,
        sessions_today: today.sessions,
        revenue_today: today.revenue,
        energy_today: today.energy_kwh,
      },
    };
  },

  async getChartData(period?: ChartPeriod): Promise<ChartDataResponse> {
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const dateTo = new Date().toISOString().split("T")[0];
    const dateFrom = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

    const raw = await fetchJson(
      `${BASE}/revenue?group_by=day&date_from=${dateFrom}&date_to=${dateTo}`,
      { method: "GET" },
      RawJsonSchema,
    ) as unknown as { data: BackendRevenueItem[] };

    const items: BackendRevenueItem[] = raw.data ?? [];
    const chartData: ChartData[] = items.map((item) => ({
      date: item.period ? item.period.split("T")[0]! : "",
      sessions: item.sessions,
      revenue: item.total_revenue,
      energy: item.total_energy_kwh,
    }));

    return { success: true, data: chartData };
  },

  async getHeatmap(days = 30): Promise<HeatmapResponse> {
    return fetchJson(`${BASE}/heatmap?days=${days}`, { method: "GET" }, HeatmapResponseSchema);
  },

  async getUserGrowth(groupBy: "day" | "week" | "month" = "week"): Promise<UserGrowthResponse> {
    return fetchJson(`${BASE}/user-growth?group_by=${groupBy}`, { method: "GET" }, UserGrowthResponseSchema);
  },

  async getUptime(days = 30): Promise<UptimeResponse> {
    return fetchJson(`${BASE}/uptime?days=${days}`, { method: "GET" }, UptimeResponseSchema);
  },

  async getRevenueByPartner(filters?: RevenueFilters): Promise<RevenueByPartnerResponse> {
    const sp = new URLSearchParams();
    if (filters?.dateFrom) sp.set("date_from", filters.dateFrom);
    if (filters?.dateTo) sp.set("date_to", filters.dateTo);
    const query = sp.toString();
    const url = query ? `${BASE}/revenue/by-partner?${query}` : `${BASE}/revenue/by-partner`;
    return fetchJson(url, { method: "GET" }, RevenueByPartnerResponseSchema);
  },

  async getRevenueByLocation(filters?: RevenueFilters): Promise<RevenueByLocationResponse> {
    const sp = new URLSearchParams();
    if (filters?.dateFrom) sp.set("date_from", filters.dateFrom);
    if (filters?.dateTo) sp.set("date_to", filters.dateTo);
    if (filters?.partnerId) sp.set("partner_id", filters.partnerId);
    const query = sp.toString();
    const url = query ? `${BASE}/revenue/by-location?${query}` : `${BASE}/revenue/by-location`;
    return fetchJson(url, { method: "GET" }, RevenueByLocationResponseSchema);
  },

  async getRevenueTimeSeries(filters?: RevenueFilters): Promise<RevenueTimeSeriesResponse> {
    const sp = new URLSearchParams();
    sp.set("group_by", filters?.groupBy ?? "day");
    if (filters?.dateFrom) sp.set("date_from", filters.dateFrom);
    if (filters?.dateTo) sp.set("date_to", filters.dateTo);
    if (filters?.partnerId) sp.set("partner_id", filters.partnerId);
    return fetchJson(`${BASE}/revenue?${sp.toString()}`, { method: "GET" }, RevenueTimeSeriesResponseSchema);
  },
};
