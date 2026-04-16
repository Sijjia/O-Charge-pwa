import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stressTestService } from "../services/stressTestService";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";

export function useStressTestStatus(enabled = false) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "stress-test", "status"],
    queryFn: () => stressTestService.getStatus(),
    enabled: isAuthenticated && enabled,
    refetchInterval: enabled ? 1000 : false,
  });
}

export function useStressTestResults() {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "stress-test", "results"],
    queryFn: () => stressTestService.getResults(),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useRunStressTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: stressTestService.runTest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "stress-test"] });
    },
  });
}
