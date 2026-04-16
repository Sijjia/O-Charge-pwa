/**
 * WebSocket Message Types
 * Based on BACKEND_API_REFERENCE.md
 */

// ============== OUTGOING MESSAGES (Server → Client) ==============

/**
 * Base message type
 */
export interface WebSocketMessage {
  type: string;
  timestamp?: string;
}

/**
 * 1. Connection Established
 */
export interface ConnectionMessage extends WebSocketMessage {
  type: "connection";
  status: "connected";
  client_id: string;
  message: string;
}

/**
 * 2. Location Status Update
 */
export interface LocationStatusUpdate extends WebSocketMessage {
  type: "location_status_update";
  location_id: string;
  location_name: string;
  status: "available" | "occupied" | "offline" | "maintenance" | "partial";
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
  timestamp: string;
}

/**
 * 3. Station Status Update
 */
export interface StationStatusUpdate extends WebSocketMessage {
  type: "station_status_update";
  station_id: string;
  serial_number: string;
  location_id: string;
  status: "available" | "offline" | "maintenance";
  available_connectors: number;
  occupied_connectors: number;
  timestamp: string;
}

/**
 * 4. Connector Status Update
 */
export interface ConnectorStatusUpdate extends WebSocketMessage {
  type: "connector_status_update";
  connector_id: number;
  station_id: string;
  location_id: string;
  status:
    | "available"
    | "occupied"
    | "preparing"
    | "charging"
    | "finishing"
    | "faulted";
  error_code: string | null;
  connector_type: string;
  power_kw: number;
  timestamp: string;
}

/**
 * 5. Charging Session Update
 */
export interface ChargingSessionUpdate extends WebSocketMessage {
  type: "charging_session_update";
  event: "started" | "stopped" | "error" | "meter_update";
  session_id: string;
  client_id: string;
  station_id: string;
  location_id: string;
  status: "active" | "completed" | "error";
  energy_kwh: number;
  amount: number;
  start_time: string;
  stop_time: string | null;
  timestamp: string;
}

/**
 * 6. Balance Update
 */
export interface BalanceUpdate extends WebSocketMessage {
  type: "balance_update";
  client_id: string;
  balance: number;
  currency: "KGS";
  timestamp: string;
}

/**
 * 7. Pong Response
 */
export interface PongMessage extends Omit<WebSocketMessage, 'timestamp'> {
  type: "pong";
  timestamp: number;
}

/**
 * 8. Error Message
 */
export interface ErrorMessage extends WebSocketMessage {
  type: "error";
  message: string;
}

/**
 * 9. Subscription Confirmation
 */
export interface SubscriptionMessage extends WebSocketMessage {
  type: "subscription";
  status: "subscribed" | "unsubscribed";
  channel: string;
}

/**
 * Union of all outgoing message types
 */
export type WebSocketOutgoingMessage =
  | ConnectionMessage
  | LocationStatusUpdate
  | StationStatusUpdate
  | ConnectorStatusUpdate
  | ChargingSessionUpdate
  | BalanceUpdate
  | PongMessage
  | ErrorMessage
  | SubscriptionMessage;

// ============== INCOMING MESSAGES (Client → Server) ==============

/**
 * Subscribe to channel
 */
export interface SubscribeAction {
  action: "subscribe";
  channel: "all" | `location:${string}` | `location_stations:${string}`;
}

/**
 * Unsubscribe from channel
 */
export interface UnsubscribeAction {
  action: "unsubscribe";
  channel: string;
}

/**
 * Ping (heartbeat)
 */
export interface PingAction {
  action: "ping";
}

/**
 * Union of all incoming message types
 */
export type WebSocketIncomingMessage =
  | SubscribeAction
  | UnsubscribeAction
  | PingAction;

// ============== WEBSOCKET CONFIG ==============

export interface WebSocketConfig {
  url: string;
  reconnect?: boolean;
  reconnectInterval?: number; // Initial interval in ms
  maxReconnectInterval?: number; // Max interval in ms
  reconnectDecay?: number; // Exponential backoff multiplier
  pingInterval?: number; // Ping interval in ms (default: 30000)
  clientId?: string; // Optional client_id for connection
}

export enum WebSocketReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}
