import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";

// Permissive schema for raw backend responses that we transform manually
const RawJsonSchema = z.record(z.any());

// --- Zod Schemas ---
// Frontend-facing schema (what pages expect)

const SessionSchema = z.object({
  id: z.string(),
  station_id: z.string(),
  user_id: z.string(),
  status: z.string(),
  energy_kwh: z.number().nullable(),
  cost: z.number().nullable(),
  started_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  duration_minutes: z.number().nullable(),
  station_name: z.string().nullable(),
  user_phone: z.string().nullable(),
  location_name: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  start_time: z.string().nullable().optional(),
  stop_time: z.string().nullable().optional(),
  station_model: z.string().nullable().optional(),
  client_phone: z.string().nullable().optional(),
  client_id: z.string().nullable().optional(),
});

const SessionsListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(SessionSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
}).passthrough();

const SessionDetailResponseSchema = z.object({
  success: z.boolean(),
  session: SessionSchema,
}).passthrough();

// --- Types (inferred from schemas) ---

export type Session = z.infer<typeof SessionSchema>;
export type SessionsListResponse = z.infer<typeof SessionsListResponseSchema>;
export type SessionDetailResponse = z.infer<typeof SessionDetailResponseSchema>;

export interface SessionFilters {
  limit?: number;
  offset?: number;
  station_id?: string;
  connector_id?: number;
  client_id?: string;
  status?: string;
  search?: string;
}

const BASE = "/api/v1/admin/sessions";

// Transform backend session fields to frontend-expected fields
function mapSession(raw: any): any {
  return {
    ...raw,
    // Aliases for pages that use old field names
    user_id: raw.client_id ?? raw.user_id,
    cost: raw.amount ?? raw.cost ?? null,
    started_at: raw.start_time ?? raw.started_at ?? null,
    ended_at: raw.stop_time ?? raw.ended_at ?? null,
    station_name: raw.station_model ?? raw.station_name ?? null,
    user_phone: raw.client_phone ?? raw.user_phone ?? null,
  };
}

export const adminSessionsService = {
  async listSessions(params?: SessionFilters): Promise<SessionsListResponse> {
    const sp = new URLSearchParams();
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.offset) sp.set("offset", String(params.offset));
    if (params?.station_id) sp.set("station_id", params.station_id);
    if (params?.connector_id) sp.set("connector_id", String(params.connector_id));
    if (params?.client_id) sp.set("client_id", params.client_id);
    if (params?.status) sp.set("status", params.status);
    if (params?.search) sp.set("search", params.search);
    const query = sp.toString();
    const url = query ? `${BASE}?${query}` : BASE;
    const raw: any = await fetchJson(url, { method: "GET" }, RawJsonSchema);
    return {
      ...raw,
      data: (raw.data ?? []).map(mapSession),
    };
  },

  async getSession(sessionId: string): Promise<SessionDetailResponse> {
    const raw: any = await fetchJson(`${BASE}/${sessionId}`, { method: "GET" }, RawJsonSchema);
    return {
      ...raw,
      session: mapSession(raw.session),
    };
  },
};
