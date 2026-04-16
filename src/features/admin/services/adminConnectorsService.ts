import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";

// --- Zod Schemas ---

const ConnectorSchema = z.object({
  connector_number: z.number(),
  connector_type: z.string(),
  power_kw: z.number().nullable(),
  status: z.string(),
});

const ConnectorListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ConnectorSchema),
}).passthrough();

const ConnectorMutationResponseSchema = z.object({
  success: z.boolean(),
  connector_number: z.number().optional(),
  message: z.string(),
}).passthrough();

// --- Types ---

export type Connector = z.infer<typeof ConnectorSchema>;
export type ConnectorListResponse = z.infer<typeof ConnectorListResponseSchema>;
export type ConnectorMutationResponse = z.infer<typeof ConnectorMutationResponseSchema>;

export interface AddConnectorData {
  connector_type: string;
  power_kw?: number;
}

export interface UpdateConnectorData {
  connector_type?: string;
  power_kw?: number;
}

const BASE = "/api/v1/admin/stations";

export const adminConnectorsService = {
  async listConnectors(stationId: string): Promise<ConnectorListResponse> {
    return fetchJson(`${BASE}/${stationId}/connectors`, { method: "GET" }, ConnectorListResponseSchema);
  },

  async addConnector(stationId: string, data: AddConnectorData): Promise<ConnectorMutationResponse> {
    return fetchJson(`${BASE}/${stationId}/connectors`, { method: "POST", body: data }, ConnectorMutationResponseSchema);
  },

  async updateConnector(stationId: string, connectorNumber: number, data: UpdateConnectorData): Promise<ConnectorMutationResponse> {
    return fetchJson(`${BASE}/${stationId}/connectors/${connectorNumber}`, { method: "PUT", body: data }, ConnectorMutationResponseSchema);
  },

  async deleteConnector(stationId: string, connectorNumber: number): Promise<ConnectorMutationResponse> {
    return fetchJson(`${BASE}/${stationId}/connectors/${connectorNumber}`, { method: "DELETE" }, ConnectorMutationResponseSchema);
  },
};
