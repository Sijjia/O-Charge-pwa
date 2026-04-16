/**
 * Owner Statistics Hooks
 * Fetch KPIs and analytics via Backend Admin API
 * (migrated from Supabase direct access)
 */

import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '@/api/unifiedClient';
import { isDemoModeActive } from '@/shared/demo/useDemoMode';
import { demoRegionalOperatorBishkekStats } from '@/shared/demo/demoData';
import { z } from 'zod';

export interface OwnerStats {
  totalStations: number;
  activeStations: number;
  activeSessions: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  monthlyEnergy: number;
  totalRevenue: number;
  totalEnergy: number;
  totalLocations?: number;
  totalClients?: number;
  totalPartners?: number;
}

const OverviewResponseSchema = z.object({
  success: z.boolean(),
  infrastructure: z.object({
    total_stations: z.number(),
    online_stations: z.number(),
    total_locations: z.number(),
    total_clients: z.number(),
    active_sessions: z.number(),
    total_partners: z.number(),
  }),
  revenue_today: z.object({
    sessions: z.number(),
    revenue: z.number(),
    energy_kwh: z.number(),
  }),
  revenue_week: z.object({
    sessions: z.number(),
    revenue: z.number(),
    energy_kwh: z.number(),
  }),
  revenue_month: z.object({
    sessions: z.number(),
    revenue: z.number(),
    energy_kwh: z.number(),
  }),
});

/**
 * Fetch owner dashboard statistics (via backend API)
 */
export function useOwnerStats(_ownerId?: string) {
  return useQuery({
    queryKey: ['owner-stats'],
    queryFn: async (): Promise<OwnerStats> => {
      if (isDemoModeActive()) return demoRegionalOperatorBishkekStats as OwnerStats;

      const data = await fetchJson(
        '/api/v1/admin/analytics/overview',
        { method: 'GET' },
        OverviewResponseSchema,
      );

      return {
        totalStations: data.infrastructure.total_stations,
        activeStations: data.infrastructure.online_stations,
        activeSessions: data.infrastructure.active_sessions,
        todayRevenue: data.revenue_today.revenue,
        weeklyRevenue: data.revenue_week.revenue,
        monthlyRevenue: data.revenue_month.revenue,
        monthlyEnergy: data.revenue_month.energy_kwh,
        totalRevenue: 0, // overview doesn't return all-time, use revenue page for that
        totalEnergy: 0,
        totalLocations: data.infrastructure.total_locations,
        totalClients: data.infrastructure.total_clients,
        totalPartners: data.infrastructure.total_partners,
      };
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    retry: 2,
  });
}
