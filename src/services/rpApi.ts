/**
 * O!Charge API v1 Service - ЕДИНСТВЕННЫЙ API клиент для всего приложения
 * Интеграция с бэкендом OCPP сервера (v1.2.4+)
 *
 * ВАЖНО:
 * - Использует Supabase JWT токены (HS256/RS256/ES256)
 * - Backend автоматически извлекает client_id из JWT (sub claim)
 * - Публичные endpoints (/locations, /station/status) НЕ требуют токенов
 * - Защищенные endpoints требуют Authorization: Bearer <token>
 * - Это ЕДИНСТВЕННЫЙ файл для всех API вызовов
 */

import { supabase } from "../shared/config/supabase";
import { logger } from "@/shared/utils/logger";
import { fetchJson, z } from "@/api/unifiedClient";
import { ApiError } from "@/shared/errors/apiErrors";
import { API_ENDPOINTS } from "@/api/endpoints";
import { generateIdempotencyKey } from "@/shared/utils/idempotency";
import { ensureCsrfToken } from "@/shared/security/csrf";
import {
  zLocationsEnvelopeBackend,
  zStartChargingResponse,
  zChargingStatus,
  zStopChargingResponse,
  zTopupQRResponse,
  zTopupCardResponse,
  zPaymentStatus,
  zStationStatusResponse,
} from "@/api/schemas";
import { DEFAULT_RATE_PER_KWH } from "@/features/pricing/types";
import type {
  Location,
  StartChargingRequest,
  StartChargingResponse,
  StopChargingResponse,
  TopupQRRequest,
  TopupQRResponse,
  TopupCardResponse,
  PaymentStatus,
} from "@/api/types";

// Re-export types for backward compatibility
export type { PaymentStatus, TopupQRResponse } from "@/api/types";

// z imported from @/api/unifiedClient (which re-exports from zod)

// ============= Supabase Fallback Types =============

/**
 * Supabase connector row type (для fallback запросов)
 */
interface SupabaseConnectorRow {
  id?: string;
  connector_number?: number;
  connector_type?: string;
  power_kw?: number;
  status?: string;
  error_code?: string;
  [key: string]: unknown;
}

/**
 * Mapped connector type (промежуточный формат)
 */
interface MappedConnector {
  id: number | undefined;
  type: string | undefined;
  power_kw: number | undefined;
  available: boolean;
  status: string | undefined;
  error_code: string;
}

/**
 * Supabase station row type (для fallback запросов)
 */
interface SupabaseStationRow {
  id: string;
  serial_number: string;
  model?: string;
  manufacturer?: string;
  location_id: string;
  power_capacity?: number;
  connector_types?: string[];
  status: string;
  connectors_count?: number;
  price_per_kwh?: string | number;
  session_fee?: string | number;
  currency?: string;
  firmware_version?: string;
  is_available?: boolean;
  last_heartbeat_at?: string;
  connectors?: SupabaseConnectorRow[];
  [key: string]: unknown;
}

/**
 * Supabase location row type (для fallback запросов)
 */
interface SupabaseLocationRow {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  status: string;
  stations_count?: number;
  connectors_count?: number;
  stations?: SupabaseStationRow[];
  [key: string]: unknown;
}

const API_VERSION = "/api/v1";
// API origin: пустая строка = relative URL через proxy (Vercel rewrites / nginx)
// Для прямого доступа к backend задайте VITE_API_URL=https://ocpp.asystem.kg
const API_ORIGIN: string = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL as string | undefined) || ""
  : "";

// ============= Legacy Types (REMOVED - use @/api/types instead) =============
// All types (StartChargingRequest, StartChargingResponse, ChargingStatus,
// StopChargingResponse, Location, Station, ConnectorStatus, TopupQRRequest,
// TopupQRResponse, TopupCardRequest, TopupCardResponse, PaymentStatus)
// are now imported from @/api/types.ts (line 28-43)

// All legacy type definitions removed - use @/api/types.ts

class RPApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_ORIGIN
      ? `${API_ORIGIN}${API_VERSION}`
      : `${API_VERSION}`;
  }

  /**
   * Получить текущий client_id из Supabase Auth
   */
  private async getClientId(): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }
    return user.id;
  }

  /**
   * Базовый метод для API запросов
   */
  private async apiRequest<T>(
    endpoint: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "DELETE";
      body?: unknown;
      timeoutMs?: number;
      retries?: number;
    },
    schema: import("zod").ZodType<T>,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    logger.debug(`[RPAPI] ${options.method || "GET"} ${url}`);

    // Публичные endpoints (НЕ требуют авторизации, токены игнорируются backend)
    const PUBLIC_ENDPOINTS = ["/locations", "/station/status"];
    const isPublic = PUBLIC_ENDPOINTS.some((pub) => endpoint.startsWith(pub));

    // Режим аутентификации: token (по умолчанию) или cookie (feature flag)
    const authMode =
      (import.meta.env["VITE_AUTH_MODE"] as string | undefined) || "token";

    // Добавляем Authorization: Bearer <Supabase JWT> если доступен и режим token
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const method = options.method || "GET";
    const headers: Record<string, string> = {};

    if (authMode !== "cookie" && session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
      // Debug: логируем первые и последние символы токена
      const token = session.access_token;
      logger.debug(
        `[RPAPI] Auth token: ${token.substring(0, 20)}...${token.substring(token.length - 20)}`,
      );
    } else if (!isPublic && authMode !== "cookie") {
      // WARNING только для защищенных endpoints
      logger.warn(
        `[RPAPI] No access token for protected endpoint: ${endpoint}`,
      );
    }
    // Добавляем Idempotency-Key для критичных операций (предотвращает дубликаты)
    if (method === "POST" || method === "PUT" || method === "DELETE") {
      headers["Idempotency-Key"] = generateIdempotencyKey();
    }
    return await fetchJson<T>(
      url,
      {
        method,
        body: options.body,
        timeoutMs: options.timeoutMs ?? 10000,
        retries: options.retries ?? 2,
        headers
      },
      schema,
    );
  }

  // ============== CHARGING ==============

  /**
   * Начать зарядку
   */
  async startCharging(
    stationId: string,
    connectorId: number,
    limits?: { energy_kwh?: number; amount_som?: number },
  ): Promise<StartChargingResponse> {
    return this.apiRequest(
      "/charging/start",
      {
        method: "POST",
        body: {
          station_id: stationId,
          connector_id: connectorId,
          ...limits,
        },
      },
      zStartChargingResponse,
    );
  }

  /**
   * Получить статус зарядки
   */
  async getChargingStatus(
    sessionId: string,
  ): Promise<import("../api/types").ChargingStatus> {
    const parsed = await this.apiRequest(
      `/charging/status/${sessionId}`,
      { method: "GET" },
      zChargingStatus,
    );

    logger.debug(
      "[rpApi.getChargingStatus] Zod parsed data:",
      parsed,
    );

    const session = parsed.session
      ? {
        id: parsed.session.id,
        status: parsed.session.status,
        station_id: parsed.session.station_id,
        connector_id: parsed.session.connector_id,
        start_time: parsed.session.start_time,
        stop_time: parsed.session.stop_time,
        // Энергетические данные (дублирующие поля для совместимости)
        energy_consumed: parsed.session.energy_consumed ?? 0,
        energy_kwh: parsed.session.energy_kwh ?? 0,
        current_cost: parsed.session.current_cost ?? 0,
        current_amount: parsed.session.current_amount ?? 0,
        power_kw: parsed.session.power_kw ?? 0,
        // Резерв и тарифы
        reserved_amount: parsed.session.reserved_amount ?? 0,
        limit_type: parsed.session.limit_type,
        limit_value: parsed.session.limit_value,
        limit_reached: parsed.session.limit_reached ?? false,
        limit_percentage: parsed.session.limit_percentage ?? 0,
        progress_percent: parsed.session.progress_percent ?? 0,
        rate_per_kwh: parsed.session.rate_per_kwh ?? 0,
        session_fee: parsed.session.session_fee ?? 0,
        // OCPP данные
        ocpp_transaction_id: parsed.session.ocpp_transaction_id,
        meter_start: parsed.session.meter_start,
        meter_current: parsed.session.meter_current,
        // Длительность
        charging_duration_minutes:
          parsed.session.charging_duration_minutes ?? 0,
        duration_seconds: parsed.session.duration_seconds ?? 0,
        // Данные EV и статус станции
        ev_battery_soc: parsed.session.ev_battery_soc,
        station_online: parsed.session.station_online ?? true,
      }
      : undefined;
    return { success: true, session };
  }

  /**
   * Остановить зарядку
   */
  async stopCharging(sessionId: string): Promise<StopChargingResponse> {
    return this.apiRequest(
      "/charging/stop",
      { method: "POST", body: { session_id: sessionId } },
      zStopChargingResponse,
    );
  }

  // ============== LOCATIONS & STATIONS ==============

  /**
   * Получить список локаций со станциями
   */
  /**
   * Normalize Location data from Backend API v1.3.0
   *
   * Добавляет flat fields для обратной совместимости со старыми компонентами:
   * - location.latitude, location.longitude (из coordinates)
   * - location.stations_count, connectors_count, available_connectors (из summaries)
   * - station.price_per_kwh, session_fee, currency (из tariff)
   */
  private normalizeLocation(location: Location): Location {
    return {
      ...location,
      // Flat coordinates для обратной совместимости
      latitude: location.coordinates.latitude ?? undefined,
      longitude: location.coordinates.longitude ?? undefined,
      // Flat summary fields
      stations_count: location.stations_summary.total,
      connectors_count: location.connectors_summary.total,
      available_connectors: location.connectors_summary.available,
      // Normalize stations if present
      stations: location.stations
        ? location.stations.map((station) => ({
          ...station,
          // Flat tariff fields для обратной совместимости
          price_per_kwh: station.tariff.price_per_kwh,
          session_fee: station.tariff.session_fee,
          currency: station.tariff.currency,
        }))
        : null,
    };
  }

  async getLocations(includeStations = true): Promise<Location[]> {
    try {
      const response = await this.apiRequest<
        import("zod").infer<typeof zLocationsEnvelopeBackend>
      >(
        `/locations?include_stations=${includeStations}`,
        { method: "GET" },
        zLocationsEnvelopeBackend,
      );

      // DEBUG в dev: логирование ответа от API
      logger.debug("[RPAPI] API response for /locations:");
      logger.debug(
        `[RPAPI] Backend API success: ${response.success}, total: ${response.total}`,
      );
      logger.debug(
        `[RPAPI] Locations count from API: ${response.locations?.length || 0}`,
      );

      // Normalize locations для обратной совместимости
      const normalized = response.locations.map((loc) =>
        this.normalizeLocation(loc as Location),
      );

      return normalized;
    } catch (error) {
      if (
        import.meta.env.PROD &&
        import.meta.env["VITE_ENABLE_SUPABASE_FALLBACK"] !== "true"
      ) {
        throw error;
      }
      logger.warn(
        "[RPAPI] API unavailable, using Supabase fallback",
        error,
      );

      // Fallback: прямой запрос к Supabase
      logger.debug(`[RPAPI] includeStations: ${includeStations}`);

      if (includeStations) {
        logger.debug("[RPAPI] Starting Supabase query via REST...");

        // Use direct REST API instead of Supabase client to avoid auth issues
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        let locations;
        try {
          const response = await fetch(
            `${supabaseUrl}/rest/v1/locations?status=eq.active&select=id,name,address,city,country,latitude,longitude,status,stations_count,connectors_count,stations(id,serial_number,model,manufacturer,location_id,power_capacity,connector_types,status,connectors_count,price_per_kwh,session_fee,currency,firmware_version,is_available,last_heartbeat_at,connectors(status,connector_number))`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                Prefer: "return=representation",
              },
            },
          );

          logger.debug(
            `[RPAPI] Supabase REST response status: ${response.status}`,
          );

          if (!response.ok) {
            const errorText = await response.text();
            logger.error(
              "[RPAPI] Supabase REST error",
              new Error(errorText),
            );
            throw new Error(
              `Supabase REST error: ${response.status} ${errorText}`,
            );
          }

          locations = await response.json();
          logger.debug(
            `[RPAPI] Supabase REST returned locations: ${locations?.length || 0}`,
          );
        } catch (err) {
          logger.error(
            "[RPAPI] Supabase REST THREW exception",
            err as Error,
          );
          throw err;
        }

        logger.debug(
          `[RPAPI] Supabase fallback returned locations: ${locations?.length || 0}`,
        );

        // Преобразуем к формату API
        const mappedLocations = (locations || []).map(
          (loc: SupabaseLocationRow) => {
            const mappedStatus = this.mapLocationStatus(loc.stations || []);
            logger.debug(
              `[RPAPI] Location ${loc.id}: DB status="${loc.status}" -> mapped status="${mappedStatus}"`,
            );

            const stationsArr = loc.stations || [];
            const availableCount = this.countAvailableConnectors(stationsArr);
            return {
              id: loc.id,
              name: loc.name,
              address: loc.address,
              city: loc.city,
              country: loc.country,
              coordinates: {
                latitude: loc.latitude,
                longitude: loc.longitude,
              },
              latitude: loc.latitude,
              longitude: loc.longitude,
              status: mappedStatus,
              stations_count: loc.stations_count || 0,
              connectors_count: loc.connectors_count || 0,
              available_connectors: availableCount,
              stations_summary: {
                total: stationsArr.length,
                available: stationsArr.filter((s: SupabaseStationRow) => s.status === "Available" || s.is_available).length,
                occupied: stationsArr.filter((s: SupabaseStationRow) => s.status === "Occupied" || s.status === "Charging").length,
                offline: stationsArr.filter((s: SupabaseStationRow) => s.status === "Unavailable" || s.status === "Offline").length,
                maintenance: stationsArr.filter((s: SupabaseStationRow) => s.status === "Faulted").length,
              },
              connectors_summary: {
                total: loc.connectors_count || 0,
                available: availableCount,
                occupied: (loc.connectors_count || 0) - availableCount,
                faulted: 0,
              },
              stations: (loc.stations || []).map((s: SupabaseStationRow) => ({
                id: s.id,
                serial_number: s.serial_number,
                model: s.model,
                manufacturer: s.manufacturer,
                location_id: s.location_id,
                power_capacity: s.power_capacity,
                connector_types: s.connector_types || [],
                status: s.status,
                connectors_count: s.connectors_count || 1,
                price_per_kwh:
                  typeof s.price_per_kwh === "number"
                    ? s.price_per_kwh
                    : parseFloat(String(s.price_per_kwh || 0)),
                session_fee:
                  typeof s.session_fee === "number"
                    ? s.session_fee
                    : parseFloat(String(s.session_fee || 0)),
                currency: s.currency || "KGS",
                firmware_version: s.firmware_version,
                is_available: s.is_available ?? true, // Добавляем is_available
                last_heartbeat_at: s.last_heartbeat_at,
                connectors: Array.isArray(s.connectors)
                  ? s.connectors
                  : undefined,
                // Добавляем координаты из parent location
                latitude: loc.latitude,
                longitude: loc.longitude,
                locationName: loc.name,
                locationAddress: loc.address,
              })),
            };
          },
        );

        logger.debug(
          `[RPAPI] Returning ${mappedLocations.length} mapped locations`,
        );
        return mappedLocations;
      } else {
        const { data: locations, error: locError } = await supabase
          .from("locations")
          .select(
            "id, name, address, city, country, latitude, longitude, status, stations_count, connectors_count",
          )
          .eq("status", "active");

        if (locError) throw locError;

        // Преобразуем к формату Location из @/api/types
        return (locations || []).map(
          (loc): Location => ({
            id: loc.id,
            name: loc.name,
            address: loc.address,
            city: loc.city,
            country: loc.country,
            coordinates: {
              latitude: loc.latitude,
              longitude: loc.longitude,
            },
            status: "available",
            stations_summary: {
              total: loc.stations_count ?? 0,
              available: 0,
              occupied: 0,
              offline: 0,
              maintenance: 0,
            },
            connectors_summary: {
              total: loc.connectors_count ?? 0,
              available: 0,
              occupied: 0,
              faulted: 0,
            },
            stations: null,
            // Legacy flat fields
            latitude: loc.latitude,
            longitude: loc.longitude,
            stations_count: loc.stations_count,
            connectors_count: loc.connectors_count,
            available_connectors: 0,
          }),
        );
      }
    }
  }

  private mapLocationStatus(
    stations: SupabaseStationRow[],
  ): "available" | "occupied" | "offline" | "maintenance" | "partial" {
    if (!stations || stations.length === 0) return "offline";

    // 1) Серый: если ВСЕ станции локации недоступны (is_available=false)
    const activeStations = stations.filter((s) => s.status === "active");
    if (activeStations.length === 0) return "maintenance";

    const availableStations = activeStations.filter(
      (s) => s.is_available === true,
    );
    if (availableStations.length === 0) return "offline";

    // 2) Желтый: станции доступны, но ВСЕ коннекторы заняты
    const allConnectors = availableStations.flatMap((s) =>
      Array.isArray(s.connectors) ? s.connectors : [],
    );
    const hasAnyFreeConnector =
      allConnectors.length === 0
        ? true // нет телеметрии по коннекторам => по умолчанию свободны
        : allConnectors.some(
          (c: SupabaseConnectorRow) =>
            (c?.status ?? "available") === "available",
        );

    if (!hasAnyFreeConnector) return "occupied";

    // 3) Зеленый: есть хотя бы 1 свободный коннектор
    return availableStations.length < activeStations.length
      ? "partial"
      : "available";
  }

  private countAvailableConnectors(stations: SupabaseStationRow[]): number {
    // Учитываем только активные и доступные станции; коннекторы по умолчанию свободны
    return stations
      .filter((s) => s.status === "active" && s.is_available === true)
      .reduce((sum, s) => {
        const connectors: SupabaseConnectorRow[] = Array.isArray(s.connectors)
          ? s.connectors
          : [];
        if (connectors.length === 0) {
          // Нет телеметрии — считаем что все коннекторы свободны
          return sum + (s.connectors_count || 1);
        }
        const free = connectors.filter(
          (c) => (c?.status ?? "available") === "available",
        ).length;
        return sum + free;
      }, 0);
  }

  /**
   * Получить плоский список станций (мобильный формат)
   */
  async getMobileStations(): Promise<import("../api/types").MobileStationItem[]> {
    const resp = await this.apiRequest(
      "/stations",
      { method: "GET" },
      z.object({ success: z.boolean() }).passthrough(),
    );
    return (resp as unknown as { data: import("../api/types").MobileStationItem[] }).data || [];
  }

  /**
   * Получить детали станции в мобильном формате
   */
  async getMobileStationDetail(stationId: string): Promise<import("../api/types").MobileStationDetail | null> {
    const resp = await this.apiRequest(
      `/stations/${stationId}`,
      { method: "GET" },
      z.object({ success: z.boolean() }).passthrough(),
    );
    return (resp as unknown as { data: import("../api/types").MobileStationDetail | null }).data || null;
  }

  /**
   * Получить статус станции
   */
  async getStationStatus(
    stationId: string,
  ): Promise<import("../api/types").StationStatusResponse> {
    try {
      // В контракте tariff_rub_kwh может быть опциональным, но наш тип требует число.
      // Доверяем бэкенду: если поле отсутствует, считаем 13.5.
      const resp = await this.apiRequest(
        `/station/status/${stationId}`,
        { method: "GET", timeoutMs: 3000, retries: 0 },
        zStationStatusResponse,
      );
      const respData = resp as Record<string, unknown>;
      if (respData["tariff_rub_kwh"] == null) {
        respData["tariff_rub_kwh"] = DEFAULT_RATE_PER_KWH;
      }
      return resp as unknown as import("../api/types").StationStatusResponse;
    } catch (error) {
      if (
        import.meta.env.PROD &&
        import.meta.env["VITE_ENABLE_SUPABASE_FALLBACK"] !== "true"
      ) {
        throw error;
      }
      // DEV fallback (или явно разрешённый флагом) через Supabase REST
      const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"];
      const supabaseKey = import.meta.env["VITE_SUPABASE_ANON_KEY"];
      const stationResponse = await fetch(
        `${supabaseUrl}/rest/v1/stations?id=eq.${stationId}&select=id,serial_number,model,manufacturer,status,is_available,location_id,locations(id,name,address),connectors(id,connector_number,connector_type,power_kw,status,error_code)`,
        {
          headers: {
            apikey: String(supabaseKey),
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!stationResponse.ok)
        throw new ApiError(
          "SUPABASE_ERROR",
          `Supabase station query failed: ${stationResponse.status}`,
          stationResponse.status,
        );
      const stations = await stationResponse.json();
      const station = stations[0];
      if (!station) {
        throw new ApiError(
          "STATION_NOT_FOUND",
          `Станция не найдена: ${stationId}`,
          404,
        );
      }
      const connectors = (station.connectors || []).map(
        (c: SupabaseConnectorRow) => ({
          id: c.connector_number,
          type: c.connector_type,
          power_kw: c.power_kw,
          available: c.status === "available",
          status: c.status,
          error_code: c.error_code || "NoError",
        }),
      );
      const location = station.locations;
      const result: import("../api/types").StationStatusResponse = {
        success: true,
        station_id: station.id,
        serial_number: station.serial_number,
        model: station.model || "Unknown",
        manufacturer: station.manufacturer || "Unknown",
        online: station.is_available,
        station_status: station.status,
        location_status: station.status,
        available_for_charging: station.is_available,
        location_id: station.location_id,
        location_name: location?.name || "",
        location_address: location?.address || "",
        connectors: connectors.map((c: MappedConnector) => ({
          id: c.id,
          type: c.type,
          power_kw: c.power_kw ?? 0,
          available: c.available,
          status: c.status,
          error: c.error_code,
        })),
        total_connectors: connectors.length,
        available_connectors: connectors.filter(
          (c: MappedConnector) => c.available,
        ).length,
        occupied_connectors: connectors.filter(
          (c: MappedConnector) => !c.available,
        ).length,
        faulted_connectors: connectors.filter(
          (c: MappedConnector) => c.status === "faulted",
        ).length,
        tariff_rub_kwh: DEFAULT_RATE_PER_KWH,
        session_fee: 0,
        currency: "KGS",
        working_hours: "24/7",
      };
      return result;
    }
  }

  // ============== BALANCE & PAYMENTS ==============

  /**
   * Пополнить баланс через QR (Namba One)
   *
   * ВАЖНО: client_id автоматически извлекается backend из JWT токена (sub claim).
   * НЕ нужно отправлять client_id в body запроса.
   */
  async topupWithQR(
    amount: number,
    description?: string,
  ): Promise<TopupQRResponse> {
    // Backend автоматически извлечет client_id из JWT токена
    const requestBody = { amount, description };
    logger.debug("[rpApi] topupWithQR request:", requestBody);
    return this.apiRequest(
      "/balance/topup-qr",
      { method: "POST", body: requestBody },
      zTopupQRResponse,
    ) as Promise<TopupQRResponse>;
  }

  /**
   * @deprecated НЕ ИСПОЛЬЗУЕТСЯ. Приложение использует только QR топ-ап (topupWithQR).
   * Card data НЕ должны обрабатываться на клиенте (PCI DSS compliance).
   * Метод сохранен для обратной совместимости, но не вызывается нигде в коде.
   *
   * Пополнить баланс картой (Namba One)
   *
   * ВАЖНО: client_id автоматически извлекается backend из JWT токена (sub claim).
   */
  async topupWithCard(
    amount: number,
    cardDetails: {
      pan: string;
      name: string;
      cvv: string;
      year: string;
      month: string;
      email: string;
      phone?: string;
    },
    description?: string,
  ): Promise<TopupCardResponse> {
    // Backend автоматически извлечет client_id из JWT токена
    return this.apiRequest(
      "/balance/topup-card",
      {
        method: "POST",
        body: {
          amount,
          card_pan: cardDetails.pan,
          card_name: cardDetails.name,
          card_cvv: cardDetails.cvv,
          card_year: cardDetails.year,
          card_month: cardDetails.month,
          email: cardDetails.email,
          phone_number: cardDetails.phone,
          description,
        },
      },
      zTopupCardResponse,
    );
  }

  /**
   * Проверить статус платежа
   */
  async getPaymentStatus(invoiceId: string): Promise<PaymentStatus> {
    return this.apiRequest(
      `/payment/status/${invoiceId}`,
      { method: "GET" },
      zPaymentStatus,
    ) as Promise<PaymentStatus>;
  }

  // ============== HISTORY (через Backend API) ==============

  /**
   * Получить историю зарядок через backend API.
   * В cookie-режиме Supabase RLS не работает, поэтому используем backend.
   */
  async getChargingHistory(limit = 20) {
    const response = await fetchJson(
      `${API_ENDPOINTS.history.charging}?limit=${limit}`,
      { method: "GET" },
      z.object({
        success: z.boolean(),
        data: z.array(
          z.object({
            id: z.string(),
            station_id: z.string().nullable(),
            connector_id: z.number().nullable().optional(),
            status: z.string().nullable().optional(),
            energy_kwh: z.number(),
            amount: z.number(),
            started_at: z.string().nullable(),
            ended_at: z.string().nullable(),
            duration_minutes: z.number(),
            max_power_kw: z.number().nullable().optional(),
            station: z
              .object({
                model: z.string().nullable(),
                location: z
                  .object({
                    name: z.string().nullable(),
                    address: z.string().nullable(),
                  })
                  .nullable(),
              })
              .nullable(),
          }),
        ),
        total: z.number(),
        limit: z.number(),
        offset: z.number(),
      }),
    );

    if (!response.success) {
      throw new Error("Failed to fetch charging history");
    }

    // Преобразуем к формату совместимому с существующим кодом
    return response.data.map((item) => ({
      id: item.id,
      station_id: item.station_id,
      connector_id: item.connector_id,
      status: item.status,
      energy: item.energy_kwh,
      amount: item.amount,
      created_at: item.started_at,
      ended_at: item.ended_at,
      max_power_kw: item.max_power_kw ?? null,
      stations: item.station
        ? {
          model: item.station.model,
          locations: item.station.location,
        }
        : null,
    }));
  }

  /**
   * Получить историю транзакций (платежей) через backend API.
   * В cookie-режиме Supabase RLS не работает, поэтому используем backend.
   */
  async getTransactionHistory(limit = 20) {
    const response = await fetchJson(
      `${API_ENDPOINTS.history.transactions}?limit=${limit}`,
      { method: "GET" },
      z.object({
        success: z.boolean(),
        data: z.array(
          z.object({
            id: z.string(),
            requested_amount: z.number(),
            status: z.string().nullable(),
            payment_method: z.string().nullable(),
            created_at: z.string().nullable(),
            completed_at: z.string().nullable(),
            invoice_id: z.string().nullable().optional(),
            balance_before: z.number().nullable(),
            balance_after: z.number().nullable(),
            amount: z.number(),
            transaction_type: z.string(),
          }),
        ),
        total: z.number(),
        limit: z.number(),
        offset: z.number(),
      }),
    );

    if (!response.success) {
      throw new Error("Failed to fetch transaction history");
    }

    return response.data;
  }

  /**
   * Получить статистику зарядок через backend API.
   */
  async getChargingStats() {
    const response = await fetchJson(
      API_ENDPOINTS.history.stats,
      { method: "GET" },
      z.object({
        success: z.boolean(),
        stats: z.object({
          total_sessions: z.number(),
          total_energy_kwh: z.number(),
          total_amount: z.number(),
          average_session_minutes: z.number(),
        }),
      }),
    );

    if (!response.success) {
      throw new Error("Failed to fetch charging stats");
    }

    return response.stats;
  }

  // ============== REALTIME ==============

  /**
   * Подписаться на изменения баланса
   */
  subscribeToBalance(callback: (balance: number) => void) {
    const subscription = supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return null;

      return supabase
        .channel("balance-changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "clients",
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            callback(payload.new["balance"]);
          },
        )
        .subscribe();
    });

    return subscription;
  }

  /**
   * WebSocket для статусов локаций
   */
  async connectToLocationsWebSocket(): Promise<WebSocket> {
    const client_id = await this.getClientId();

    // В dev — всегда через proxy от текущего origin; в prod — VITE_WEBSOCKET_URL / VITE_WS_URL или VITE_API_URL (http->ws)
    const wsOriginEnv: string | undefined =
      import.meta.env["VITE_WEBSOCKET_URL"] || import.meta.env["VITE_WS_URL"];
    const wsBase = import.meta.env.PROD
      ? wsOriginEnv ||
      (API_ORIGIN
        ? API_ORIGIN.replace(/^http/i, "ws")
        : location.origin.replace(/^http/i, "ws"))
      : location.origin.replace(/^http/i, "ws");

    const ws = new WebSocket(
      `${wsBase}${API_VERSION}/ws/locations?client_id=${client_id}`,
    );

    return ws;
  }

  /**
   * Получить текущего пользователя
   */
  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("id", user.id)
      .single();

    return client;
  }

  /**
   * Обновить данные пользователя
   */
  async updateProfile(data: Record<string, string>): Promise<{ success: boolean }> {
    return this.apiRequest(
      "/account/profile",
      { method: "PUT", body: data },
      z.object({ success: z.boolean() }).passthrough(),
    );
  }

  async refreshUserData() {
    const user = await this.getCurrentUser();
    if (user) {
      // Trigger balance update или другая логика
      return user;
    }
    return null;
  }

  /**
   * Инициировать удаление аккаунта и связанных пользовательских данных
   * (операция необратима; платежные записи могут храниться по закону)
   *
   * В production используется backend endpoint /account/delete-request
   * который работает с cookie-based auth
   */
  async requestAccountDeletion(): Promise<{ success: true; message?: string }> {
    // В production/cookie-режиме используем backend API
    if (
      import.meta.env.PROD ||
      (import.meta.env["VITE_AUTH_MODE"] as string) === "cookie"
    ) {
      const result = await fetchJson(
        "/api/v1/account/delete-request",
        { method: "POST" },
        z.object({
          success: z.boolean(),
          message: z.string().optional(),
          error: z.string().optional(),
        }),
      );

      if (!result.success) {
        throw new Error(
          result.error || "Не удалось запросить удаление аккаунта",
        );
      }

      return {
        success: true,
        message: result.message || "Удаление аккаунта запрошено",
      };
    }

    // В dev режиме с Supabase auth — используем RPC напрямую
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Вызываем RPC (предпочтительный способ)
    const { error } = await supabase.rpc("request_account_deletion");
    if (error) {
      const errorObj = error as unknown as Record<string, unknown>;
      const msg = String(errorObj?.["message"] || "");
      const code = String(errorObj?.["code"] || "");
      const isMissingFn =
        code === "PGRST202" || /Could not find the function/i.test(msg);
      if (!isMissingFn) {
        throw error;
      }

      // Fallback: если RPC нет в схеме, отметим удаление напрямую в таблице
      const nowIso = new Date().toISOString();
      const { error: updError } = await supabase
        .from("clients")
        .update({ delete_requested_at: nowIso, status: "inactive" })
        .eq("id", user.id)
        .select("id")
        .single();

      if (updError) {
        const updErrorObj = updError as unknown as Record<string, unknown>;
        const msg2 = String(updErrorObj?.["message"] || "");
        const code2 = String(updErrorObj?.["code"] || "");
        const missingCol =
          code2 === "PGRST204" || /delete_requested_at/i.test(msg2);
        if (!missingCol) throw updError;

        // Колонки нет — минимальный фоллбек: меняем только статус
        const { error: updStatusOnly } = await supabase
          .from("clients")
          .update({ status: "inactive" })
          .eq("id", user.id)
          .select("id")
          .single();
        if (updStatusOnly) throw updStatusOnly;
        return {
          success: true,
          message: "Удаление аккаунта запрошено (status-only fallback)",
        };
      }
      return {
        success: true,
        message: "Удаление аккаунта запрошено (fallback)",
      };
    }
    return { success: true, message: "Удаление аккаунта запрошено" };
  }

  /**
   * Alias методы для совместимости
   */
  async createQRTopup(amount: number, description?: string) {
    return this.topupWithQR(amount, description);
  }

  async getPaymentStatusCheck(invoiceId: string) {
    return this.getPaymentStatus(invoiceId);
  }

  async startChargingCompat(
    params: StartChargingRequest,
  ): Promise<ChargingSession> {
    const response = await this.startCharging(
      params.station_id,
      params.connector_id,
      {
        energy_kwh: params.energy_kwh,
        amount_som: params.amount_som,
      },
    );
    return {
      ...response,
      transaction_id: response.session_id,
      ocpp_transaction_id: response.session_id,
    } as ChargingSession;
  }

  async stopChargingCompat(
    params: StopChargingParams,
  ): Promise<StopChargingResponse> {
    return this.stopCharging(params.session_id);
  }

  // ============== DEVICES (FCM PUSH NOTIFICATIONS) ==============

  // ============== WEB PUSH NOTIFICATIONS ==============

  /**
   * Get VAPID public key for push subscriptions
   * Backend v1.3.0: GET /api/v1/notifications/vapid-public-key
   * No authentication required (public endpoint)
   */
  async getVapidPublicKey(): Promise<{ public_key: string }> {
    try {
      logger.info("[RPAPI] Fetching VAPID public key");

      const response = await fetchJson(
        `${this.baseUrl}/notifications/vapid-public-key`,
        {
          method: "GET",
          // No auth headers - public endpoint
        },
        z.object({
          success: z.boolean(),
          data: z.object({
            public_key: z.string(),
          }),
        }),
      );

      logger.info("[RPAPI] VAPID public key fetched successfully");
      return response.data as { public_key: string };
    } catch (error) {
      logger.error("[RPAPI] Failed to fetch VAPID public key:", error);
      throw error;
    }
  }

  /**
   * Subscribe to Web Push notifications
   * Backend v1.3.0: POST /api/v1/notifications/subscribe
   * Requires JWT authentication (cookie or token mode) + CSRF token
   */
  async subscribeToPushNotifications(params: {
    subscription: PushSubscriptionJSON;
    user_type: "client" | "owner";
  }): Promise<{ success: boolean; message: string; subscription_id: string }> {
    try {
      logger.info("[RPAPI] Subscribing to push notifications", {
        user_type: params.user_type,
      });

      // Ensure CSRF token is available (cookie mode requires it)
      await ensureCsrfToken();

      // Cookie auth: credentials: "include" in fetchJson sends cookies automatically
      const response = await fetchJson(
        `${this.baseUrl}/notifications/subscribe`,
        {
          method: "POST",
          body: {
            subscription: params.subscription,
            user_type: params.user_type,
          },
        },
        z.object({
          success: z.boolean(),
          message: z.string(),
          subscription_id: z.string(),
        }),
      );

      logger.info("[RPAPI] Push subscription registered successfully", {
        subscription_id: response.subscription_id,
      });
      return response as {
        success: boolean;
        message: string;
        subscription_id: string;
      };
    } catch (error) {
      logger.error(
        "[RPAPI] Failed to subscribe to push notifications:",
        error,
      );
      throw error;
    }
  }

  /**
   * Unsubscribe from Web Push notifications
   * Backend v1.3.0: POST /api/v1/notifications/unsubscribe
   * Requires JWT authentication (cookie or token mode) + CSRF token
   */
  async unsubscribeFromPushNotifications(
    endpoint: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      logger.info("[RPAPI] Unsubscribing from push notifications");

      // Ensure CSRF token is available (cookie mode requires it)
      await ensureCsrfToken();

      // Cookie auth: credentials: "include" in fetchJson sends cookies automatically
      const response = await fetchJson(
        `${this.baseUrl}/notifications/unsubscribe`,
        {
          method: "POST",
          body: { endpoint },
        },
        z.object({
          success: z.boolean(),
          message: z.string(),
        }),
      );

      logger.info("[RPAPI] Push unsubscription successful");
      return response as { success: boolean; message: string };
    } catch (error) {
      logger.error(
        "[RPAPI] Failed to unsubscribe from push notifications:",
        error,
      );
      throw error;
    }
  }

  /**
   * Send test push notification
   * Backend v1.3.0: POST /api/v1/notifications/test
   * Requires JWT authentication (cookie or token mode) + CSRF token
   */
  async sendTestNotification(params?: {
    title?: string;
    body?: string;
  }): Promise<{ success: boolean; message: string; sent_count: number }> {
    try {
      logger.info("[RPAPI] Sending test notification");

      // Ensure CSRF token is available (cookie mode requires it)
      await ensureCsrfToken();

      // Cookie auth: credentials: "include" in fetchJson sends cookies automatically
      const response = await fetchJson(
        `${this.baseUrl}/notifications/test`,
        {
          method: "POST",
          body: params || {},
        },
        z.object({
          success: z.boolean(),
          message: z.string(),
          sent_to: z.number(),
        }),
      );

      logger.info("[RPAPI] Test notification sent", {
        sent_to: response.sent_to,
      });
      return {
        success: response.success,
        message: response.message,
        sent_count: response.sent_to,
      };
    } catch (error) {
      logger.error("[RPAPI] Failed to send test notification:", error);
      throw error;
    }
  }

  // ============== FCM PUSH NOTIFICATIONS (LEGACY) ==============

  /**
   * Регистрация FCM токена устройства для push уведомлений
   *
   * @param fcmToken - FCM токен от Firebase
   * @param platform - Платформа устройства
   * @param appVersion - Версия приложения
   * @returns Успешность регистрации
   */
  async registerDevice(
    fcmToken: string,
    platform: "android" | "ios" | "web",
    appVersion: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.apiRequest<{
        success: boolean;
        message?: string;
      }>(
        "/devices/register",
        {
          method: "POST",
          body: {
            fcm_token: fcmToken,
            platform,
            app_version: appVersion,
          },
        },
        z.object({
          success: z.boolean(),
          message: z.string().optional(),
        }),
      );

      logger.info("[RPAPI] FCM token registered successfully");
      return response;
    } catch (error) {
      // Проверяем если это 404 (endpoint не реализован на бэкенде)
      const is404 = error instanceof Error && error.message.includes("404");
      if (is404) {
        logger.warn(
          "[RPAPI] FCM endpoints not implemented yet (404) - feature planned for v1.2.0",
        );
      } else {
        logger.error(
          "[RPAPI] Failed to register FCM token:",
          error as Error,
        );
      }
      // Не бросаем ошибку, чтобы не блокировать работу приложения
      return { success: false, message: "Failed to register device" };
    }
  }

  /**
   * Удаление FCM токена устройства (при выходе из аккаунта)
   *
   * @param fcmToken - FCM токен для удаления
   * @returns Успешность удаления
   */
  async unregisterDevice(fcmToken: string): Promise<{ success: boolean }> {
    try {
      const response = await this.apiRequest<{ success: boolean }>(
        "/devices/unregister",
        {
          method: "POST",
          body: { fcm_token: fcmToken },
        },
        z.object({ success: z.boolean() }),
      );

      logger.info("[RPAPI] FCM token unregistered successfully");
      return response;
    } catch (error) {
      // Проверяем если это 404 (endpoint не реализован на бэкенде)
      const is404 = error instanceof Error && error.message.includes("404");
      if (is404) {
        logger.warn(
          "[RPAPI] FCM endpoints not implemented yet (404) - feature planned for v1.2.0",
        );
      } else {
        logger.error(
          "[RPAPI] Failed to unregister FCM token:",
          error as Error,
        );
      }
      return { success: false };
    }
  }
}

// Экспортируем singleton
export const rpApi = new RPApiService();

// ============== ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ДЛЯ СОВМЕСТИМОСТИ ==============

// Re-export for backward compatibility
export { ApiError, handleApiError } from "@/shared/errors/apiErrors";

// Типы уже экспортированы выше через export interface

// Алиасы для совместимости
export type Balance = {
  client_id: string;
  balance: number;
  currency: string;
  last_topup_at?: string;
  total_spent?: number;
};

export type QRTopupResponse = TopupQRResponse;
export type CreateQRTopupParams = TopupQRRequest;
export type StartChargingParams = StartChargingRequest;
export type StopChargingParams = { session_id: string };
export type ChargingSession = StartChargingResponse & {
  ocpp_transaction_id?: string;
  transaction_id?: string;
};

// Методы getCurrentUser и refreshUserData теперь в классе выше
