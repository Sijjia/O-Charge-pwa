import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";

// --- Zod Schemas ---

const ManufacturerSchema = z.object({
  id: z.string(),
  name: z.string(),
  name_cn: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean(),
  model_count: z.number(),
  created_at: z.string().nullable().optional(),
});

const ModelSchema = z.object({
  id: z.string(),
  manufacturer_id: z.string(),
  manufacturer_name: z.string().nullable().optional(),
  name: z.string(),
  type: z.string(),
  power_kw: z.number().nullable().optional(),
  connector_types: z.array(z.string()),
  num_connectors: z.number().nullable().optional(),
  voltage_range: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  price_min_usd: z.number().nullable().optional(),
  price_max_usd: z.number().nullable().optional(),
  ocpp_versions: z.array(z.string()),
  ip_rating: z.string().nullable().optional(),
  dimensions: z.string().nullable().optional(),
  weight_kg: z.number().nullable().optional(),
  operating_temp: z.string().nullable().optional(),
  efficiency_percent: z.number().nullable().optional(),
  display_size: z.string().nullable().optional(),
  is_active: z.boolean(),
  created_at: z.string().nullable().optional(),
});

const ManufacturerListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ManufacturerSchema),
  total: z.number(),
}).passthrough();

const ManufacturerDetailResponseSchema = z.object({
  success: z.boolean(),
  manufacturer: ManufacturerSchema,
  models: z.array(ModelSchema),
}).passthrough();

const ModelListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ModelSchema),
  total: z.number(),
}).passthrough();

const ModelDetailResponseSchema = z.object({
  success: z.boolean(),
  model: ModelSchema,
}).passthrough();

const MutationResponseSchema = z.object({
  success: z.boolean(),
  id: z.string().optional(),
  message: z.string(),
}).passthrough();

// --- Types ---

export type Manufacturer = z.infer<typeof ManufacturerSchema>;
export type EquipmentModel = z.infer<typeof ModelSchema>;
export type ManufacturerListResponse = z.infer<typeof ManufacturerListResponseSchema>;
export type ManufacturerDetailResponse = z.infer<typeof ManufacturerDetailResponseSchema>;
export type ModelListResponse = z.infer<typeof ModelListResponseSchema>;
export type ModelDetailResponse = z.infer<typeof ModelDetailResponseSchema>;
export type MutationResponse = z.infer<typeof MutationResponseSchema>;

export interface ManufacturerFilters {
  search?: string;
  is_active?: boolean;
}

export interface ModelFilters {
  manufacturer_id?: string;
  type?: "AC" | "DC";
  search?: string;
  is_active?: boolean;
}

// --- Service ---

const BASE = "/api/v1/admin/equipment";

export const adminEquipmentService = {
  // Manufacturers
  async listManufacturers(params?: ManufacturerFilters): Promise<ManufacturerListResponse> {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.is_active !== undefined) sp.set("is_active", String(params.is_active));
    const query = sp.toString();
    const url = query ? `${BASE}/manufacturers?${query}` : `${BASE}/manufacturers`;
    return fetchJson(url, { method: "GET" }, ManufacturerListResponseSchema);
  },

  async getManufacturer(id: string): Promise<ManufacturerDetailResponse> {
    return fetchJson(`${BASE}/manufacturers/${id}`, { method: "GET" }, ManufacturerDetailResponseSchema);
  },

  async createManufacturer(data: Partial<Manufacturer>): Promise<MutationResponse> {
    return fetchJson(`${BASE}/manufacturers`, { method: "POST", body: data }, MutationResponseSchema);
  },

  async updateManufacturer(id: string, data: Partial<Manufacturer>): Promise<MutationResponse> {
    return fetchJson(`${BASE}/manufacturers/${id}`, { method: "PUT", body: data }, MutationResponseSchema);
  },

  async deleteManufacturer(id: string): Promise<MutationResponse> {
    return fetchJson(`${BASE}/manufacturers/${id}`, { method: "DELETE" }, MutationResponseSchema);
  },

  // Models
  async listModels(params?: ModelFilters): Promise<ModelListResponse> {
    const sp = new URLSearchParams();
    if (params?.manufacturer_id) sp.set("manufacturer_id", params.manufacturer_id);
    if (params?.type) sp.set("type", params.type);
    if (params?.search) sp.set("search", params.search);
    if (params?.is_active !== undefined) sp.set("is_active", String(params.is_active));
    const query = sp.toString();
    const url = query ? `${BASE}/models?${query}` : `${BASE}/models`;
    return fetchJson(url, { method: "GET" }, ModelListResponseSchema);
  },

  async getModel(id: string): Promise<ModelDetailResponse> {
    return fetchJson(`${BASE}/models/${id}`, { method: "GET" }, ModelDetailResponseSchema);
  },

  async createModel(data: Partial<EquipmentModel>): Promise<MutationResponse> {
    return fetchJson(`${BASE}/models`, { method: "POST", body: data }, MutationResponseSchema);
  },

  async updateModel(id: string, data: Partial<EquipmentModel>): Promise<MutationResponse> {
    return fetchJson(`${BASE}/models/${id}`, { method: "PUT", body: data }, MutationResponseSchema);
  },

  async deleteModel(id: string): Promise<MutationResponse> {
    return fetchJson(`${BASE}/models/${id}`, { method: "DELETE" }, MutationResponseSchema);
  },
};
