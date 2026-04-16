import { useQuery } from "@tanstack/react-query";
import {
  adminAnalyticsService,
  type ChartPeriod,
  type AnalyticsOverviewResponse,
  type ChartDataResponse,
  type HeatmapResponse,
  type UserGrowthResponse,
  type UptimeResponse,
} from "../services/adminAnalyticsService";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";
import {
  DEMO_ANALYTICS_OVERVIEW,
  DEMO_CHART_DATA,
  DEMO_HEATMAP_DATA,
  DEMO_USER_GROWTH,
  DEMO_UPTIME_DATA,
} from "@/shared/demo/demoData";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";

export function useAdminAnalyticsOverview() {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "analytics", "overview"],
    queryFn: async (): Promise<AnalyticsOverviewResponse> => {
      if (isDemoModeActive()) {
        return Promise.resolve({
          success: true,
          data: DEMO_ANALYTICS_OVERVIEW,
        });
      }
      return adminAnalyticsService.getOverview();
    },
    enabled: isAuthenticated,
  });
}

export function useAdminAnalyticsChart(period?: ChartPeriod) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "analytics", "chart", period],
    queryFn: async (): Promise<ChartDataResponse> => {
      if (isDemoModeActive()) {
        return Promise.resolve({
          success: true,
          data: DEMO_CHART_DATA,
        });
      }
      return adminAnalyticsService.getChartData(period);
    },
    enabled: isAuthenticated,
  });
}

export function useHeatmap(days = 30) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "analytics", "heatmap", days],
    queryFn: async (): Promise<HeatmapResponse> => {
      if (isDemoModeActive()) {
        return Promise.resolve({
          success: true,
          ...DEMO_HEATMAP_DATA,
        });
      }
      return adminAnalyticsService.getHeatmap(days);
    },
    enabled: isAuthenticated,
  });
}

export function useUserGrowth(groupBy: "day" | "week" | "month" = "week") {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "analytics", "user-growth", groupBy],
    queryFn: async (): Promise<UserGrowthResponse> => {
      if (isDemoModeActive()) {
        return Promise.resolve({
          success: true,
          group_by: groupBy,
          data: DEMO_USER_GROWTH,
        });
      }
      return adminAnalyticsService.getUserGrowth(groupBy);
    },
    enabled: isAuthenticated,
  });
}

export function useUptime(days = 30) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "analytics", "uptime", days],
    queryFn: async (): Promise<UptimeResponse> => {
      if (isDemoModeActive()) {
        return Promise.resolve({
          success: true,
          ...DEMO_UPTIME_DATA,
        });
      }
      return adminAnalyticsService.getUptime(days);
    },
    enabled: isAuthenticated,
  });
}
