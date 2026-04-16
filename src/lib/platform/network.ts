/**
 * Network abstraction - PWA version
 * Использует Navigator.onLine и Network Information API
 */

import { logger } from "@/shared/utils/logger";

// Network Information API types
interface NetworkInformation extends EventTarget {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  type?: string;
  addEventListener(type: "change", listener: () => void): void;
}

/**
 * Тип сетевого соединения
 */
export type ConnectionType = "wifi" | "cellular" | "none" | "unknown";

/**
 * Интерфейс для состояния сети
 */
export interface NetworkStatus {
  connected: boolean;
  connectionType: ConnectionType;
}

/**
 * Callback для изменения состояния сети
 */
export type NetworkStatusChangeCallback = (status: NetworkStatus) => void;

/**
 * Сервис для работы с сетью (PWA Web API)
 */
class NetworkService {
  private listeners: Set<NetworkStatusChangeCallback> = new Set();
  private currentStatus: NetworkStatus = {
    connected: true,
    connectionType: "unknown",
  };

  constructor() {
    this.initializeListeners();
  }

  /**
   * Инициализирует слушатели изменений сети
   */
  private initializeListeners(): void {
    // Используем Web API
    if ("onLine" in navigator) {
      // Обновляем начальное состояние
      this.currentStatus = {
        connected: navigator.onLine,
        connectionType: this.detectWebConnectionType(),
      };

      // Слушаем изменения состояния
      window.addEventListener("online", () => {
        this.updateStatus({
          connected: true,
          connectionType: this.detectWebConnectionType(),
        });
      });

      window.addEventListener("offline", () => {
        this.updateStatus({
          connected: false,
          connectionType: "none",
        });
      });

      // Проверяем изменения типа соединения (для современных браузеров)
      if ("connection" in navigator) {
        const connection = (
          navigator as Navigator & { connection?: NetworkInformation }
        ).connection;
        if (connection) {
          connection.addEventListener("change", () => {
            this.updateStatus({
              connected: navigator.onLine,
              connectionType: this.detectWebConnectionType(),
            });
          });
        }
      }
    }
  }

  /**
   * Получает текущее состояние сети
   */
  async getStatus(): Promise<NetworkStatus> {
    return {
      connected: navigator.onLine,
      connectionType: this.detectWebConnectionType(),
    };
  }

  /**
   * Проверяет наличие соединения
   */
  async isConnected(): Promise<boolean> {
    return navigator.onLine;
  }

  /**
   * Подписывается на изменения состояния сети
   */
  addListener(callback: NetworkStatusChangeCallback): () => void {
    this.listeners.add(callback);

    // Сразу вызываем callback с текущим состоянием
    callback(this.currentStatus);

    // Возвращаем функцию отписки
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Удаляет слушатель изменений сети
   */
  removeListener(callback: NetworkStatusChangeCallback): void {
    this.listeners.delete(callback);
  }

  /**
   * Удаляет все слушатели
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Обновляет состояние и уведомляет слушателей
   */
  private updateStatus(status: NetworkStatus): void {
    const previousStatus = this.currentStatus;
    this.currentStatus = status;

    // Логируем изменение состояния
    if (previousStatus.connected !== status.connected) {
      logger.info(
        `Network: ${status.connected ? "connected" : "disconnected"}`,
      );
    }
    if (previousStatus.connectionType !== status.connectionType) {
      logger.info(
        `Network: connection type changed to ${status.connectionType}`,
      );
    }

    // Уведомляем всех слушателей
    this.listeners.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        logger.error("Network: error in status change callback", error);
      }
    });
  }

  /**
   * Определяет тип соединения для веба
   */
  private detectWebConnectionType(): ConnectionType {
    if (!navigator.onLine) {
      return "none";
    }

    // Пробуем использовать Network Information API
    if ("connection" in navigator) {
      const connection = (
        navigator as Navigator & { connection?: NetworkInformation }
      ).connection;
      if (connection) {
        // Проверяем effectiveType для современных браузеров
        if (connection.effectiveType) {
          const effectiveType = connection.effectiveType;
          if (
            effectiveType === "slow-2g" ||
            effectiveType === "2g" ||
            effectiveType === "3g" ||
            effectiveType === "4g"
          ) {
            return "cellular";
          }
        }

        // Проверяем type для старых браузеров
        if (connection.type) {
          switch (connection.type) {
            case "wifi":
            case "wimax":
              return "wifi";
            case "cellular":
            case "2g":
            case "3g":
            case "4g":
            case "5g":
              return "cellular";
            case "none":
              return "none";
          }
        }
      }
    }

    // Если не можем определить тип, но онлайн - возвращаем unknown
    return "unknown";
  }
}

// Экспортируем singleton instance
export const networkService = new NetworkService();
