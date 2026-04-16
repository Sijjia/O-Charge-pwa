import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";

// --- Zod Schemas ---

export const TariffRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  tariff_type: z.string(),
  connector_type: z.string(),
  power_range_min: z.number().nullable().optional(),
  power_range_max: z.number().nullable().optional(),
  price: z.number(),
  currency: z.string(),
  time_start: z.string().nullable().optional(),
  time_end: z.string().nullable().optional(),
  is_weekend: z.boolean().nullable().optional(),
  days_of_week: z.array(z.number()).nullable().optional(),
  min_duration_minutes: z.number().nullable().optional(),
  max_duration_minutes: z.number().nullable().optional(),
  valid_from: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  priority: z.number(),
  is_active: z.boolean(),
});

export const TariffPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  is_default: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  rules_count: z.number().optional(),
  stations_count: z.number().optional(),
});

export const TariffPlanDetailSchema = TariffPlanSchema.extend({
  rules: z.array(TariffRuleSchema).optional().default([]),
});

const PlansListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(TariffPlanSchema),
}).passthrough();

const PlanDetailResponseSchema = z.object({
  success: z.boolean(),
  data: TariffPlanDetailSchema,
}).passthrough();

const CreatePlanResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    name: z.string(),
    rules_count: z.number().optional(),
  }),
}).passthrough();

const SuccessResponseSchema = z.object({
  success: z.boolean(),
}).passthrough();

const AddRuleResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    name: z.string(),
  }),
}).passthrough();

const AssignResponseSchema = z.object({
  success: z.boolean(),
  updated_stations: z.number().optional(),
}).passthrough();

const AnalyticsResponseSchema = z.object({
  success: z.boolean(),
  data: z.record(z.unknown()).optional(),
}).passthrough();

// --- Types ---

export type TariffPlan = z.infer<typeof TariffPlanSchema>;
export type TariffPlanDetail = z.infer<typeof TariffPlanDetailSchema>;
export type TariffRule = z.infer<typeof TariffRuleSchema>;

export interface CreatePlanBody {
  name: string;
  description?: string;
  is_default?: boolean;
  rules?: CreateRuleBody[];
}

export interface UpdatePlanBody {
  name?: string;
  description?: string;
  is_default?: boolean;
  is_active?: boolean;
}

export interface CreateRuleBody {
  name: string;
  tariff_type?: string;
  connector_type?: string;
  power_range_min?: number | null;
  power_range_max?: number | null;
  price: number;
  currency?: string;
  time_start?: string | null;
  time_end?: string | null;
  is_weekend?: boolean | null;
  days_of_week?: number[] | null;
  min_duration_minutes?: number | null;
  max_duration_minutes?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  priority?: number;
}

export interface UpdateRuleBody {
  name?: string;
  tariff_type?: string;
  connector_type?: string;
  power_range_min?: number | null;
  power_range_max?: number | null;
  price?: number;
  currency?: string;
  time_start?: string | null;
  time_end?: string | null;
  is_weekend?: boolean | null;
  days_of_week?: number[] | null;
  priority?: number;
  is_active?: boolean;
}

// --- API Methods ---

const BASE = "/api/v1/admin/tariffs";

export async function listPlans(includeInactive = false) {
  const url = includeInactive ? `${BASE}?include_inactive=true` : BASE;
  return fetchJson(url, { method: "GET" }, PlansListResponseSchema);
}

export async function getPlan(id: string) {
  return fetchJson(`${BASE}/${id}`, { method: "GET" }, PlanDetailResponseSchema);
}

export async function createPlan(body: CreatePlanBody) {
  return fetchJson(BASE, {
    method: "POST",
    body,
  }, CreatePlanResponseSchema);
}

export async function updatePlan(id: string, body: UpdatePlanBody) {
  return fetchJson(`${BASE}/${id}`, {
    method: "PUT",
    body,
  }, SuccessResponseSchema);
}

export async function deletePlan(id: string) {
  return fetchJson(`${BASE}/${id}`, { method: "DELETE" }, SuccessResponseSchema);
}

export async function addRule(planId: string, body: CreateRuleBody) {
  return fetchJson(`${BASE}/${planId}/rules`, {
    method: "POST",
    body,
  }, AddRuleResponseSchema);
}

export async function updateRule(planId: string, ruleId: string, body: UpdateRuleBody) {
  return fetchJson(`${BASE}/${planId}/rules/${ruleId}`, {
    method: "PUT",
    body,
  }, SuccessResponseSchema);
}

export async function deleteRule(planId: string, ruleId: string) {
  return fetchJson(`${BASE}/${planId}/rules/${ruleId}`, { method: "DELETE" }, SuccessResponseSchema);
}

export async function assignToStations(planId: string, stationIds: string[]) {
  return fetchJson(`${BASE}/${planId}/assign`, {
    method: "POST",
    body: { station_ids: stationIds },
  }, AssignResponseSchema);
}

export async function getAnalytics(params?: { station_id?: string; date_from?: string; date_to?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.station_id) searchParams.set("station_id", params.station_id);
  if (params?.date_from) searchParams.set("date_from", params.date_from);
  if (params?.date_to) searchParams.set("date_to", params.date_to);
  const qs = searchParams.toString();
  const url = qs ? `${BASE}/analytics?${qs}` : `${BASE}/analytics`;
  return fetchJson(url, { method: "GET" }, AnalyticsResponseSchema);
}

// ============================================
// AI Pricing Intelligence
// ============================================

// --- Zod Schemas ---

export const CompetitorPriceSchema = z.object({
  id: z.string(),
  competitor_name: z.string(),
  station_name: z.string().nullable().optional(),
  location_description: z.string().nullable().optional(),
  price_per_kwh: z.number(),
  currency: z.string(),
  connector_type: z.string().nullable().optional(),
  power_kw: z.number().nullable().optional(),
  charging_type: z.string().nullable().optional(),
  source: z.string(),
  source_url: z.string().nullable().optional(),
  verified_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const AIRecommendationSchema = z.object({
  id: z.string(),
  station_id: z.string().nullable().optional(),
  station_serial: z.string().nullable().optional(),
  recommended_price_per_kwh: z.number().nullable().optional(),
  recommended_price_night: z.number().nullable().optional(),
  current_price_per_kwh: z.number().nullable().optional(),
  avg_competitor_price: z.number().nullable().optional(),
  min_competitor_price: z.number().nullable().optional(),
  max_competitor_price: z.number().nullable().optional(),
  electricity_cost_per_kwh: z.number().nullable().optional(),
  estimated_revenue_change_percent: z.number().nullable().optional(),
  estimated_monthly_revenue: z.number().nullable().optional(),
  confidence_level: z.string(),
  reasoning: z.string().nullable().optional(),
  factors: z.record(z.unknown()).nullable().optional(),
  status: z.string(),
  applied_at: z.string().nullable().optional(),
  applied_by: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const AIAnalysisResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    recommendation_id: z.string(),
    recommended_price_per_kwh: z.number(),
    recommended_price_night: z.number(),
    current_price_per_kwh: z.number().nullable().optional(),
    confidence_level: z.string(),
    reasoning: z.string(),
    competitors_summary: z.record(z.unknown()),
    demand_summary: z.record(z.unknown()),
    revenue_summary: z.record(z.unknown()),
    factors: z.record(z.unknown()).optional(),
  }),
}).passthrough();

const CompetitorListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(CompetitorPriceSchema),
}).passthrough();

const RecommendationListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(AIRecommendationSchema),
}).passthrough();

const AIGenericResponseSchema = z.object({
  success: z.boolean(),
}).passthrough();

// --- Types ---

export type CompetitorPrice = z.infer<typeof CompetitorPriceSchema>;
export type AIRecommendation = z.infer<typeof AIRecommendationSchema>;
export type AIAnalysisResponse = z.infer<typeof AIAnalysisResponseSchema>;

export interface CreateCompetitorBody {
  competitor_name: string;
  station_name?: string;
  location_description?: string;
  price_per_kwh: number;
  currency?: string;
  connector_type?: string;
  power_kw?: number;
  charging_type?: string;
  source?: string;
  source_url?: string;
  notes?: string;
}

export interface UpdateCompetitorBody {
  competitor_name?: string;
  station_name?: string;
  location_description?: string;
  price_per_kwh?: number;
  currency?: string;
  connector_type?: string;
  power_kw?: number;
  charging_type?: string;
  source?: string;
  notes?: string;
}

// --- API Methods ---

export async function runAIAnalysis(params?: { station_id?: string; date_range_days?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.station_id) searchParams.set("station_id", params.station_id);
  if (params?.date_range_days) searchParams.set("date_range_days", String(params.date_range_days));
  const qs = searchParams.toString();
  const url = qs ? `${BASE}/ai/analyze?${qs}` : `${BASE}/ai/analyze`;
  return fetchJson(url, { method: "POST" }, AIAnalysisResponseSchema);
}

export async function listCompetitors(chargingType?: string) {
  const qs = chargingType ? `?charging_type=${chargingType}` : "";
  return fetchJson(`${BASE}/ai/competitors${qs}`, { method: "GET" }, CompetitorListResponseSchema);
}

export async function addCompetitor(body: CreateCompetitorBody) {
  return fetchJson(`${BASE}/ai/competitors`, { method: "POST", body }, AIGenericResponseSchema);
}

export async function updateCompetitor(id: string, body: UpdateCompetitorBody) {
  return fetchJson(`${BASE}/ai/competitors/${id}`, { method: "PUT", body }, AIGenericResponseSchema);
}

export async function deleteCompetitor(id: string) {
  return fetchJson(`${BASE}/ai/competitors/${id}`, { method: "DELETE" }, AIGenericResponseSchema);
}

export async function applyRecommendation(recommendationId: string) {
  return fetchJson(`${BASE}/ai/apply/${recommendationId}`, { method: "POST" }, AIGenericResponseSchema);
}

export async function listRecommendations(params?: { station_id?: string; status?: string; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.station_id) searchParams.set("station_id", params.station_id);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  const url = qs ? `${BASE}/ai/recommendations?${qs}` : `${BASE}/ai/recommendations`;
  return fetchJson(url, { method: "GET" }, RecommendationListResponseSchema);
}

// ============================================
// Batch Analysis, Selective Apply, Auto-Optimize
// ============================================

const BatchStationRecSchema = z.object({
  station_id: z.string(),
  serial_number: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  location_id: z.string().nullable().optional(),
  station_type: z.string(),
  current_price: z.number().nullable().optional(),
  recommended_price_per_kwh: z.number().nullable().optional(),
  recommended_price_night: z.number().nullable().optional(),
  price_change_pct: z.number().nullable().optional(),
  confidence_level: z.string(),
  reasoning: z.string(),
  recommendation_id: z.string().nullable().optional(),
  demand: z.record(z.unknown()).optional(),
  revenue: z.record(z.unknown()).optional(),
});

const BatchLocationSchema = z.object({
  location_id: z.string().nullable().optional(),
  location_name: z.string(),
  location_city: z.string().nullable().optional(),
  recommended_avg_price: z.number().nullable().optional(),
  station_count: z.number(),
  stations: z.array(BatchStationRecSchema),
});

const BatchAnalyzeResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    locations: z.array(BatchLocationSchema),
    summary: z.record(z.unknown()),
  }),
}).passthrough();

const ApplySelectiveResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    success: z.boolean(),
    updated_stations: z.number().optional(),
    applied_price: z.number().optional(),
    details: z.array(z.record(z.unknown())).optional(),
  }),
}).passthrough();

const AutoOptimizeItemSchema = z.object({
  station_id: z.string(),
  station_name: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  old_price: z.number().nullable().optional(),
  new_price: z.number(),
  change_pct: z.number(),
  reasoning: z.string(),
  confidence: z.string(),
});

const AutoOptimizeResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    applied: z.array(AutoOptimizeItemSchema),
    skipped: z.array(z.record(z.unknown())),
    errors: z.array(z.record(z.unknown())),
    summary: z.object({
      total: z.number(),
      applied_count: z.number(),
      skipped_count: z.number(),
      error_count: z.number(),
    }),
  }),
}).passthrough();

export type BatchStationRec = z.infer<typeof BatchStationRecSchema>;
export type BatchLocation = z.infer<typeof BatchLocationSchema>;
export type AutoOptimizeItem = z.infer<typeof AutoOptimizeItemSchema>;

export interface BatchAnalyzeBody {
  station_ids?: string[];
  location_ids?: string[];
  date_range_days?: number;
}

export interface ApplySelectiveBody {
  recommendation_id: string;
  station_ids?: string[];
  location_ids?: string[];
}

export interface AutoOptimizeBody {
  station_ids?: string[];
  location_ids?: string[];
  date_range_days?: number;
}

export async function analyzeBatch(body: BatchAnalyzeBody) {
  return fetchJson(`${BASE}/ai/analyze-batch`, { method: "POST", body }, BatchAnalyzeResponseSchema);
}

export async function applySelective(body: ApplySelectiveBody) {
  return fetchJson(`${BASE}/ai/apply-selective`, { method: "POST", body }, ApplySelectiveResponseSchema);
}

export async function autoOptimize(body: AutoOptimizeBody) {
  return fetchJson(`${BASE}/ai/auto-optimize`, { method: "POST", body }, AutoOptimizeResponseSchema);
}
