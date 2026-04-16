import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as tariffApi from "../services/adminTariffsService";
import type { CreatePlanBody, UpdatePlanBody, CreateRuleBody, UpdateRuleBody, TariffPlan, CreateCompetitorBody, UpdateCompetitorBody, BatchAnalyzeBody, ApplySelectiveBody, AutoOptimizeBody } from "../services/adminTariffsService";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";

const TARIFFS_KEY = ["admin", "tariffs"] as const;
const tariffKey = (id: string) => ["admin", "tariff", id] as const;

const DEMO_TARIFF_PLANS: TariffPlan[] = [
  { id: "tp-001", name: "Стандартный", description: "Базовый дневной тариф", is_default: true, is_active: true, rules_count: 1, stations_count: 20, created_at: "2025-09-01T00:00:00Z", updated_at: new Date().toISOString() },
  { id: "tp-002", name: "Ночной (-20%)", description: "22:00–06:00", is_default: false, is_active: true, rules_count: 2, stations_count: 15, created_at: "2025-09-01T00:00:00Z", updated_at: new Date().toISOString() },
  { id: "tp-003", name: "Корпоративный", description: "Для корп. клиентов", is_default: false, is_active: true, rules_count: 1, stations_count: 8, created_at: "2025-09-01T00:00:00Z", updated_at: new Date().toISOString() },
];

export function useTariffPlans(includeInactive = false) {
  return useQuery({
    queryKey: [...TARIFFS_KEY, { includeInactive }],
    queryFn: () => {
      if (isDemoModeActive()) return Promise.resolve({ success: true, data: DEMO_TARIFF_PLANS });
      return tariffApi.listPlans(includeInactive);
    },
    staleTime: 30_000,
  });
}

export function useTariffPlan(id: string | undefined) {
  return useQuery({
    queryKey: tariffKey(id || ""),
    queryFn: () => {
      if (isDemoModeActive()) {
        const plan = DEMO_TARIFF_PLANS.find((p) => p.id === id);
        if (plan) return Promise.resolve({ success: true, data: { ...plan, rules: [] } });
      }
      return tariffApi.getPlan(id!);
    },
    enabled: !!id,
    retry: (count, error) => {
      const status = (error as { status?: number }).status;
      if (status === 404 || status === 400) return false;
      return count < 2;
    },
  });
}

export function useCreateTariffPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePlanBody) => tariffApi.createPlan(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TARIFFS_KEY });
    },
  });
}

export function useUpdateTariffPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePlanBody }) => tariffApi.updatePlan(id, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: TARIFFS_KEY });
      qc.invalidateQueries({ queryKey: tariffKey(vars.id) });
    },
  });
}

export function useDeleteTariffPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tariffApi.deletePlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TARIFFS_KEY });
    },
  });
}

export function useAddTariffRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, body }: { planId: string; body: CreateRuleBody }) => tariffApi.addRule(planId, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: TARIFFS_KEY });
      qc.invalidateQueries({ queryKey: tariffKey(vars.planId) });
    },
  });
}

export function useUpdateTariffRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, ruleId, body }: { planId: string; ruleId: string; body: UpdateRuleBody }) =>
      tariffApi.updateRule(planId, ruleId, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: TARIFFS_KEY });
      qc.invalidateQueries({ queryKey: tariffKey(vars.planId) });
    },
  });
}

export function useDeleteTariffRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, ruleId }: { planId: string; ruleId: string }) => tariffApi.deleteRule(planId, ruleId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: TARIFFS_KEY });
      qc.invalidateQueries({ queryKey: tariffKey(vars.planId) });
    },
  });
}

export function useAssignTariff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, stationIds }: { planId: string; stationIds: string[] }) =>
      tariffApi.assignToStations(planId, stationIds),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: TARIFFS_KEY });
      qc.invalidateQueries({ queryKey: tariffKey(vars.planId) });
    },
  });
}

// ============================================
// AI Pricing Intelligence Hooks
// ============================================

const AI_COMPETITORS_KEY = ["admin", "ai-competitors"] as const;
const AI_RECOMMENDATIONS_KEY = ["admin", "ai-recommendations"] as const;

export function useAIAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params?: { station_id?: string; date_range_days?: number }) =>
      tariffApi.runAIAnalysis(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AI_RECOMMENDATIONS_KEY });
    },
  });
}

export function useCompetitorPrices(chargingType?: string) {
  return useQuery({
    queryKey: [...AI_COMPETITORS_KEY, { chargingType }],
    queryFn: () => tariffApi.listCompetitors(chargingType),
    staleTime: 60_000,
  });
}

export function useAddCompetitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCompetitorBody) => tariffApi.addCompetitor(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AI_COMPETITORS_KEY });
    },
  });
}

export function useUpdateCompetitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCompetitorBody }) =>
      tariffApi.updateCompetitor(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AI_COMPETITORS_KEY });
    },
  });
}

export function useDeleteCompetitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tariffApi.deleteCompetitor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AI_COMPETITORS_KEY });
    },
  });
}

export function useApplyRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tariffApi.applyRecommendation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AI_RECOMMENDATIONS_KEY });
      qc.invalidateQueries({ queryKey: TARIFFS_KEY });
    },
  });
}

export function useAIRecommendations(params?: { station_id?: string; status?: string }) {
  return useQuery({
    queryKey: [...AI_RECOMMENDATIONS_KEY, params],
    queryFn: () => tariffApi.listRecommendations(params),
    staleTime: 30_000,
  });
}

// ============================================
// Batch / Selective / Auto-Optimize Hooks
// ============================================

const AI_BATCH_KEY = ["admin", "ai-batch"] as const;

export function useAnalyzeBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BatchAnalyzeBody) => tariffApi.analyzeBatch(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AI_RECOMMENDATIONS_KEY });
    },
  });
}

export function useApplySelective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ApplySelectiveBody) => tariffApi.applySelective(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AI_RECOMMENDATIONS_KEY });
      qc.invalidateQueries({ queryKey: TARIFFS_KEY });
      qc.invalidateQueries({ queryKey: AI_BATCH_KEY });
    },
  });
}

export function useAutoOptimize() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AutoOptimizeBody) => tariffApi.autoOptimize(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AI_RECOMMENDATIONS_KEY });
      qc.invalidateQueries({ queryKey: TARIFFS_KEY });
      qc.invalidateQueries({ queryKey: AI_BATCH_KEY });
    },
  });
}
