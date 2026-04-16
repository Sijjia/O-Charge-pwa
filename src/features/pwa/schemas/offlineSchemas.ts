import { z } from "zod";

export const CoordinatesSchema = z
  .object({
    lat: z.number(),
    lng: z.number(),
  })
  .strict()
  .optional();

export const StationSummarySchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform((v) => String(v)),
    name: z.string().optional(),
  })
  .passthrough();

export const LocationItemSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform((v) => String(v)),
    name: z.string().optional(),
    coordinates: CoordinatesSchema,
    stations: z.array(StationSummarySchema).optional(),
  })
  .passthrough();

export const LocationsResponseSchema = z
  .object({
    success: z.boolean().optional(),
    data: z.array(LocationItemSchema).optional(),
  })
  .passthrough();

export type LocationItem = z.infer<typeof LocationItemSchema>;

export const StationStatusSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform((v) => String(v)),
    status: z
      .enum(["available", "offline", "maintenance", "partial"])
      .optional(),
    connectors: z
      .array(
        z
          .object({
            id: z.union([z.string(), z.number()]).transform((v) => String(v)),
            status: z.enum(["available", "occupied", "faulted"]).optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

export type StationStatus = z.infer<typeof StationStatusSchema>;
