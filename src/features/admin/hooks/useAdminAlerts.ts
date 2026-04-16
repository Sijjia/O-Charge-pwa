import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAlertsService, type AlertsResponse } from "../services/adminAlertsService";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";
import { DEMO_ALERTS } from "@/shared/demo/demoData";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";

const getDemoAlerts = (severity?: string): AlertsResponse => {
  const alerts = severity ? DEMO_ALERTS.filter(a => a.severity === severity) : DEMO_ALERTS;
  const unacknowledged = alerts.filter(a => !a.acknowledged).length;
  return {
    success: true,
    alerts,
    total: alerts.length,
    unacknowledged,
  };
};

export function useAdminAlerts(severity?: string) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "alerts", severity],
    queryFn: () => {
      if (isDemoModeActive()) return getDemoAlerts(severity);
      return adminAlertsService.getAlerts(severity);
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => adminAlertsService.acknowledge(alertId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "alerts"] });
    },
  });
}
