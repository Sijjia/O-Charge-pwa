import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";

// --- Zod Schemas ---

const ReserveSchema = z.object({
  id: z.string(),
  station_id: z.string(),
  user_id: z.string(),
  connector_number: z.number(),
  start_time: z.string(),
  end_time: z.string(),
  status: z.string(),
  created_at: z.string().nullable(),
  station_name: z.string().nullable(),
  user_phone: z.string().nullable(),
});

const ReservesListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ReserveSchema),
  total: z.number(),
}).passthrough();

// --- Types (inferred from schemas) ---

export type Reserve = z.infer<typeof ReserveSchema>;
export type ReservesListResponse = z.infer<typeof ReservesListResponseSchema>;

export interface ReserveFilters {
  limit?: number;
  offset?: number;
  status?: string;
  station_id?: string;
}

const BASE = "/api/v1/admin/bookings";

export const adminReservesService = {
  async listReserves(params?: ReserveFilters): Promise<ReservesListResponse> {
    const sp = new URLSearchParams();
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.offset) sp.set("offset", String(params.offset));
    if (params?.status) sp.set("status", params.status);
    if (params?.station_id) sp.set("station_id", params.station_id);
    const query = sp.toString();
    const url = query ? `${BASE}?${query}` : BASE;
    return fetchJson(url, { method: "GET" }, ReservesListResponseSchema);
  },
};
