import { useQuery } from "@tanstack/react-query";
import {
  adminAnalyticsService,
  type RevenueFilters,
  type RevenueByPartnerResponse,
  type RevenueByLocationResponse,
  type RevenueTimeSeriesResponse,
} from "../services/adminAnalyticsService";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";

// --- Demo data ---

const DEMO_BY_PARTNER: RevenueByPartnerResponse = {
  success: true,
  date_from: "2025-01-01",
  date_to: "2025-01-31",
  data: [
    { partner_id: "p1", partner_name: "ЭлектроДрайв", sessions: 142, total_revenue: 85200, total_energy_kwh: 2840, total_partner_share: 68160, total_platform_share: 17040, station_count: 6 },
    { partner_id: "p2", partner_name: "GreenCharge KG", sessions: 98, total_revenue: 58800, total_energy_kwh: 1960, total_partner_share: 47040, total_platform_share: 11760, station_count: 4 },
    { partner_id: "p3", partner_name: "Энергопарк", sessions: 67, total_revenue: 40200, total_energy_kwh: 1340, total_partner_share: 32160, total_platform_share: 8040, station_count: 3 },
  ],
  totals: { sessions: 307, revenue: 184200, energy_kwh: 6140, partner_share: 147360, platform_share: 36840 },
};

const DEMO_BY_LOCATION: RevenueByLocationResponse = {
  success: true,
  date_from: "2025-01-01",
  date_to: "2025-01-31",
  data: [
    { location_id: "l1", location_name: "ТЦ Asia Mall", location_address: "ул. Гоголя 1", location_city: "Бишкек", station_count: 3, sessions: 89, total_revenue: 53400, total_energy_kwh: 1780 },
    { location_id: "l2", location_name: "БЦ Орион", location_address: "пр. Чуй 120", location_city: "Бишкек", station_count: 2, sessions: 65, total_revenue: 39000, total_energy_kwh: 1300 },
    { location_id: "l3", location_name: "Парковка Аэропорт", location_address: "Манас", location_city: "Бишкек", station_count: 4, sessions: 53, total_revenue: 31800, total_energy_kwh: 1060 },
    { location_id: "l4", location_name: "ТЦ Бишкек Парк", location_address: "ул. Киевская 148", location_city: "Бишкек", station_count: 2, sessions: 41, total_revenue: 24600, total_energy_kwh: 820 },
  ],
  totals: { sessions: 248, revenue: 148800, energy_kwh: 4960 },
};

const DEMO_TIME_SERIES: RevenueTimeSeriesResponse = {
  success: true,
  date_from: "2025-01-01",
  date_to: "2025-01-31",
  group_by: "day",
  data: Array.from({ length: 30 }, (_, i) => {
    const d = new Date(2025, 0, i + 1);
    const sessions = 8 + Math.floor(Math.random() * 12);
    const revenue = sessions * (450 + Math.floor(Math.random() * 200));
    return {
      period: d.toISOString(),
      sessions,
      total_revenue: revenue,
      total_energy_kwh: sessions * 20,
      total_partner_share: Math.round(revenue * 0.8),
      total_platform_share: Math.round(revenue * 0.2),
      avg_session_revenue: Math.round(revenue / sessions),
    };
  }),
  totals: { sessions: 307, revenue: 184200, energy_kwh: 6140, partner_share: 147360, platform_share: 36840 },
};

// --- Hooks ---

export function useRevenueByPartner(filters?: RevenueFilters) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "revenue", "by-partner", filters],
    queryFn: async (): Promise<RevenueByPartnerResponse> => {
      if (isDemoModeActive()) return DEMO_BY_PARTNER;
      return adminAnalyticsService.getRevenueByPartner(filters);
    },
    enabled: isAuthenticated,
  });
}

export function useRevenueByLocation(filters?: RevenueFilters) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "revenue", "by-location", filters],
    queryFn: async (): Promise<RevenueByLocationResponse> => {
      if (isDemoModeActive()) return DEMO_BY_LOCATION;
      return adminAnalyticsService.getRevenueByLocation(filters);
    },
    enabled: isAuthenticated,
  });
}

export function useRevenueTimeSeries(filters?: RevenueFilters) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "revenue", "time-series", filters],
    queryFn: async (): Promise<RevenueTimeSeriesResponse> => {
      if (isDemoModeActive()) return DEMO_TIME_SERIES;
      return adminAnalyticsService.getRevenueTimeSeries(filters);
    },
    enabled: isAuthenticated,
  });
}
