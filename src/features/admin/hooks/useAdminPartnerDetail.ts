import { useQuery } from "@tanstack/react-query";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";
import { demoPartnerDetail } from "@/shared/demo/demoData";
import { adminPartnersService, type PartnerDetailResponse } from "../services/adminPartnersService";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";

export function useAdminPartnerDetail(partnerId?: string) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin-partner-detail", partnerId],
    enabled: isAuthenticated && !!partnerId,
    queryFn: async (): Promise<PartnerDetailResponse> => {
      if (isDemoModeActive()) {
        return { success: true, data: demoPartnerDetail };
      }
      return adminPartnersService.getPartnerDetail(partnerId!);
    },
  });
}
