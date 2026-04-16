import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";

// --- Zod Schemas ---

const MapIntegrationSchema = z.object({
  id: z.string(),
  platform: z.string(),
  display_name: z.string(),
  icon: z.string().nullable().optional(),
  api_key_masked: z.string().nullable().optional(),
  is_enabled: z.boolean(),
  sync_interval_minutes: z.number(),
  last_global_sync_at: z.string().nullable().optional(),
  locations_synced: z.number(),
  locations_error: z.number(),
  config: z.record(z.unknown()).nullable().optional(),
});

const MapIntegrationsListResponseSchema = z.object({
  success: z.boolean(),
  integrations: z.array(MapIntegrationSchema),
}).passthrough();

const MapIntegrationOverviewSchema = z.object({
  success: z.boolean(),
  total_locations: z.number(),
  platforms: z.array(z.object({
    platform: z.string(),
    display_name: z.string(),
    is_enabled: z.boolean(),
    synced: z.number(),
    errors: z.number(),
    enabled_locations: z.number(),
  })),
}).passthrough();

const TestResultSchema = z.object({
  success: z.boolean(),
  ok: z.boolean(),
  message: z.string(),
}).passthrough();

const MessageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
}).passthrough();

// --- Types ---

export type MapIntegration = z.infer<typeof MapIntegrationSchema>;
export type MapIntegrationsListResponse = z.infer<typeof MapIntegrationsListResponseSchema>;
export type MapIntegrationOverview = z.infer<typeof MapIntegrationOverviewSchema>;
export type TestResult = z.infer<typeof TestResultSchema>;

const BASE = "/api/v1/admin/integrations";

export const adminIntegrationsService = {
  async listMapIntegrations(): Promise<MapIntegrationsListResponse> {
    return fetchJson(`${BASE}/maps`, { method: "GET" }, MapIntegrationsListResponseSchema);
  },

  async updateMapIntegration(platform: string, data: {
    api_key?: string;
    is_enabled?: boolean;
    sync_interval_minutes?: number;
  }): Promise<{ success: boolean; message: string }> {
    return fetchJson(`${BASE}/maps/${platform}`, { method: "PUT", body: data }, MessageResponseSchema);
  },

  async testMapIntegration(platform: string): Promise<TestResult> {
    return fetchJson(`${BASE}/maps/${platform}/test`, { method: "POST", body: {} }, TestResultSchema);
  },

  async getOverview(): Promise<MapIntegrationOverview> {
    return fetchJson(`${BASE}/maps/overview`, { method: "GET" }, MapIntegrationOverviewSchema);
  },
};
