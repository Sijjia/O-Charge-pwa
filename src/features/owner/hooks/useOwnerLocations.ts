/**
 * Owner Locations Hooks
 * Fetch and manage locations via Backend Admin API
 * (migrated from Supabase direct access)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminLocationsService } from '@/features/admin/services/adminLocationsService';
import type { AdminLocation } from '@/features/admin/services/adminLocationsService';
import { isDemoModeActive } from '@/shared/demo/useDemoMode';
import { DEMO_BISHKEK_LOCATIONS } from '@/shared/demo/demoData';
import { logger } from '@/shared/utils/logger';

export interface OwnerLocation {
  id: string;
  name: string;
  address: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  user_id: string;
  admin_id: string;
  status: 'active' | 'inactive' | 'maintenance';
  stations_count?: number;
  connectors_count?: number;
  region_code?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

/** Map backend AdminLocation → OwnerLocation */
function mapLocation(l: AdminLocation): OwnerLocation {
  return {
    id: l.id,
    name: l.name,
    address: l.address,
    city: l.city || undefined,
    latitude: l.lat ?? undefined,
    longitude: l.lng ?? undefined,
    user_id: '',
    admin_id: '',
    status: (l.status as OwnerLocation['status']) || 'active',
    stations_count: l.station_count || 0,
    created_at: l.created_at || '',
    updated_at: l.created_at || '',
  };
}

// Location creation payload (kept for backward compat)
export interface CreateLocationInput {
  name: string;
  address: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  user_id: string;
  admin_id: string;
  status?: 'active' | 'inactive' | 'maintenance';
  region_code?: string;
  image_url?: string;
}

// Location update payload
export interface UpdateLocationInput {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  status?: 'active' | 'inactive' | 'maintenance';
  region_code?: string;
  image_url?: string;
}

/**
 * Fetch all locations (via backend API)
 */
export function useOwnerLocations(_ownerId?: string) {
  return useQuery({
    queryKey: ['owner-locations'],
    queryFn: async (): Promise<OwnerLocation[]> => {
      if (isDemoModeActive()) return DEMO_BISHKEK_LOCATIONS as OwnerLocation[];
      const response = await adminLocationsService.listLocations({ limit: 200 });
      return response.data.map(mapLocation);
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    retry: 2,
  });
}

/**
 * Fetch single location details (via backend API)
 */
export function useOwnerLocation(locationId?: string) {
  return useQuery({
    queryKey: ['owner-location', locationId],
    queryFn: async (): Promise<OwnerLocation | null> => {
      if (!locationId) return null;
      const response = await adminLocationsService.getLocation(locationId);
      const l = response.location;
      return {
        id: l.id,
        name: l.name,
        address: l.address,
        city: l.city || undefined,
        latitude: l.lat ?? undefined,
        longitude: l.lng ?? undefined,
        user_id: '',
        admin_id: '',
        status: (l.status as OwnerLocation['status']) || 'active',
        stations_count: response.stations?.length || 0,
        created_at: l.created_at || '',
        updated_at: l.updated_at || '',
      };
    },
    enabled: !!locationId,
    staleTime: 1000 * 30,
    retry: 2,
  });
}

/**
 * Create a new location (via backend API)
 */
export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLocationInput) => {
      logger.info('[useCreateLocation] Creating location via backend API', { name: input.name });
      const result = await adminLocationsService.createLocation({
        name: input.name,
        address: input.address,
        city: input.city,
        lat: input.latitude,
        lng: input.longitude,
        status: input.status,
        image_url: input.image_url,
      });
      return { id: result.location_id || '', name: input.name };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-locations'] });
      queryClient.invalidateQueries({ queryKey: ['owner-stats'] });
    },
  });
}

/**
 * Update an existing location (via backend API)
 */
export function useUpdateLocation(locationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateLocationInput) => {
      logger.info('[useUpdateLocation] Updating location via backend API', { locationId });
      await adminLocationsService.updateLocation(locationId, {
        name: input.name,
        address: input.address,
        city: input.city,
        lat: input.latitude,
        lng: input.longitude,
        status: input.status,
        image_url: input.image_url,
      });
      return { id: locationId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-location', locationId] });
      queryClient.invalidateQueries({ queryKey: ['owner-locations'] });
      queryClient.invalidateQueries({ queryKey: ['owner-stats'] });
    },
  });
}

/**
 * Delete a location (via backend API — soft delete)
 */
export function useDeleteLocation(locationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      logger.info('[useDeleteLocation] Deleting location via backend API', { locationId });
      await adminLocationsService.deleteLocation(locationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-location', locationId] });
      queryClient.invalidateQueries({ queryKey: ['owner-locations'] });
      queryClient.invalidateQueries({ queryKey: ['owner-stats'] });
    },
  });
}
