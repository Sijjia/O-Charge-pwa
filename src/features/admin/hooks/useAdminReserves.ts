import { useQuery } from "@tanstack/react-query";
import { adminReservesService, type ReserveFilters, type ReservesListResponse } from "../services/adminReservesService";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";
import { demoReserves } from "@/shared/demo/demoData";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";

function getDemoReserves(filters?: ReserveFilters): ReservesListResponse {
  let data = [...demoReserves];
  if (filters?.status) {
    data = data.filter((r) => r.status === filters.status);
  }
  const total = data.length;
  const offset = filters?.offset ?? 0;
  const limit = filters?.limit ?? 20;
  return { success: true, data: data.slice(offset, offset + limit), total };
}

export function useAdminReserves(filters?: ReserveFilters) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "reserves", filters],
    queryFn: () => {
      if (isDemoModeActive()) return getDemoReserves(filters);
      return adminReservesService.listReserves(filters);
    },
    enabled: isAuthenticated,
  });
}
