import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";

// --- Zod Schemas ---

const AdminStationSchema = z.object({
  id: z.string(),
  location_id: z.string().nullable(),
  model: z.string(),
  vendor: z.string().nullable(),
  max_power: z.number().nullable(),
  status: z.string(),
  is_available: z.boolean(),
  tariff_per_kwh: z.number().nullable(),
  created_at: z.string().nullable(),
  location_name: z.string().nullable(),
  location_address: z.string().nullable(),
  is_online: z.boolean().nullable(),
  last_heartbeat: z.string().nullable(),
  connector_count: z.number(),
  active_sessions: z.number(),
  is_partner: z.boolean().optional(),
  partner_id: z.string().nullable().optional(),
  partner_name: z.string().nullable().optional(),
  evse_id: z.string().nullable().optional(),
});

const StationDetailSchema = z.object({
  id: z.string(),
  location_id: z.string().nullable(),
  model: z.string(),
  vendor: z.string().nullable(),
  max_power: z.number().nullable(),
  status: z.string(),
  is_available: z.boolean(),
  tariff_per_kwh: z.number().nullable(),
  serial_number: z.string().nullable(),
  firmware_version: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  location_name: z.string().nullable(),
  location_address: z.string().nullable(),
  ocpp_status: z.string().nullable(),
  is_online: z.boolean().nullable(),
  last_heartbeat: z.string().nullable(),
  connector_status: z.array(z.object({
    connector_id: z.number(),
    status: z.string(),
    error_code: z.string().nullable().optional(),
  })).nullable(),
  user_id: z.string().nullable().optional(),
  partner_id: z.string().nullable().optional(),
  partner_name: z.string().nullable().optional(),
  partner_inherited: z.boolean().optional(),
  revenue_share_percent: z.number().nullable().optional(),
  ocpp_ws_url: z.string().nullable().optional(),
  evse_id: z.string().nullable().optional(),
  equipment_model_id: z.string().nullable().optional(),
  equipment_model_name: z.string().nullable().optional(),
  equipment_image_url: z.string().nullable().optional(),
  equipment_manufacturer_name: z.string().nullable().optional(),
});

const StationConnectorSchema = z.object({
  connector_number: z.number(),
  connector_type: z.string(),
  max_power: z.number().nullable(),
  status: z.string(),
});

const StationsListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(AdminStationSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
}).passthrough();

const StationDetailResponseSchema = z.object({
  success: z.boolean(),
  station: StationDetailSchema,
  connectors: z.array(StationConnectorSchema),
}).passthrough();

const MessageResponseSchema = z.object({
  success: z.boolean(),
  station_id: z.string().optional(),
  message: z.string(),
}).passthrough();

// --- Types (inferred from schemas) ---

export type AdminStation = z.infer<typeof AdminStationSchema>;
export type StationDetail = z.infer<typeof StationDetailSchema>;
export type StationConnector = z.infer<typeof StationConnectorSchema>;
export type StationsListResponse = z.infer<typeof StationsListResponseSchema>;
export type StationDetailResponse = z.infer<typeof StationDetailResponseSchema>;
export type MessageResponse = z.infer<typeof MessageResponseSchema>;

export interface StationFilters {
  limit?: number;
  offset?: number;
  location_id?: string;
  is_available?: boolean;
  search?: string;
  ownership?: "own" | "partner";
}

export interface CreateStationData {
  id: string;
  location_id: string;
  model?: string;
  vendor?: string;
  max_power?: number;
  tariff_per_kwh?: number;
  status?: string;
  user_id?: string;
  equipment_model_id?: string;
  connectors?: { connector_number?: number; connector_type?: string; max_power?: number }[];
}

export interface UpdateStationData {
  model?: string;
  vendor?: string;
  max_power?: number;
  tariff_per_kwh?: number;
  status?: string;
  is_available?: boolean;
  location_id?: string;
  user_id?: string;
  ocpp_ws_url?: string;
  equipment_model_id?: string;
}

const BASE = "/api/v1/admin/stations";

export const adminStationsService = {
  async listStations(params?: StationFilters): Promise<StationsListResponse> {
    const sp = new URLSearchParams();
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.offset) sp.set("offset", String(params.offset));
    if (params?.location_id) sp.set("location_id", params.location_id);
    if (params?.is_available !== undefined) sp.set("is_available", String(params.is_available));
    if (params?.search) sp.set("search", params.search);
    if (params?.ownership) sp.set("ownership", params.ownership);
    const query = sp.toString();
    const url = query ? `${BASE}?${query}` : BASE;
    return fetchJson(url, { method: "GET" }, StationsListResponseSchema);
  },

  async getStation(stationId: string): Promise<StationDetailResponse> {
    return fetchJson(`${BASE}/${stationId}`, { method: "GET" }, StationDetailResponseSchema);
  },

  async createStation(data: CreateStationData): Promise<MessageResponse> {
    return fetchJson(BASE, { method: "POST", body: data }, MessageResponseSchema);
  },

  async updateStation(stationId: string, data: UpdateStationData): Promise<MessageResponse> {
    return fetchJson(`${BASE}/${stationId}`, { method: "PUT", body: data }, MessageResponseSchema);
  },

  async deleteStation(stationId: string): Promise<MessageResponse> {
    return fetchJson(`${BASE}/${stationId}`, { method: "DELETE" }, MessageResponseSchema);
  },
};
