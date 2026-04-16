import { useQuery } from "@tanstack/react-query";
import { adminPartnersService, type PartnerFilters, type PartnersListResponse, type PartnersSelectResponse } from "../services/adminPartnersService";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";
import { DEMO_PARTNERS } from "@/shared/demo/demoData";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";

const getDemoPartners = (filters?: PartnerFilters): PartnersListResponse => {
  let partners = [...DEMO_PARTNERS];

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    partners = partners.filter(p =>
      p.phone?.toLowerCase().includes(search) ||
      p.name?.toLowerCase().includes(search) ||
      p.company_name?.toLowerCase().includes(search)
    );
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;
  const paginated = partners.slice(offset, offset + limit);

  return {
    success: true,
    data: paginated,
    total: partners.length,
  };
};

const getDemoPartnersSelect = (): PartnersSelectResponse => ({
  success: true,
  partners: DEMO_PARTNERS.map(p => ({
    id: p.id,
    user_id: p.id, // demo mode: id == user_id
    label: p.company_name || p.name,
  })),
});

export function useAdminPartners(filters?: PartnerFilters) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "partners", filters],
    queryFn: () => {
      if (isDemoModeActive()) return getDemoPartners(filters);
      return adminPartnersService.listPartners(filters);
    },
    enabled: isAuthenticated,
  });
}

/** Compact partner list for dropdowns (id + user_id + label) */
export function usePartnersSelect() {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "partners", "select"],
    queryFn: () => {
      if (isDemoModeActive()) return getDemoPartnersSelect();
      return adminPartnersService.selectPartners();
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
}
