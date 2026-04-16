/**
 * Push notifications abstraction - PWA version
 * Заглушка: Web Push API может быть реализован позже
 */

import { logger } from '@/shared/utils/logger';

/**
 * Интерфейс для push-уведомления
 */
export interface PushNotification {
  id?: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  badge?: number;
}

/**
 * Callback для получения токена
 */
export type TokenCallback = (token: string) => void;

/**
 * Callback для получения уведомления
 */
export type NotificationCallback = (notification: PushNotification) => void;

/**
 * Сервис для работы с push-уведомлениями (PWA)
 * TODO: Реализовать Web Push API когда backend будет готов
 */
class PushNotificationService {
  private readonly isEnabled: boolean =
    (import.meta as unknown as { env?: Record<string, string> }).env?.[
      'VITE_ENABLE_PUSH'
    ] === 'true';
  private tokenCallbacks: Set<TokenCallback> = new Set();
  private notificationCallbacks: Set<NotificationCallback> = new Set();
  private currentToken: string | null = null;
  private isInitialized = false;

  /**
   * Инициализирует push-уведомления
   */
  async initialize(): Promise<boolean> {
    if (!this.isEnabled) {
      logger.info('Push: disabled via VITE_ENABLE_PUSH');
      this.isInitialized = true;
      return false;
    }
    if (this.isInitialized) {
      return true;
    }

    try {
      // Для PWA можно реализовать Web Push API
      // TODO: Реализовать Web Push API когда backend будет готов
      logger.info('Push: Web push notifications not yet implemented');
      this.isInitialized = true;
      return false;
    } catch (error) {
      logger.error('Push: initialization failed', error);
      return false;
    }
  }

  /**
   * Регистрирует callback для получения токена
   */
  onToken(callback: TokenCallback): void {
    this.tokenCallbacks.add(callback);
    // Если токен уже получен, вызываем callback сразу
    if (this.currentToken) {
      callback(this.currentToken);
    }
  }

  /**
   * Регистрирует callback для получения уведомлений
   */
  onNotification(callback: NotificationCallback): void {
    this.notificationCallbacks.add(callback);
  }

  /**
   * Удаляет все callbacks
   */
  removeAllListeners(): void {
    this.tokenCallbacks.clear();
    this.notificationCallbacks.clear();
  }

  /**
   * Отменяет регистрацию push-уведомлений
   * PWA: Заглушка для совместимости
   */
  async unregister(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      // TODO: Реализовать Web Push API unsubscribe когда backend будет готов
      logger.info('Push: unregister called (not yet implemented)');
      this.currentToken = null;
    } catch (error) {
      logger.error('Push: unregister failed', error);
    }
  }
}

// Экспортируем singleton instance
export const pushNotificationService = new PushNotificationService();
