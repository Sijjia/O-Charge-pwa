/**
 * WebSocket Hook with Auto-Reconnect and Heartbeat
 *
 * Based on BACKEND_API_REFERENCE.md:
 * - Endpoint: wss://ocpp.charge.redpay.kg/api/v1/locations/ws/locations
 * - No auth required (public access)
 * - Rate limiting: 20 connections/IP, 10/client_id, 10 msg/sec
 * - Ping interval: 30 seconds recommended
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { logger } from "@/shared/utils/logger";
import {
  WebSocketConfig,
  WebSocketOutgoingMessage,
  WebSocketIncomingMessage,
  WebSocketReadyState,
} from "@/shared/types/websocket";

interface UseWebSocketReturn {
  /**
   * Latest message received from server
   */
  lastMessage: WebSocketOutgoingMessage | null;

  /**
   * Send message to server
   */
  sendMessage: (message: WebSocketIncomingMessage) => void;

  /**
   * Current WebSocket ready state
   */
  readyState: WebSocketReadyState;

  /**
   * Is WebSocket connected?
   */
  isConnected: boolean;

  /**
   * Manually reconnect
   */
  reconnect: () => void;

  /**
   * Close WebSocket connection
   */
  close: () => void;
}

const DEFAULT_CONFIG: Partial<WebSocketConfig> = {
  reconnect: true,
  reconnectInterval: 1000, // Start with 1s
  maxReconnectInterval: 30000, // Max 30s
  reconnectDecay: 1.5, // Exponential backoff: 1s → 1.5s → 2.25s → 3.375s → ...
  pingInterval: 30000, // 30 seconds (as recommended)
};

/**
 * WebSocket Hook with auto-reconnect, exponential backoff, and heartbeat
 *
 * @param url WebSocket URL
 * @param options WebSocket configuration
 * @param onMessage Callback when message received (optional, use lastMessage instead)
 * @returns WebSocket state and controls
 *
 * @example
 * ```tsx
 * const { lastMessage, sendMessage, isConnected } = useWebSocket(
 *   'wss://ocpp.charge.redpay.kg/api/v1/locations/ws/locations',
 *   { clientId: userId }
 * );
 *
 * useEffect(() => {
 *   if (isConnected) {
 *     sendMessage({ action: 'subscribe', channel: 'all' });
 *   }
 * }, [isConnected]);
 *
 * useEffect(() => {
 *   if (lastMessage?.type === 'location_status_update') {
 *     console.log('Location updated:', lastMessage.location_id);
 *   }
 * }, [lastMessage]);
 * ```
 */
export function useWebSocket(
  url: string,
  options: Partial<WebSocketConfig> = {},
  onMessage?: (message: WebSocketOutgoingMessage) => void,
): UseWebSocketReturn {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...options }), []);

  // State
  const [lastMessage, setLastMessage] =
    useState<WebSocketOutgoingMessage | null>(null);
  const [readyState, setReadyState] = useState<WebSocketReadyState>(
    WebSocketReadyState.CONNECTING,
  );

  // Refs (не вызывают re-render)
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentReconnectInterval = useRef<number>(
    config.reconnectInterval || 1000,
  );
  const reconnectAttemptsRef = useRef<number>(0);
  const shouldReconnectRef = useRef<boolean>(true);

  /**
   * Clear all timers
   */
  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  /**
   * Send ping (heartbeat) to keep connection alive
   */
  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        const pingMessage: WebSocketIncomingMessage = { action: "ping" };
        wsRef.current.send(JSON.stringify(pingMessage));
        logger.debug("[WebSocket] Ping sent");
      } catch (error) {
        logger.error("[WebSocket] Failed to send ping:", error);
      }
    }
  }, []);

  /**
   * Start ping interval
   */
  const startPingInterval = useCallback(() => {
    clearTimers();
    if (config.pingInterval && config.pingInterval > 0) {
      pingIntervalRef.current = setInterval(() => {
        sendPing();
      }, config.pingInterval);
      logger.debug(
        `[WebSocket] Ping interval started: ${config.pingInterval}ms`,
      );
    }
  }, [config.pingInterval, sendPing, clearTimers]);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    try {
      // Build URL with optional client_id
      let wsUrl = url;
      if (config.clientId) {
        const separator = url.includes("?") ? "&" : "?";
        wsUrl = `${url}${separator}client_id=${config.clientId}`;
      }

      logger.info(`[WebSocket] Connecting to ${wsUrl}...`);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        logger.info("[WebSocket] Connected successfully");
        setReadyState(WebSocketReadyState.OPEN);
        reconnectAttemptsRef.current = 0;
        currentReconnectInterval.current = config.reconnectInterval || 1000;
        startPingInterval();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketOutgoingMessage;
          logger.debug("[WebSocket] Message received:", message.type);

          setLastMessage(message);
          onMessage?.(message);

          // Handle specific message types
          if (message.type === "connection") {
            logger.info(
              `[WebSocket] Connection confirmed, client_id: ${message.client_id}`,
            );
          } else if (message.type === "error") {
            logger.error(`[WebSocket] Server error: ${message.message}`);
          } else if (message.type === "pong") {
            logger.debug("[WebSocket] Pong received");
          }
        } catch (error) {
          logger.error("[WebSocket] Failed to parse message:", error);
        }
      };

      ws.onerror = (error) => {
        logger.error("[WebSocket] Error:", error);
        setReadyState(WebSocketReadyState.CLOSED);
      };

      ws.onclose = (event) => {
        logger.warn(
          `[WebSocket] Disconnected (code: ${event.code}, reason: ${event.reason})`,
        );
        setReadyState(WebSocketReadyState.CLOSED);
        clearTimers();

        // Auto-reconnect if enabled
        if (config.reconnect && shouldReconnectRef.current) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(
            currentReconnectInterval.current,
            config.maxReconnectInterval || 30000,
          );

          logger.info(
            `[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})...`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);

          // Exponential backoff
          currentReconnectInterval.current *= config.reconnectDecay || 1.5;
        }
      };

      wsRef.current = ws;
    } catch (error) {
      logger.error("[WebSocket] Failed to connect:", error);
      setReadyState(WebSocketReadyState.CLOSED);
    }
  }, [url, config, onMessage, startPingInterval, clearTimers]);

  /**
   * Send message to server
   */
  const sendMessage = useCallback((message: WebSocketIncomingMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        logger.debug("[WebSocket] Message sent:", message);
      } catch (error) {
        logger.error("[WebSocket] Failed to send message:", error);
      }
    } else {
      logger.warn(
        `[WebSocket] Cannot send message, not connected (state: ${wsRef.current?.readyState})`
      );
    }
  }, []);

  /**
   * Manually reconnect
   */
  const reconnect = useCallback(() => {
    logger.info("[WebSocket] Manual reconnect requested");
    if (wsRef.current) {
      wsRef.current.close();
    }
    clearTimers();
    connect();
  }, [connect, clearTimers]);

  /**
   * Close WebSocket connection
   */
  const close = useCallback(() => {
    logger.info("[WebSocket] Closing connection...");
    shouldReconnectRef.current = false;
    clearTimers();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setReadyState(WebSocketReadyState.CLOSED);
  }, [clearTimers]);

  // Connect on mount
  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();

    // Cleanup on unmount
    return () => {
      shouldReconnectRef.current = false;
      clearTimers();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, clearTimers]);

  return {
    lastMessage,
    sendMessage,
    readyState,
    isConnected: readyState === WebSocketReadyState.OPEN,
    reconnect,
    close,
  };
}
