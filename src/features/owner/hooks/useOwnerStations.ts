/**
 * Owner Stations Hooks
 * Fetch and manage stations via Backend Admin API
 * (migrated from Supabase direct access)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminStationsService } from '@/features/admin/services/adminStationsService';
import type { AdminStation } from '@/features/admin/services/adminStationsService';
import { isDemoModeActive } from '@/shared/demo/useDemoMode';
import { DEMO_BISHKEK_STATIONS, DEMO_STATION_TO_LOCATION } from '@/shared/demo/demoData';
import type { DemoStation } from '@/shared/demo/demoData';
import { logger } from '@/shared/utils/logger';
import { useUnifiedAuthStore } from '@/features/auth/unifiedAuthStore';

export interface StationConnectorInfo {
  connector_number: number;
  connector_type: string;
  max_power: number | null;
  status: string;
}

export interface OwnerStation {
  id: string;
  serial_number: string;
  model: string;
  manufacturer: string;
  power_capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  location_id: string;
  location?: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
  connectors_count: number;
  connectors?: StationConnectorInfo[];
  active_sessions?: number;
  total_revenue?: number;
  total_energy?: number;
  is_online?: boolean;
  last_heartbeat?: string;
  tariff_per_kwh?: number;
  is_partner?: boolean;
  user_id?: string;
  ocpp_ws_url?: string;
  evse_id?: string | null;
  equipment_model_id?: string | null;
  equipment_model_name?: string | null;
  equipment_image_url?: string | null;
  equipment_manufacturer_name?: string | null;
  created_at: string;
  updated_at: string;
}

/** Map backend AdminStation → OwnerStation for backward compatibility */
function mapStation(s: AdminStation): OwnerStation {
  return {
    id: s.id,
    serial_number: s.id, // list endpoint omits serial_number; detail endpoint provides it
    model: s.model || '',
    manufacturer: s.vendor || '',
    power_capacity: s.max_power || 0,
    status: (s.status as OwnerStation['status']) || 'active',
    location_id: s.location_id || '',
    location: s.location_name ? {
      id: s.location_id || '',
      name: s.location_name,
      address: s.location_address || '',
      city: '',
    } : undefined,
    connectors_count: s.connector_count || 0,
    active_sessions: s.active_sessions || 0,
    is_online: s.is_online ?? undefined,
    last_heartbeat: s.last_heartbeat ?? undefined,
    tariff_per_kwh: s.tariff_per_kwh ?? undefined,
    is_partner: s.is_partner ?? false,
    evse_id: s.evse_id ?? undefined,
    created_at: s.created_at || '',
    updated_at: s.created_at || '',
  };
}

/** Map demo station → OwnerStation */
function mapDemoStation(ds: DemoStation): OwnerStation {
  const locId = DEMO_STATION_TO_LOCATION[ds.id] ?? ds.id;
  const [mfr, ...rest] = ds.model.split(" ");
  return {
    id: ds.id,
    serial_number: ds.serial_number,
    model: rest.join(" ") || ds.model,
    manufacturer: mfr || "ABB",
    power_capacity: ds.power_kw,
    status: ds.status === "online" || ds.status === "charging" ? "active"
          : ds.status === "maintenance" ? "maintenance" : "inactive",
    location_id: locId,
    location: { id: locId, name: ds.name, address: ds.address, city: ds.city },
    connectors_count: ds.connectors,
    active_sessions: ds.status === "charging" ? 1 : 0,
    is_online: ds.status !== "offline" && ds.status !== "maintenance",
    last_heartbeat: ds.last_heartbeat,
    tariff_per_kwh: ds.price_per_kwh,
    created_at: "2025-09-01T00:00:00Z",
    updated_at: ds.last_heartbeat,
  };
}

/** Sentinel value to distinguish "no argument" from "explicit undefined" */
const NO_ARG = Symbol("NO_ARG");

/**
 * Fetch all stations (via backend API).
 * Backend filters by auth cookie — ownerId is NOT sent to the API.
 *
 * - `useOwnerStations()` — fires immediately (enabled: true).
 * - `useOwnerStations(user?.id)` — waits until user is loaded (enabled: !!ownerId).
 * - `useOwnerStations(undefined)` — disabled (e.g. for non-owner users).
 */
export function useOwnerStations(_ownerId: string | undefined = NO_ARG as unknown as undefined) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  // Called with no args → always enabled; called with a value → wait for truthy
  const shouldEnable = (_ownerId as unknown) === NO_ARG ? true : !!_ownerId;
  return useQuery({
    queryKey: ['owner-stations'],
    queryFn: async (): Promise<OwnerStation[]> => {
      if (isDemoModeActive()) return DEMO_BISHKEK_STATIONS.map(mapDemoStation);
      const response = await adminStationsService.listStations({ limit: 200 });
      return response.data.map(mapStation);
    },
    enabled: isAuthenticated && shouldEnable,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    retry: 2,
  });
}

/**
 * Fetch single station details (via backend API)
 */
export function useOwnerStation(stationId?: string) {
  return useQuery({
    queryKey: ['owner-station', stationId],
    queryFn: async (): Promise<OwnerStation | null> => {
      if (!stationId) return null;
      const response = await adminStationsService.getStation(stationId);
      const s = response.station;
      return {
        id: s.id,
        serial_number: s.serial_number || s.id,
        model: s.model || '',
        manufacturer: s.vendor || '',
        power_capacity: s.max_power || 0,
        status: (s.status as OwnerStation['status']) || 'active',
        location_id: s.location_id || '',
        location: s.location_name ? {
          id: s.location_id || '',
          name: s.location_name,
          address: s.location_address || '',
          city: '',
        } : undefined,
        connectors_count: response.connectors?.length || 0,
        connectors: response.connectors ?? [],
        is_online: s.is_online ?? undefined,
        last_heartbeat: s.last_heartbeat ?? undefined,
        tariff_per_kwh: s.tariff_per_kwh ?? undefined,
        user_id: s.user_id ?? undefined,
        ocpp_ws_url: s.ocpp_ws_url ?? undefined,
        evse_id: s.evse_id ?? undefined,
        equipment_model_id: (s as Record<string, unknown>)['equipment_model_id'] as string | undefined,
        equipment_model_name: (s as Record<string, unknown>)['equipment_model_name'] as string | undefined,
        equipment_image_url: (s as Record<string, unknown>)['equipment_image_url'] as string | undefined,
        equipment_manufacturer_name: (s as Record<string, unknown>)['equipment_manufacturer_name'] as string | undefined,
        created_at: s.created_at || '',
        updated_at: s.updated_at || '',
      };
    },
    enabled: !!stationId,
    staleTime: 1000 * 30,
    retry: 2,
  });
}

/**
 * Station data for create/update
 */
export interface StationFormData {
  serial_number: string;
  model: string;
  manufacturer: string;
  power_capacity: number;
  location_id: string;
  price_per_kwh?: number;
  session_fee?: number;
}

/**
 * Create new station (via backend API)
 */
export function useCreateStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StationFormData & { user_id?: string; equipment_model_id?: string }) => {
      logger.info('[useCreateStation] Creating station via backend API', { data });
      const result = await adminStationsService.createStation({
        id: data.serial_number,
        location_id: data.location_id,
        model: data.model,
        vendor: data.manufacturer,
        max_power: data.power_capacity,
        tariff_per_kwh: data.price_per_kwh,
        user_id: data.user_id || undefined,
        equipment_model_id: data.equipment_model_id,
      });
      return { id: result.station_id || data.serial_number, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-stations'] });
    },
  });
}

/**
 * Update existing station (via backend API)
 */
export function useUpdateStation(stationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<StationFormData> & { user_id?: string; ocpp_ws_url?: string; equipment_model_id?: string }) => {
      logger.info('[useUpdateStation] Updating station via backend API', { stationId, data });
      await adminStationsService.updateStation(stationId, {
        model: data.model,
        vendor: data.manufacturer,
        max_power: data.power_capacity,
        location_id: data.location_id,
        tariff_per_kwh: data.price_per_kwh,
        user_id: data.user_id,
        ocpp_ws_url: data.ocpp_ws_url,
        equipment_model_id: data.equipment_model_id,
      });
      return { id: stationId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-station', stationId] });
      queryClient.invalidateQueries({ queryKey: ['owner-stations'] });
    },
  });
}

/**
 * Delete station (via backend API — soft delete)
 */
export function useDeleteStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stationId: string) => {
      logger.info('[useDeleteStation] Deleting station via backend API', { stationId });
      await adminStationsService.deleteStation(stationId);
      return { id: stationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['owner-stations'] });
      queryClient.invalidateQueries({ queryKey: ['owner-station', data.id] });
    },
  });
}
