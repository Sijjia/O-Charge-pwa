import { useQuery, useMutation } from "@tanstack/react-query";
import {
  simulatorService,
  type SimulatorStatus,
  type SimulatorLog,
} from "../services/simulatorService";

export function useSimulatorStatus(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "simulator", "status"],
    queryFn: (): Promise<SimulatorStatus> => simulatorService.getStatus(),
    refetchInterval: enabled ? 1000 : false,
    enabled,
    retry: false,
  });
}

export function useSimulatorLog(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "simulator", "log"],
    queryFn: (): Promise<SimulatorLog> => simulatorService.getLog(),
    refetchInterval: enabled ? 2000 : false,
    enabled,
    retry: false,
  });
}

export function useStartSimulator() {
  return useMutation({
    mutationFn: (params: { station_id: string; connectors?: number }) =>
      simulatorService.start(params),
  });
}

export function useStopSimulator() {
  return useMutation({
    mutationFn: () => simulatorService.stop(),
  });
}

export function useSimulatorPlugIn() {
  return useMutation({
    mutationFn: (params: { connector_id: number }) =>
      simulatorService.plugIn(params),
  });
}

export function useSimulatorStartCharging() {
  return useMutation({
    mutationFn: (params: { connector_id: number; id_tag?: string }) =>
      simulatorService.startCharging(params),
  });
}

export function useSimulatorStopCharging() {
  return useMutation({
    mutationFn: (params: { connector_id: number }) =>
      simulatorService.stopCharging(params),
  });
}
