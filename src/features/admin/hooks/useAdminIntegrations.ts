import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminIntegrationsService } from "../services/adminIntegrationsService";
import { useToast } from "@/shared/hooks/useToast";

export function useMapIntegrations() {
  return useQuery({
    queryKey: ["admin", "integrations", "maps"],
    queryFn: () => adminIntegrationsService.listMapIntegrations(),
  });
}

export function useMapIntegrationsOverview() {
  return useQuery({
    queryKey: ["admin", "integrations", "maps", "overview"],
    queryFn: () => adminIntegrationsService.getOverview(),
  });
}

export function useUpdateMapIntegration() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ platform, data }: { platform: string; data: { api_key?: string; is_enabled?: boolean; sync_interval_minutes?: number } }) =>
      adminIntegrationsService.updateMapIntegration(platform, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "integrations"] });
      toast.success("Настройки обновлены");
    },
    onError: () => {
      toast.error("Ошибка при обновлении настроек");
    },
  });
}

export function useTestMapIntegration() {
  const toast = useToast();

  return useMutation({
    mutationFn: (platform: string) => adminIntegrationsService.testMapIntegration(platform),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    onError: () => {
      toast.error("Ошибка при тестировании подключения");
    },
  });
}
