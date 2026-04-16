import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";

// --- Zod Schemas ---

export const OcppLogSchema = z.object({
  id: z.string(),
  station_id: z.string(),
  connector_id: z.number().nullable().optional(),
  event_type: z.string(),
  direction: z.string(),
  message_id: z.string().nullable().optional(),
  request_payload: z.unknown().nullable().optional(),
  response_payload: z.unknown().nullable().optional(),
  severity: z.string(),
  processing_time_ms: z.number().nullable().optional(),
  error_message: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

const LogsListResponseSchema = z.object({
  success: z.boolean(),
  items: z.array(OcppLogSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  pages: z.number(),
}).passthrough();

const LogStatsResponseSchema = z.object({
  success: z.boolean(),
  total: z.number(),
  by_event_type: z.record(z.number()),
  by_severity: z.record(z.number()),
}).passthrough();

// --- Types ---

export type OcppLog = z.infer<typeof OcppLogSchema>;

export interface LogsFilters {
  page?: number;
  per_page?: number;
  station_id?: string;
  event_type?: string;
  direction?: string;
  severity?: string;
  search?: string;
  from?: string;
  to?: string;
}

export interface LogStatsFilters {
  station_id?: string;
  from?: string;
  to?: string;
}

// --- API Methods ---

const BASE = "/api/v1/admin/logs/ocpp";

export async function listLogs(filters: LogsFilters = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.per_page) params.set("per_page", String(filters.per_page));
  if (filters.station_id) params.set("station_id", filters.station_id);
  if (filters.event_type) params.set("event_type", filters.event_type);
  if (filters.direction) params.set("direction", filters.direction);
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.search) params.set("search", filters.search);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const qs = params.toString();
  const url = qs ? `${BASE}?${qs}` : BASE;
  return fetchJson(url, { method: "GET" }, LogsListResponseSchema);
}

export async function getLogStats(filters: LogStatsFilters = {}) {
  const params = new URLSearchParams();
  if (filters.station_id) params.set("station_id", filters.station_id);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const qs = params.toString();
  const url = qs ? `${BASE}/stats?${qs}` : `${BASE}/stats`;
  return fetchJson(url, { method: "GET" }, LogStatsResponseSchema);
}
