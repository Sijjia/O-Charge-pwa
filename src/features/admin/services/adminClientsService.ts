import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";

// --- Zod Schemas ---

const ClientSchema = z.object({
  id: z.string(),
  phone: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  balance: z.number(),
  total_sessions: z.number(),
  total_energy_kwh: z.number(),
  created_at: z.string().nullable(),
  last_session_at: z.string().nullable(),
  is_active: z.boolean(),
});

const ClientsListResponseSchema = z.object({
  success: z.boolean(),
  users: z.array(ClientSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
}).passthrough();

const ClientDetailResponseSchema = z.object({
  success: z.boolean(),
  user: ClientSchema,
}).passthrough();

// --- Types (inferred from schemas) ---

export type Client = z.infer<typeof ClientSchema>;
export type ClientsListResponse = z.infer<typeof ClientsListResponseSchema>;
export type ClientDetailResponse = z.infer<typeof ClientDetailResponseSchema>;

export interface ClientFilters {
  limit?: number;
  offset?: number;
  search?: string;
  is_active?: boolean;
}

const BASE = "/api/v1/admin/clients";

export const adminClientsService = {
  async listClients(params?: ClientFilters): Promise<ClientsListResponse> {
    const sp = new URLSearchParams();
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.offset) sp.set("offset", String(params.offset));
    if (params?.search) sp.set("search", params.search);
    if (params?.is_active !== undefined) sp.set("is_active", String(params.is_active));
    const query = sp.toString();
    const url = query ? `${BASE}?${query}` : BASE;
    return fetchJson(url, { method: "GET" }, ClientsListResponseSchema);
  },

  async getClient(userId: string): Promise<ClientDetailResponse> {
    return fetchJson(`${BASE}/${userId}`, { method: "GET" }, ClientDetailResponseSchema);
  },
};
