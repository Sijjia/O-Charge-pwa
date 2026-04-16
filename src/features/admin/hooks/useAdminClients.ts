import { useQuery } from "@tanstack/react-query";
import { adminClientsService, type ClientFilters, type ClientsListResponse } from "../services/adminClientsService";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";
import { DEMO_CLIENTS } from "@/shared/demo/demoData";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";

const getDemoClients = (filters?: ClientFilters): ClientsListResponse => {
  let clients = [...DEMO_CLIENTS];

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    clients = clients.filter(c =>
      c.phone.toLowerCase().includes(search) ||
      (c.name?.toLowerCase().includes(search))
    );
  }

  if (filters?.is_active !== undefined) {
    clients = clients.filter(c => c.is_active === filters.is_active);
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;
  const paginated = clients.slice(offset, offset + limit);

  return {
    success: true,
    users: paginated,
    total: clients.length,
    page: Math.floor(offset / limit) + 1,
    per_page: limit,
  };
};

export function useAdminClients(filters?: ClientFilters) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "clients", filters],
    queryFn: () => {
      if (isDemoModeActive()) return getDemoClients(filters);
      return adminClientsService.listClients(filters);
    },
    enabled: isAuthenticated,
  });
}

export function useAdminClientDetail(id: string | undefined) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "clients", id],
    queryFn: () => adminClientsService.getClient(id!),
    enabled: isAuthenticated && !!id,
  });
}
