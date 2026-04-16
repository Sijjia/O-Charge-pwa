import { useQuery } from "@tanstack/react-query";
import { adminSessionsService, type SessionFilters, type SessionsListResponse } from "../services/adminSessionsService";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";
import { demoAdminSessions } from "@/shared/demo/demoData";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";

const getDemoSessions = (filters?: SessionFilters): SessionsListResponse => {
  let sessions = [...demoAdminSessions];

  if (filters?.station_id) {
    sessions = sessions.filter(s => s.station_id === filters.station_id);
  }

  if (filters?.status) {
    sessions = sessions.filter(s => s.status === filters.status);
  }

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    sessions = sessions.filter(s =>
      s.user_phone?.toLowerCase().includes(search) ||
      s.station_name?.toLowerCase().includes(search)
    );
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;
  const paginated = sessions.slice(offset, offset + limit);

  return {
    success: true,
    data: paginated,
    total: sessions.length,
    limit,
    offset,
  };
};

export function useAdminSessions(filters?: SessionFilters) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "sessions", filters],
    queryFn: () => {
      if (isDemoModeActive()) return getDemoSessions(filters);
      return adminSessionsService.listSessions(filters);
    },
    enabled: isAuthenticated,
  });
}

export function useAdminSessionDetail(id: string | undefined) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "sessions", id],
    queryFn: () => adminSessionsService.getSession(id!),
    enabled: isAuthenticated && !!id,
  });
}
