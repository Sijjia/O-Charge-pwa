import { useQuery } from "@tanstack/react-query";
import * as logsApi from "../services/adminLogsService";
import type { LogsFilters, LogStatsFilters, OcppLog } from "../services/adminLogsService";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";

const DEMO_LOGS: OcppLog[] = [
  { id: "dl-1",  station_id: "DEMO-STATION-001", connector_id: 1, event_type: "BootNotification",      direction: "inbound",  severity: "info",    processing_time_ms: 8,  request_payload: { chargePointModel: "EV-AC22", chargePointVendor: "DemoVendor" },                                                                            response_payload: { status: "Accepted", interval: 60 },                     created_at: "2026-02-27T08:00:00.000Z" },
  { id: "dl-2",  station_id: "DEMO-STATION-001", connector_id: 1, event_type: "StatusNotification",    direction: "inbound",  severity: "info",    processing_time_ms: 5,  request_payload: { status: "Available", errorCode: "NoError" },                                                                                              response_payload: {},                                                        created_at: "2026-02-27T08:01:00.000Z" },
  { id: "dl-3",  station_id: "DEMO-STATION-001", connector_id: 1, event_type: "StartTransaction",      direction: "inbound",  severity: "info",    processing_time_ms: 12, request_payload: { connectorId: 1, idTag: "DEMO-TAG", meterStart: 0, timestamp: "2026-02-27T08:02:00.000Z" },                                              response_payload: { transactionId: 42, idTagInfo: { status: "Accepted" } },  created_at: "2026-02-27T08:02:00.000Z" },
  { id: "dl-4",  station_id: "DEMO-STATION-001", connector_id: 1, event_type: "MeterValues",           direction: "inbound",  severity: "info",    processing_time_ms: 7,  request_payload: { transactionId: 42, meterValue: [{ sampledValue: [{ value: "1.254", unit: "kWh" }] }] },                                                  response_payload: {},                                                        created_at: "2026-02-27T08:05:00.000Z" },
  { id: "dl-5",  station_id: "DEMO-STATION-001", connector_id: 1, event_type: "MeterValues",           direction: "inbound",  severity: "info",    processing_time_ms: 6,  request_payload: { transactionId: 42, meterValue: [{ sampledValue: [{ value: "3.891", unit: "kWh" }] }] },                                                  response_payload: {},                                                        created_at: "2026-02-27T08:10:00.000Z" },
  { id: "dl-6",  station_id: "DEMO-STATION-002", connector_id: 0, event_type: "Heartbeat",             direction: "inbound",  severity: "info",    processing_time_ms: 3,  request_payload: {},                                                                                                                                        response_payload: { currentTime: "2026-02-27T08:12:00.000Z" },              created_at: "2026-02-27T08:12:00.000Z" },
  { id: "dl-7",  station_id: "DEMO-STATION-002", connector_id: 0, event_type: "Heartbeat",             direction: "inbound",  severity: "warning", processing_time_ms: 38, request_payload: {},                                                                                                                                        response_payload: { currentTime: "2026-02-27T08:13:35.000Z" },              created_at: "2026-02-27T08:13:35.000Z" },
  { id: "dl-8",  station_id: "DEMO-STATION-001", connector_id: 1, event_type: "RemoteStartTransaction",direction: "outbound", severity: "info",    processing_time_ms: 15, request_payload: { connectorId: 1, idTag: "DEMO-TAG" },                                                                                                      response_payload: { status: "Accepted" },                                    created_at: "2026-02-27T08:15:00.000Z" },
  { id: "dl-9",  station_id: "DEMO-STATION-001", connector_id: 1, event_type: "StopTransaction",       direction: "inbound",  severity: "info",    processing_time_ms: 11, request_payload: { transactionId: 42, meterStop: 12540, reason: "EVDisconnected" },                                                                         response_payload: { idTagInfo: { status: "Accepted" } },                    created_at: "2026-02-27T08:30:00.000Z" },
  { id: "dl-10", station_id: "DEMO-STATION-002", connector_id: 1, event_type: "StatusNotification",    direction: "inbound",  severity: "error",   processing_time_ms: 4,  request_payload: { status: "Faulted", errorCode: "GroundFailure" },                                                                                          response_payload: {},                                                        created_at: "2026-02-27T08:35:00.000Z" },
];

export function useOcppLogs(filters: LogsFilters) {
  return useQuery({
    queryKey: ["admin", "ocpp-logs", filters],
    queryFn: () => {
      if (isDemoModeActive()) {
        return Promise.resolve({
          success: true,
          items: DEMO_LOGS,
          total: DEMO_LOGS.length,
          page: filters.page ?? 1,
          per_page: filters.per_page ?? 30,
          pages: 1,
        });
      }
      return logsApi.listLogs(filters);
    },
    staleTime: 15_000,
  });
}

export function useOcppLogStats(filters: LogStatsFilters = {}) {
  return useQuery({
    queryKey: ["admin", "ocpp-log-stats", filters],
    queryFn: () => {
      if (isDemoModeActive()) {
        return Promise.resolve({
          success: true,
          total: 10,
          by_event_type: {
            BootNotification: 1,
            StatusNotification: 2,
            StartTransaction: 1,
            MeterValues: 2,
            Heartbeat: 2,
            RemoteStartTransaction: 1,
            StopTransaction: 1,
          },
          by_severity: {
            info: 8,
            warning: 1,
            error: 1,
          },
        });
      }
      return logsApi.getLogStats(filters);
    },
    staleTime: 30_000,
  });
}
