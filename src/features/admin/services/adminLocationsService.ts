import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";

// --- Zod Schemas ---

const AdminLocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  status: z.string(),
  created_at: z.string().nullable(),
  station_count: z.number(),
  available_stations: z.number(),
  partner_id: z.string().nullable().optional(),
  partner_name: z.string().nullable().optional(),
  revenue_share_percent: z.number().nullable().optional(),
  image_url: z.string().nullable().optional(),
});

const LocationDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  status: z.string(),
  image_url: z.string().nullable().optional(),
  partner_id: z.string().nullable().optional(),
  partner_name: z.string().nullable().optional(),
  revenue_share_percent: z.number().nullable().optional(),
  partner_contact: z.string().nullable().optional(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

const LocationImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  caption: z.string().nullable().optional(),
  sort_order: z.number(),
});

const LocationSyncStatusSchema = z.object({
  platform: z.string(),
  display_name: z.string(),
  icon: z.string().nullable().optional(),
  is_enabled: z.boolean(),
  external_id: z.string().nullable().optional(),
  external_url: z.string().nullable().optional(),
  sync_status: z.string(),
  sync_error: z.string().nullable().optional(),
  last_sync_at: z.string().nullable().optional(),
});

const LocationStationSchema = z.object({
  id: z.string(),
  model: z.string(),
  vendor: z.string().nullable(),
  max_power: z.number().nullable(),
  status: z.string(),
  is_available: z.boolean(),
  tariff_per_kwh: z.number().nullable(),
  is_online: z.boolean().nullable(),
  partner_id: z.string().nullable().optional(),
  partner_name: z.string().nullable().optional(),
  partner_inherited: z.boolean().optional(),
  revenue_share_percent: z.number().nullable().optional(),
  connector_count: z.number().optional(),
  month_revenue: z.number().optional(),
  evse_id: z.string().nullable().optional(),
});

const LocationRevenueSchema = z.object({
  total_revenue: z.number(),
  partner_share: z.number(),
  platform_share: z.number(),
  session_count: z.number(),
});

const LocationsListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(AdminLocationSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
}).passthrough();

const LocationDetailResponseSchema = z.object({
  success: z.boolean(),
  location: LocationDetailSchema,
  stations: z.array(LocationStationSchema),
  revenue: LocationRevenueSchema.optional(),
  images: z.array(LocationImageSchema).optional(),
  sync_platforms: z.array(LocationSyncStatusSchema).optional(),
}).passthrough();

const MessageResponseSchema = z.object({
  success: z.boolean(),
  location_id: z.string().optional(),
  image_id: z.string().optional(),
  message: z.string(),
}).passthrough();

// Platform sync response
const LocationPlatformsResponseSchema = z.object({
  success: z.boolean(),
  platforms: z.array(z.object({
    platform: z.string(),
    display_name: z.string(),
    icon: z.string().nullable().optional(),
    platform_enabled: z.boolean().optional(),
    is_enabled: z.boolean(),
    external_id: z.string().nullable().optional(),
    external_url: z.string().nullable().optional(),
    sync_status: z.string(),
    sync_error: z.string().nullable().optional(),
    last_sync_at: z.string().nullable().optional(),
  })),
}).passthrough();

// --- Types (inferred from schemas) ---

export type AdminLocation = z.infer<typeof AdminLocationSchema>;
export type LocationDetail = z.infer<typeof LocationDetailSchema>;
export type LocationImage = z.infer<typeof LocationImageSchema>;
export type LocationSyncStatus = z.infer<typeof LocationSyncStatusSchema>;
export type LocationStation = z.infer<typeof LocationStationSchema>;
export type LocationRevenue = z.infer<typeof LocationRevenueSchema>;
export type LocationsListResponse = z.infer<typeof LocationsListResponseSchema>;
export type LocationDetailResponse = z.infer<typeof LocationDetailResponseSchema>;
export type MessageResponse = z.infer<typeof MessageResponseSchema>;
export type LocationPlatformsResponse = z.infer<typeof LocationPlatformsResponseSchema>;

export interface LocationFilters {
  limit?: number;
  offset?: number;
  city?: string;
  search?: string;
}

export interface CreateLocationData {
  name: string;
  address: string;
  city?: string;
  lat?: number;
  lng?: number;
  status?: string;
  image_url?: string;
}

export interface UpdateLocationData {
  name?: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  status?: string;
  partner_id?: string | null;
  image_url?: string | null;
}

const BASE = "/api/v1/admin/locations";

export const adminLocationsService = {
  async listLocations(params?: LocationFilters): Promise<LocationsListResponse> {
    const sp = new URLSearchParams();
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.offset) sp.set("offset", String(params.offset));
    if (params?.city) sp.set("city", params.city);
    if (params?.search) sp.set("search", params.search);
    const query = sp.toString();
    const url = query ? `${BASE}?${query}` : BASE;
    return fetchJson(url, { method: "GET" }, LocationsListResponseSchema);
  },

  async getLocation(locationId: string): Promise<LocationDetailResponse> {
    return fetchJson(`${BASE}/${locationId}`, { method: "GET" }, LocationDetailResponseSchema);
  },

  async createLocation(data: CreateLocationData): Promise<MessageResponse> {
    return fetchJson(BASE, { method: "POST", body: data }, MessageResponseSchema);
  },

  async updateLocation(locationId: string, data: UpdateLocationData): Promise<MessageResponse> {
    return fetchJson(`${BASE}/${locationId}`, { method: "PUT", body: data }, MessageResponseSchema);
  },

  async deleteLocation(locationId: string): Promise<MessageResponse> {
    return fetchJson(`${BASE}/${locationId}`, { method: "DELETE" }, MessageResponseSchema);
  },

  // --- Gallery ---

  async addLocationImage(locationId: string, data: { url: string; caption?: string }): Promise<MessageResponse> {
    return fetchJson(`${BASE}/${locationId}/images`, { method: "POST", body: data }, MessageResponseSchema);
  },

  async deleteLocationImage(locationId: string, imageId: string): Promise<MessageResponse> {
    return fetchJson(`${BASE}/${locationId}/images/${imageId}`, { method: "DELETE" }, MessageResponseSchema);
  },

  async reorderLocationImages(locationId: string, imageIds: string[]): Promise<MessageResponse> {
    return fetchJson(`${BASE}/${locationId}/images/reorder`, { method: "PUT", body: { image_ids: imageIds } }, MessageResponseSchema);
  },

  // --- Platform sync ---

  async getLocationPlatforms(locationId: string): Promise<LocationPlatformsResponse> {
    return fetchJson(`${BASE}/${locationId}/platforms`, { method: "GET" }, LocationPlatformsResponseSchema);
  },

  async toggleLocationPlatform(locationId: string, platform: string, isEnabled: boolean): Promise<MessageResponse> {
    return fetchJson(`${BASE}/${locationId}/platforms/${platform}`, { method: "PUT", body: { is_enabled: isEnabled } }, MessageResponseSchema);
  },

  async syncLocationPlatform(locationId: string, platform: string): Promise<MessageResponse> {
    return fetchJson(`${BASE}/${locationId}/platforms/${platform}/sync`, { method: "POST", body: {} }, MessageResponseSchema);
  },
};
