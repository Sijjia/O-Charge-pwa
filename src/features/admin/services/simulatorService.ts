import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";

const BASE = "/api/v1/admin/simulator";

// --- Zod Schemas ---

const ConnectorStatusSchema = z.object({
  id: z.number(),
  status: z.string(),
  energy_kwh: z.number(),
  power_kw: z.number(),
  duration_s: z.number(),
  cost: z.number(),
  transaction_id: z.number().nullable(),
});

const SimulatorStatusSchema = z.object({
  success: z.boolean(),
  active: z.boolean(),
  station_id: z.string().optional(),
  connectors: z.array(ConnectorStatusSchema).optional(),
  uptime_s: z.number().optional(),
  messages_sent: z.number().optional(),
});

const SimulatorLogEventSchema = z.object({
  ts: z.string(),
  direction: z.string(),
  action: z.string(),
  payload: z.any().optional(),
});

const SimulatorLogSchema = z.object({
  success: z.boolean(),
  events: z.array(SimulatorLogEventSchema),
});

const SimulatorActionResponseSchema = z.object({
  success: z.boolean(),
}).passthrough();

// --- Types ---

export type ConnectorStatus = z.infer<typeof ConnectorStatusSchema>;
export type SimulatorStatus = z.infer<typeof SimulatorStatusSchema>;
export type SimulatorLogEvent = z.infer<typeof SimulatorLogEventSchema>;
export type SimulatorLog = z.infer<typeof SimulatorLogSchema>;

// --- Service ---

export const simulatorService = {
  async start(params: { station_id: string; connectors?: number }) {
    return fetchJson(
      `${BASE}/start`,
      { method: "POST", body: params },
      SimulatorActionResponseSchema,
    );
  },

  async getStatus(): Promise<SimulatorStatus> {
    try {
      return await fetchJson(`${BASE}/status`, { method: "GET" }, SimulatorStatusSchema);
    } catch {
      return { success: false, active: false };
    }
  },

  async plugIn(params: { connector_id: number }) {
    return fetchJson(
      `${BASE}/plug-in`,
      { method: "POST", body: params },
      SimulatorActionResponseSchema,
    );
  },

  async startCharging(params: { connector_id: number; id_tag?: string }) {
    return fetchJson(
      `${BASE}/start-charging`,
      { method: "POST", body: params },
      SimulatorActionResponseSchema,
    );
  },

  async stopCharging(params: { connector_id: number }) {
    return fetchJson(
      `${BASE}/stop-charging`,
      { method: "POST", body: params },
      SimulatorActionResponseSchema,
    );
  },

  async stop() {
    return fetchJson(
      `${BASE}/stop`,
      { method: "POST" },
      SimulatorActionResponseSchema,
    );
  },

  async getLog(): Promise<SimulatorLog> {
    try {
      return await fetchJson(`${BASE}/log`, { method: "GET" }, SimulatorLogSchema);
    } catch {
      return { success: false, events: [] };
    }
  },
};
