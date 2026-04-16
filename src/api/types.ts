/**
 * API Types - соответствуют документации API_INTEGRATION_ANSWERS.md
 *
 * ВАЖНО:
 * - Авторизация только через Supabase Auth
 * - Endpoints /auth/* НЕ СУЩЕСТВУЮТ на OCPP бэкенде
 * - client_id = Supabase User UUID
 */

// ============== CLIENT (из Supabase) ==============

export interface Client {
  id: string; // UUID из Supabase Auth
  name?: string; // Nullable
  phone?: string; // Nullable
  balance: number; // В СОМАХ (не копейках!)
  status: "active" | "inactive" | "blocked";
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

// ============== LOCATIONS & STATIONS ==============

/**
 * Location interface - соответствует Backend API v1.3.0
 *
 * Backend возвращает:
 * - coordinates: { latitude, longitude } (не flat)
 * - stations_summary: { total, available, occupied, offline, maintenance }
 * - connectors_summary: { total, available, occupied, faulted }
 * - stations: Station[] | null (nullable, не optional!)
 */
export interface Location {
  id: string;
  name: string;
  address: string;
  city: string | null;
  country: string | null;
  coordinates: {
    latitude: number | null;
    longitude: number | null;
  };
  status: string; // "available" | "partial" | "occupied" | "maintenance" | "offline"
  stations_summary: {
    total: number;
    available: number;
    occupied: number;
    offline: number;
    maintenance: number;
  };
  connectors_summary: {
    total: number;
    available: number;
    occupied: number;
    faulted: number;
  };
  stations: Station[] | null; // ← NULLABLE! null когда include_stations=false
  // Computed fields (добавляются на клиенте)
  distance?: number;
  // Legacy flat fields (для обратной совместимости со старыми компонентами)
  latitude?: number;
  longitude?: number;
  stations_count?: number;
  connectors_count?: number;
  available_connectors?: number;
}

/**
 * Station interface - соответствует Backend API v1.3.0
 *
 * Backend возвращает внутри Location:
 * - tariff: { price_per_kwh, session_fee, currency }
 * - connectors_summary: { available, occupied, faulted } (БЕЗ total!)
 * - status: string ("active", "offline", etc)
 */
export interface Station {
  id: string;
  serial_number: string;
  model: string;
  manufacturer: string;
  status: string; // "active" | "offline" | "maintenance" - используем string для гибкости
  power_capacity: number; // кВт
  connectors_count: number;
  tariff: {
    price_per_kwh: number; // В сомах за кВт·ч
    session_fee: number; // Фиксированная плата
    currency: string; // "KGS"
  };
  connectors_summary: {
    available: number;
    occupied: number;
    faulted: number;
    // ← НЕТ total! Backend не возвращает для Station
  };
  // Legacy fields (для обратной совместимости)
  location_id?: string;
  connector_types?: string[];
  price_per_kwh?: number; // Flat access к tariff.price_per_kwh
  session_fee?: number; // Flat access к tariff.session_fee
  currency?: string;
  firmware_version?: string;
  is_available?: boolean;
  last_heartbeat_at?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  locationAddress?: string;
  ocpp_status?: {
    is_online: boolean;
    last_heartbeat: string;
    connector_status: ConnectorStatus[];
  };
}

export interface ConnectorStatus {
  connector_id: number; // 1, 2, 3...
  status:
    | "Available"
    | "Preparing"
    | "Charging"
    | "SuspendedEVSE"
    | "SuspendedEV"
    | "Finishing"
    | "Reserved"
    | "Unavailable"
    | "Faulted";
  error_code?: string;
  info?: string;
}

// Response от /station/status/{station_id}
export interface StationStatusResponse {
  success: boolean;
  station_id: string;
  serial_number: string;
  model: string;
  manufacturer: string;
  online: boolean;
  station_status: string;
  location_status: string;
  available_for_charging: boolean;
  location_id: string;
  location_name: string;
  location_address: string;
  location_coordinates?: {
    lat: number | null;
    lng: number | null;
  };
  station_display_name?: string;
  connectors: {
    id: number;
    connector_number?: number;
    connector_type?: string;
    type: string;
    status: string;
    status_name?: string;
    current_progress?: number | null;
    available: boolean;
    max_power?: number;
    power_kw?: number;
    error?: string | null;
  }[];
  total_connectors: number;
  available_connectors: number;
  occupied_connectors: number;
  faulted_connectors: number;
  tariff_per_kwh?: number;
  tariff_rub_kwh: number;
  session_fee: number;
  currency: string;
  working_hours: string;
  message?: string | null;
}

// Response от /stations (мобильный формат — плоский список)
export interface MobileStationItem {
  id: string;
  location_id: string | null;
  max_power: number | null;
  tariff_per_kwh: number | null;
  location_name: string | null;
  location_address: string | null;
  location_coordinates: {
    lat: number | null;
    lng: number | null;
  };
  is_online: boolean;
  total_connectors: number;
  occupied_connectors: number;
  available_connectors: number;
  faulted_connectors: number;
}

export interface MobileStationsListResponse {
  success: boolean;
  data: MobileStationItem[];
}

// Response от /stations/{station_id} (мобильный формат — детали с коннекторами)
export interface MobileConnectorItem {
  connector_number: number;
  connector_type: string | null;
  max_power: number | null;
  status_name: string;
  status: string;
  current_progress: number | null;
}

export interface MobileStationDetail extends MobileStationItem {
  station_display_name: string | null;
  connectors: MobileConnectorItem[];
}

export interface MobileStationDetailResponse {
  success: boolean;
  data: MobileStationDetail | null;
}

// ============== CHARGING ==============

/**
 * @deprecated client_id больше НЕ нужен - backend автоматически извлекает из JWT токена.
 */
export interface StartChargingRequest {
  /** @deprecated НЕ используется - backend извлекает из JWT */
  client_id?: string;
  station_id: string; // ОБЯЗАТЕЛЬНО
  connector_id: number; // ОБЯЗАТЕЛЬНО (1, 2, 3...)
  energy_kwh?: number; // Лимит по энергии в кВт·ч
  amount_som?: number; // Лимит по сумме в сомах
}

export interface StartChargingResponse {
  success: boolean;
  message?: string | null;
  error?: string | null;
  session_id?: string;
  connector_id?: number;
  reserved_amount?: number; // Зарезервировано на балансе
  limit_type?: "energy" | "amount" | "none";
  limit_value?: number;
  rate_per_kwh?: number; // Актуальный тариф
  session_fee?: number;
  required_amount?: number; // При недостатке средств
  current_balance?: number;
}

/**
 * Статус сессии зарядки
 *
 * Backend возвращает дублирующие поля для совместимости:
 * - energy_kwh = energy_consumed
 * - current_amount = current_cost
 * - progress_percent = limit_percentage
 * - session_id = id
 */
export interface ChargingStatus {
  success: boolean;
  session?: {
    id: string;
    session_id?: string; // дублирует id
    // КРИТИЧНО: status как string для гибкости (backend может возвращать разные статусы)
    status: string; // "started", "stopped", "error", "preparing" и другие
    station_id: string;
    connector_id?: number | null; // может быть null или отсутствовать при preparing
    start_time: string | null; // ISO datetime
    stop_time?: string | null;

    // Энергетические данные
    energy_consumed: number; // кВт·ч
    energy_kwh?: number; // дублирует energy_consumed
    current_cost: number; // Текущая стоимость в сомах
    current_amount?: number; // дублирует current_cost
    power_kw?: number; // Текущая мощность

    // Длительность
    charging_duration_minutes?: number;
    duration_seconds?: number;

    // Резерв и тарифы
    reserved_amount?: number; // Зарезервировано
    rate_per_kwh?: number;
    session_fee?: number;

    // Лимиты и прогресс
    limit_type?: "energy" | "amount" | "none" | null;
    limit_value?: number | null;
    limit_reached?: boolean;
    limit_percentage?: number; // 0-100%
    progress_percent?: number; // дублирует limit_percentage

    // OCPP данные
    ocpp_transaction_id?: number | null;
    meter_start?: number | null;
    meter_current?: number | null;

    // Данные EV
    ev_battery_soc?: number | null;

    // Статус станции
    station_online?: boolean;
  };
}

/**
 * Ответ на остановку зарядки
 *
 * Backend возвращает:
 * - actual_cost (не final_cost)
 * - refund_amount (не refunded_amount)
 */
export interface StopChargingResponse {
  success: boolean;
  message?: string | null;
  error?: string | null;
  session_id?: string;
  station_id?: string;
  client_id?: string;
  start_time?: string | null;
  stop_time?: string | null;
  energy_consumed?: number; // Потреблено кВт·ч
  rate_per_kwh?: number; // Тариф
  reserved_amount?: number; // Изначально зарезервировано
  actual_cost?: number; // Фактическая стоимость
  refund_amount?: number; // Возвращено на баланс
  new_balance?: number; // Новый баланс после операции
  station_online?: boolean;
}

// ============== BALANCE & PAYMENTS ==============

export interface BalanceResponse {
  balance: number;
  currency?: string;
}

/**
 * @deprecated client_id НЕ нужен - backend автоматически извлекает из JWT токена.
 */
export interface TopupQRRequest {
  amount: number; // В сомах (10-100000)
  description?: string;
}

export interface TopupQRResponse {
  success: boolean;
  invoice_id?: string;
  order_id?: string;
  qr_code?: string; // Данные для генерации QR (не картинка!)
  qr_code_url?: string; // URL картинки QR-кода
  app_link?: string; // Deeplink для Namba One приложения
  amount?: number;
  client_id?: string;
  current_balance?: number;
  qr_expires_at?: string; // ISO datetime (через 5 минут)
  invoice_expires_at?: string; // ISO datetime (через 10 минут)
  qr_lifetime_seconds?: number;
  invoice_lifetime_seconds?: number;
  error?: string | null;
}

/**
 * @deprecated Метод НЕ используется (PCI DSS compliance).
 * client_id НЕ нужен - backend автоматически извлекает из JWT токена.
 */
export interface TopupCardRequest {
  amount: number;
  card_pan: string; // "4169585512341234"
  card_name: string; // "IVAN IVANOV"
  card_cvv: string; // "123"
  card_year: string; // "25" (YY)
  card_month: string; // "12" (MM)
  email: string; // Для чека
  phone_number?: string;
  description?: string;
}

export interface TopupCardResponse {
  success: boolean;
  auth_key?: string; // Ключ для 3DS
  acs_url?: string; // URL для 3DS аутентификации
  md?: string; // Merchant data
  pa_req?: string; // 3DS request
  term_url?: string; // Return URL после 3DS
  client_id?: string;
  current_balance?: number;
  error?: string | null;
}

export interface PaymentStatus {
  success: boolean;
  status?: 0 | 1 | 2 | 3 | 4; // Namba One коды
  status_text?: string; // Русский текст для UI, не enum
  amount?: number;
  paid_amount?: number | null; // Может быть null
  invoice_id?: string;
  can_proceed?: boolean; // Можно ли использовать для зарядки
  can_start_charging?: boolean; // Платеж успешен
  qr_expired?: boolean;
  invoice_expired?: boolean;
  qr_expires_at?: string | null; // ISO datetime
  invoice_expires_at?: string | null; // ISO datetime
  last_status_check_at?: string | null; // Время последней проверки
  needs_callback_check?: boolean; // Требуется проверка через callback
  error?: string | null;
}

// ============== WEBSOCKET ==============

export interface WebSocketMessage {
  type: string;
  data: unknown;
}

export interface WebSocketLocationUpdate {
  type: "location_status_update";
  location_id: string;
  status: "available" | "occupied" | "offline" | "maintenance" | "partial";
  stations_summary?: {
    total: number;
    available: number;
    occupied: number;
  };
  timestamp: string;
}

export interface WebSocketStationUpdate {
  type: "station_status_update";
  station_id: string;
  status: string;
  connectors: {
    id: number;
    status: string;
    available: boolean;
  }[];
  timestamp: string;
}

export interface LocationUpdate {
  type: "status_update";
  location_id: string;
  status: "available" | "occupied" | "offline" | "maintenance" | "partial";
  available_connectors: number;
  timestamp: string;
}

// ============== ERRORS ==============

export interface APIError {
  success: false;
  error: string;
  message?: string; // Для совместимости с axios interceptors
  code?: string; // Код ошибки
  status?: number; // HTTP статус
  detail?: unknown;
  required_amount?: number;
  current_balance?: number;
}

// ============== LEGACY (для совместимости, удалить после миграции) ==============

// Connector для старых компонентов
export interface Connector {
  id: string;
  type: string;
  power: number;
  status: "available" | "occupied" | "offline";
  price_per_kwh: number;
}
