/**
 * Booking Service — API calls for connector reservations
 * Backend: POST /api/v1/booking/create, GET /api/v1/booking/active, DELETE /api/v1/booking/{id}
 */
import { fetchJson, z } from "@/api/unifiedClient";

// --- Schemas ---

const BookingSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  station_id: z.string(),
  connector_id: z.number(),
  status: z.string(),
  created_at: z.string(),
  expires_at: z.string(),
  duration_minutes: z.number().optional(),
  remaining_seconds: z.number().optional(),
});

const CreateBookingResponseSchema = z.object({
  success: z.boolean(),
  booking: BookingSchema.optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

const ActiveBookingResponseSchema = z.object({
  success: z.boolean(),
  booking: BookingSchema.nullable(),
  message: z.string().optional(),
  error: z.string().optional(),
});

const CancelBookingResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type Booking = z.infer<typeof BookingSchema>;
export type CreateBookingResponse = z.infer<typeof CreateBookingResponseSchema>;
export type ActiveBookingResponse = z.infer<typeof ActiveBookingResponseSchema>;

// --- API calls ---

export async function createBooking(
  stationId: string,
  connectorId: number,
  durationMinutes: number = 30,
): Promise<CreateBookingResponse> {
  return fetchJson(
    "/api/v1/booking/create",
    {
      method: "POST",
      body: {
        station_id: stationId,
        connector_id: connectorId,
        duration_minutes: durationMinutes,
      },
    },
    CreateBookingResponseSchema,
  );
}

export async function getActiveBooking(): Promise<ActiveBookingResponse> {
  return fetchJson(
    "/api/v1/booking/active",
    { method: "GET" },
    ActiveBookingResponseSchema,
  );
}

export async function cancelBooking(bookingId: string) {
  return fetchJson(
    `/api/v1/booking/${bookingId}`,
    { method: "DELETE" },
    CancelBookingResponseSchema,
  );
}
