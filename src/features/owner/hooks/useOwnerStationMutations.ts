/**
 * Owner Station Mutations
 * Create, update, and delete stations for owner dashboard
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/config/supabase';
import { logger } from '@/shared/utils/logger';

// Station creation payload
export interface CreateStationInput {
  serial_number: string;
  model: string;
  manufacturer: string;
  power_capacity: number;
  location_id: string;
  user_id: string; // Owner ID
  connectors_count?: number;
  status?: 'active' | 'inactive' | 'maintenance';
  connector_types?: string[];
  installation_date?: string;
  firmware_version?: string;
  price_per_kwh?: number;
  session_fee?: number;
  currency?: string;
}

// Station update payload
export interface UpdateStationInput {
  serial_number?: string;
  model?: string;
  manufacturer?: string;
  power_capacity?: number;
  location_id?: string;
  connectors_count?: number;
  status?: 'active' | 'inactive' | 'maintenance';
  connector_types?: string[];
  installation_date?: string;
  firmware_version?: string;
  price_per_kwh?: number;
  session_fee?: number;
  currency?: string;
}

/**
 * Create a new charging station
 */
export function useCreateStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateStationInput) => {
      try {
        logger.info('[useCreateStation] Creating station', {
          serial_number: input.serial_number,
          user_id: input.user_id,
        });

        // Prepare station data
        const stationData = {
          serial_number: input.serial_number,
          model: input.model,
          manufacturer: input.manufacturer,
          power_capacity: input.power_capacity,
          location_id: input.location_id,
          user_id: input.user_id,
          connectors_count: input.connectors_count ?? 1,
          status: input.status ?? 'active',
          connector_types: input.connector_types ?? ['Type2'],
          installation_date: input.installation_date,
          firmware_version: input.firmware_version,
          price_per_kwh: input.price_per_kwh ?? 0,
          session_fee: input.session_fee ?? 0,
          currency: input.currency ?? 'KGS',
          is_available: input.status === 'active',
        };

        const { data: createdStation, error } = await supabase
          .from('stations')
          .insert(stationData)
          .select()
          .single();

        if (error) {
          logger.error('[useCreateStation] Failed to create station', {
            error,
            input,
          });
          throw new Error(error.message || 'Не удалось создать станцию');
        }

        logger.info('[useCreateStation] Station created successfully', {
          station_id: createdStation.id,
        });

        return createdStation;
      } catch (error) {
        logger.error('[useCreateStation] Unexpected error', { error });
        throw error;
      }
    },
    onSuccess: (_data, variables) => {
      // Invalidate relevant queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['owner-stations', variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ['owner-stats', variables.user_id] });

      logger.info('[useCreateStation] Cache invalidated after creation');
    },
    onError: (error) => {
      logger.error('[useCreateStation] Mutation failed', { error });
    },
  });
}

/**
 * Update an existing charging station
 */
export function useUpdateStation(stationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateStationInput) => {
      try {
        logger.info('[useUpdateStation] Updating station', {
          station_id: stationId,
          updates: Object.keys(input),
        });

        // Prepare update data
        const updateData: Record<string, unknown> = {
          ...input,
          updated_at: new Date().toISOString(),
        };

        // Update is_available based on status if status is being changed
        if (input.status !== undefined) {
          updateData['is_available'] = input.status === 'active';
        }

        const { data: updatedStation, error } = await supabase
          .from('stations')
          .update(updateData)
          .eq('id', stationId)
          .select()
          .single();

        if (error) {
          logger.error('[useUpdateStation] Failed to update station', {
            error,
            station_id: stationId,
          });
          throw new Error(error.message || 'Не удалось обновить станцию');
        }

        logger.info('[useUpdateStation] Station updated successfully', {
          station_id: stationId,
        });

        return updatedStation;
      } catch (error) {
        logger.error('[useUpdateStation] Unexpected error', { error });
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['owner-station', stationId] });
      queryClient.invalidateQueries({ queryKey: ['owner-stations'] });
      queryClient.invalidateQueries({ queryKey: ['owner-stats'] });

      logger.info('[useUpdateStation] Cache invalidated after update');
    },
    onError: (error) => {
      logger.error('[useUpdateStation] Mutation failed', { error });
    },
  });
}

/**
 * Delete a charging station (soft delete by setting status to inactive)
 */
export function useDeleteStation(stationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        logger.info('[useDeleteStation] Soft deleting station', {
          station_id: stationId,
        });

        // Soft delete: set status to inactive and is_available to false
        const { error } = await supabase
          .from('stations')
          .update({
            status: 'inactive',
            is_available: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', stationId)
          .select()
          .single();

        if (error) {
          logger.error('[useDeleteStation] Failed to delete station', {
            error,
            station_id: stationId,
          });
          throw new Error(error.message || 'Не удалось удалить станцию');
        }

        logger.info('[useDeleteStation] Station deleted successfully', {
          station_id: stationId,
        });
      } catch (error) {
        logger.error('[useDeleteStation] Unexpected error', { error });
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['owner-station', stationId] });
      queryClient.invalidateQueries({ queryKey: ['owner-stations'] });
      queryClient.invalidateQueries({ queryKey: ['owner-stats'] });

      logger.info('[useDeleteStation] Cache invalidated after deletion');
    },
    onError: (error) => {
      logger.error('[useDeleteStation] Mutation failed', { error });
    },
  });
}
