/**
 * useBooking — React Query hooks for booking operations
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getActiveBooking,
  createBooking,
  cancelBooking,
  type Booking,
} from "../bookingService";

export function useActiveBooking() {
  return useQuery({
    queryKey: ["booking", "active"],
    queryFn: getActiveBooking,
    staleTime: 1000 * 10, // 10 sec
    refetchInterval: (query) => {
      // Poll every 10s while there's an active booking (for countdown)
      const booking = query.state.data?.booking;
      return booking ? 1000 * 10 : false;
    },
    select: (data) => data.booking,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      stationId,
      connectorId,
      durationMinutes,
    }: {
      stationId: string;
      connectorId: number;
      durationMinutes?: number;
    }) => createBooking(stationId, connectorId, durationMinutes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["booking", "active"] });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["booking", "active"] });
    },
  });
}

export function useBooking() {
  const { data: activeBooking, isLoading } = useActiveBooking();
  const createMutation = useCreateBooking();
  const cancelMutation = useCancelBooking();

  return {
    activeBooking: activeBooking as Booking | null | undefined,
    isLoading,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    cancel: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
  };
}
