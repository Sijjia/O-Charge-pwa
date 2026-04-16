/**
 * API Zod Schemas - Runtime 20;840F8O >B25B>2 >B Backend API
 *
 * : -B8 AE5<K 8A?>;L7CNBAO 4;O 20;840F88 >B25B>2 >B OCPP Backend API.
 * =8  8A?>;L7CNBAO 4;O 20;840F88 Supabase fallback 70?@>A>2 (A<. rpApi.ts:386-510).
 *
 * @8=F8?K:
 * - 57>?0A=>ABL: AB@>30O 20;840F8O 2A5E ?>;59
 * - @>872>48B5;L=>ABL: <8=8<0;L=K5 B@0=AD>@<0F88
 * - "8?>157>?0A=>ABL: A8=E@>=870F8O A types.ts
 *
 * @see src/api/types.ts - TypeScript 8=B5@D59AK
 * @see src/services/rpApi.ts - 8A?>;L7>20=85 AE5<
 */

import { z } from "zod";

// ============== LOCATIONS & STATIONS ==============

/**
 * !E5<0 4;O :>>@48=0B ;>:0F88
 */
const zCoordinates = z.object({
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

/**
 * !E5<0 4;O B0@8D0 AB0=F88
 *
 * : Backend 2>72@0I05B "tariff" A ?>;5< "price_per_kwh" ( "rate_per_kwh")
 */
const zTariff = z.object({
  price_per_kwh: z.number(), // &5=0 2 A><0E 70 :B�G
  session_fee: z.number(), // $8:A8@>20==0O ?;0B0 70 A5AA8N
  currency: z.string(), // "KGS"
});

/**
 * Схема для summary коннекторов внутри Location
 * (включает total)
 */
const zConnectorsSummary = z.object({
  total: z.number(),
  available: z.number(),
  occupied: z.number(),
  faulted: z.number(),
});

/**
 * Схема для summary коннекторов внутри Station
 * (НЕ включает total - Backend его не возвращает для Station)
 */
const zStationConnectorsSummary = z.object({
  available: z.number(),
  occupied: z.number(),
  faulted: z.number(),
});

/**
 * !E5<0 4;O summary AB0=F89
 */
const zStationsSummary = z.object({
  total: z.number(),
  available: z.number(),
  occupied: z.number(),
  offline: z.number(),
  maintenance: z.number(),
});

/**
 * Схема для отдельной станции внутри локации
 *
 * ВАЖНО: Backend возвращает status = "active" (не "available")
 * connectors_summary БЕЗ поля total (используем zStationConnectorsSummary)
 */
const zStation = z.object({
  id: z.string(),
  serial_number: z.string(),
  model: z.string(),
  manufacturer: z.string(),
  status: z.string(), // Backend возвращает "active", "offline", etc - используем string вместо enum
  power_capacity: z.number(),
  connectors_count: z.number(),
  tariff: zTariff,
  connectors_summary: zStationConnectorsSummary, // ← Используем schema БЕЗ total
});

/**
 * Схема для одной локации
 *
 * КРИТИЧНО: поле stations может быть:
 * - null когда include_stations=false
 * - array когда include_stations=true
 *
 * Backend спецификация v1.3.0
 */
const zLocation = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  city: z.string().nullish(),
  country: z.string().nullish(),
  coordinates: zCoordinates,
  status: z.string(), // Backend возвращает: "available", "partial", "occupied", "maintenance", "offline"
  stations_summary: zStationsSummary,
  connectors_summary: zConnectorsSummary,
  stations: z.array(zStation).nullable(), // ← NULLABLE (не optional)! Backend возвращает null, не undefined
});

/**
 * !E5<0 4;O >B25B0 GET /api/v1/locations
 *
 * Backend 2>72@0I05B >15@B:C A success, total, 8 <0AA82>< locations
 */
export const zLocationsEnvelopeBackend = z.object({
  success: z.boolean(),
  total: z.number(),
  locations: z.array(zLocation),
});

// ============== STATION STATUS ==============

/**
 * !E5<0 4;O >4=>3> :>==5:B>@0 2 >B25B5 station status
 */
const zStationConnector = z.object({
  id: z.number(),
  type: z.string(),
  status: z.string(),
  available: z.boolean(),
  power_kw: z.number().optional(),
  error: z.string().nullish(),
});

/**
 * !E5<0 4;O >B25B0 GET /api/v1/station/status/{station_id}
 */
export const zStationStatusResponse = z.object({
  success: z.boolean(),
  station_id: z.string(),
  serial_number: z.string(),
  model: z.string(),
  manufacturer: z.string(),
  online: z.boolean(),
  station_status: z.string(),
  location_status: z.string(),
  available_for_charging: z.boolean(),
  location_id: z.string(),
  location_name: z.string(),
  location_address: z.string(),
  connectors: z.array(zStationConnector),
  total_connectors: z.number(),
  available_connectors: z.number(),
  occupied_connectors: z.number(),
  faulted_connectors: z.number(),
  tariff_rub_kwh: z.number(),
  session_fee: z.number(),
  currency: z.string(),
  working_hours: z.string(),
  message: z.string().nullish(),
});

// ============== CHARGING ==============

/**
 * !E5<0 4;O >B25B0 POST /api/v1/charging/start
 */
export const zStartChargingResponse = z.object({
  success: z.boolean(),
  message: z.string().nullish(),
  error: z.string().nullish(),
  session_id: z.string().optional(),
  connector_id: z.number().optional(),
  reserved_amount: z.number().optional(),
  limit_type: z.enum(["energy", "amount", "none"]).optional(),
  limit_value: z.number().optional(),
  rate_per_kwh: z.number().optional(),
  session_fee: z.number().optional(),
  required_amount: z.number().optional(),
  current_balance: z.number().optional(),
});

/**
 * Схема для сессии внутри ChargingStatus
 *
 * Backend возвращает дублирующие поля для совместимости:
 * - energy_kwh = energy_consumed
 * - current_amount = current_cost
 * - progress_percent = limit_percentage
 * - session_id = id
 */
const zChargingSession = z.object({
  id: z.string(),
  session_id: z.string().optional(), // дублирует id
  // КРИТИЧНО: status должен быть string, т.к. backend может возвращать различные статусы
  status: z.string(), // "started", "stopped", "error", "preparing" и другие
  station_id: z.string(),
  connector_id: z.number().nullable().optional(), // может быть null или отсутствовать при preparing
  start_time: z.string().nullable(), // ISO datetime
  stop_time: z.string().nullable().optional(),

  // Энергетические данные (nullable для защиты от null из backend)
  energy_consumed: z
    .number()
    .nullable()
    .optional()
    .transform((v) => v ?? 0),
  energy_kwh: z
    .number()
    .nullable()
    .optional()
    .transform((v) => v ?? 0), // дублирует energy_consumed
  current_cost: z
    .number()
    .nullable()
    .optional()
    .transform((v) => v ?? 0),
  current_amount: z
    .number()
    .nullable()
    .optional()
    .transform((v) => v ?? 0), // дублирует current_cost
  power_kw: z
    .number()
    .nullable()
    .optional()
    .transform((v) => v ?? 0),

  // Длительность
  charging_duration_minutes: z
    .number()
    .nullable()
    .optional()
    .transform((v) => v ?? 0),
  duration_seconds: z
    .number()
    .nullable()
    .optional()
    .transform((v) => v ?? 0),

  // Резерв и тарифы
  reserved_amount: z
    .number()
    .nullable()
    .optional()
    .transform((v) => v ?? 0),
  rate_per_kwh: z
    .number()
    .nullable()
    .optional()
    .transform((v) => v ?? 0),
  session_fee: z
    .number()
    .nullable()
    .optional()
    .transform((v) => v ?? 0),

  // Лимиты и прогресс
  limit_type: z.enum(["energy", "amount", "none"]).nullable().optional(),
  limit_value: z.number().nullable().optional(),
  limit_reached: z
    .boolean()
    .nullable()
    .optional()
    .transform((v) => v ?? false),
  limit_percentage: z
    .number()
    .nullable()
    .optional()
    .transform((v) => v ?? 0),
  progress_percent: z
    .number()
    .nullable()
    .optional()
    .transform((v) => v ?? 0), // дублирует limit_percentage

  // OCPP данные
  ocpp_transaction_id: z.number().nullable().optional(),
  meter_start: z.number().nullable().optional(),
  meter_current: z.number().nullable().optional(),

  // Данные EV
  ev_battery_soc: z.number().nullable().optional(),

  // Статус станции
  station_online: z
    .boolean()
    .nullable()
    .optional()
    .transform((v) => v ?? true),
});

/**
 * !E5<0 4;O >B25B0 GET /api/v1/charging/status/{session_id}
 */
export const zChargingStatus = z.object({
  success: z.boolean(),
  session: zChargingSession.optional(),
});

/**
 * Схема для ответа POST /api/v1/charging/stop
 *
 * Backend возвращает:
 * - actual_cost (не final_cost)
 * - refund_amount (не refunded_amount)
 * - reserved_amount, rate_per_kwh, new_balance
 */
export const zStopChargingResponse = z.object({
  success: z.boolean(),
  message: z.string().nullish(),
  error: z.string().nullish(),
  session_id: z.string().optional(),
  station_id: z.string().optional(),
  client_id: z.string().optional(),
  start_time: z.string().nullish(),
  stop_time: z.string().nullish(),
  energy_consumed: z.number().optional(),
  rate_per_kwh: z.number().optional(),
  reserved_amount: z.number().optional(),
  actual_cost: z.number().optional(),
  refund_amount: z.number().optional(),
  new_balance: z.number().optional(),
  station_online: z.boolean().optional(),
});

// ============== BALANCE & PAYMENTS ==============

/**
 * !E5<0 4;O >B25B0 POST /api/v1/balance/topup-qr
 *
 * !!",: QR B>?-0? - 548=AB25==K9 157>?0A=K9 A?>A>1 ?>?>;=5=8O =0 :;85=B5
 * (=5 B@51C5B ?5@540G8 40==KE :0@BK)
 */
export const zTopupQRResponse = z.object({
  success: z.boolean(),
  invoice_id: z.string().optional(),
  order_id: z.string().optional(),
  qr_code: z.string().optional(), // 0==K5 4;O 35=5@0F88 QR
  qr_code_url: z.string().optional(), // URL :0@B8=:8 QR-:>40
  app_link: z.string().optional(), // Deeplink для Namba One
  amount: z.number().optional(),
  client_id: z.string().optional(),
  current_balance: z.number().optional(),
  qr_expires_at: z.string().optional(), // ISO datetime
  invoice_expires_at: z.string().optional(), // ISO datetime
  qr_lifetime_seconds: z.number().optional(),
  invoice_lifetime_seconds: z.number().optional(),
  error: z.string().nullish(),
});

/**
 * !E5<0 4;O >B25B0 POST /api/v1/balance/topup-card
 *
 * @deprecated -B>B <5B>4  !,#"!/ 2 ?@8;>65=88 (PCI DSS compliance).
 * !E5<0 A>E@0=5=0 4;O >1@0B=>9 A>2<5AB8<>AB8 API.
 */
export const zTopupCardResponse = z.object({
  success: z.boolean(),
  auth_key: z.string().optional(),
  acs_url: z.string().optional(),
  md: z.string().optional(),
  pa_req: z.string().optional(),
  term_url: z.string().optional(),
  client_id: z.string().optional(),
  current_balance: z.number().optional(),
  error: z.string().nullish(),
});

/**
 * !E5<0 4;O >B25B0 GET /api/v1/payment/status/{invoice_id}
 *
 * \u0012\u0010\u0016\u001d\u001e: status_text 2>72@0I05BAO =0 @CAA:>< O7K:5 4;O UI (\u001d\u0015 enum)
 * \u00140;O ;>38:8 8A?>;L7C9B5 status (number)
 */
export const zPaymentStatus = z.object({
  success: z.boolean(),
  status: z
    .union([
      z.literal(0),
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.string(), // fallback для строковых статусов от новых версий API
    ])
    .optional(), // Namba One коды: 0-processing, 1-approved, 2-canceled, 3-refunded, 4-partial_refund
  status_text: z.string().optional(), // #CAA:89 B5:AB 4;O UI, =5 enum
  amount: z.number().optional(),
  paid_amount: z.number().nullish(), // <>65B 1KBL null
  invoice_id: z.string().optional(),
  can_proceed: z.boolean().optional().default(false),
  can_start_charging: z.boolean().optional().default(false),
  qr_expired: z.boolean().optional().default(false),
  invoice_expired: z.boolean().optional().default(false),
  qr_expires_at: z.string().datetime().nullable().optional(),
  invoice_expires_at: z.string().datetime().nullable().optional(),
  last_status_check_at: z.string().datetime().nullable().optional(), // \u00122@5<O ?>A;54=59 ?@>25@:8
  needs_callback_check: z.boolean().optional().default(false), // "@51C5BAO ?@>25@:0 G5@57 callback
  error: z.string().nullable().optional(),
});

// ============== TYPE EXPORTS ==============

/**
 * -:A?>@B8@C5< B8?K 4;O 8A?>;L7>20=8O 2 TypeScript
 * (02B><0B8G5A:8 2K2>4OBAO 87 Zod AE5<)
 */
export type LocationsEnvelopeBackend = z.infer<
  typeof zLocationsEnvelopeBackend
>;
export type Location = z.infer<typeof zLocation>;
export type Station = z.infer<typeof zStation>;
export type StationStatusResponse = z.infer<typeof zStationStatusResponse>;
export type StartChargingResponse = z.infer<typeof zStartChargingResponse>;
export type ChargingStatus = z.infer<typeof zChargingStatus>;
export type StopChargingResponse = z.infer<typeof zStopChargingResponse>;
export type TopupQRResponse = z.infer<typeof zTopupQRResponse>;
export type TopupCardResponse = z.infer<typeof zTopupCardResponse>;
export type PaymentStatus = z.infer<typeof zPaymentStatus>;
