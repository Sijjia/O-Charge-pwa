import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";

const StressTestStatusSchema = z.object({
  success: z.boolean(),
  running: z.boolean(),
  progress: z.number(),
  scenario: z.string().nullable().optional(),
  concurrent_users: z.number().nullable().optional(),
});

const StressTestResultsSchema = z.object({
  success: z.boolean(),
  total_requests: z.number(),
  successful_requests: z.number(),
  failed_requests: z.number(),
  rps: z.number(),
  avg_latency_ms: z.number(),
  p50_latency_ms: z.number(),
  p95_latency_ms: z.number(),
  p99_latency_ms: z.number(),
  error_rate: z.number(),
  duration_seconds: z.number(),
  scenario: z.string(),
  concurrent_users: z.number(),
});

const RunResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type StressTestStatus = z.infer<typeof StressTestStatusSchema>;
export type StressTestResults = z.infer<typeof StressTestResultsSchema>;

const BASE = "/api/v1/admin/stress-test";

export const stressTestService = {
  async runTest(params: {
    concurrent_users: number;
    duration_seconds: number;
    scenario: string;
  }) {
    return fetchJson(
      `${BASE}/run`,
      { method: "POST", body: params },
      RunResponseSchema,
    );
  },

  async getStatus(): Promise<StressTestStatus> {
    return fetchJson(`${BASE}/status`, { method: "GET" }, StressTestStatusSchema);
  },

  async getResults(): Promise<StressTestResults | null> {
    try {
      return await fetchJson(`${BASE}/results`, { method: "GET" }, StressTestResultsSchema);
    } catch {
      // 404 when no results yet — normal
      return null;
    }
  },
};
