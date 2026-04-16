/**
 * Geolocation abstraction - PWA version
 * Использует Web Geolocation API
 */

import { logger } from '@/shared/utils/logger';

/**
 * Интерфейс для координат
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

/**
 * Интерфейс для результата геолокации
 */
export interface GeolocationResult {
  success: boolean;
  coords?: Coordinates;
  error?: string;
}

/**
 * Опции для получения геолокации
 */
export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Сервис для работы с геолокацией (PWA Web API)
 */
class GeolocationService {
  /**
   * Запрашивает разрешения на использование геолокации
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // Для веба разрешения запрашиваются автоматически при вызове getCurrentPosition
      // Проверяем через Permissions API если доступен
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state === 'granted' || result.state === 'prompt';
      }
      return true;
    } catch (error) {
      logger.error('Geolocation: failed to request permissions', error);
      return false;
    }
  }

  /**
   * Проверяет наличие разрешений на геолокацию
   */
  async checkPermissions(): Promise<boolean> {
    try {
      // Проверяем через Permissions API
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state === 'granted';
      }
      return true; // Предполагаем, что разрешения будут запрошены
    } catch (error) {
      logger.error('Geolocation: failed to check permissions', error);
      return false;
    }
  }

  /**
   * Получает текущую позицию пользователя
   */
  async getCurrentPosition(options?: GeolocationOptions): Promise<GeolocationResult> {
    try {
      // Сначала проверяем разрешения
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          return {
            success: false,
            error: 'Геолокация не разрешена пользователем'
          };
        }
      }

      const defaultOptions: GeolocationOptions = {
        enableHighAccuracy: false, // false = меньше ошибок kCLErrorLocationUnknown на iOS
        timeout: 15000,
        maximumAge: 300000, // 5 минут — принимаем кешированную позицию
        ...options
      };

      // Используем Web Geolocation API
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              success: true,
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed
              }
            });
          },
          (error) => {
            logger.warn('Geolocation: position unavailable', { code: error.code });
            resolve({
              success: false,
              error: this.getErrorMessage(error)
            });
          },
          defaultOptions
        );
      });
    } catch (error) {
      logger.error('Geolocation: failed to get position', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Не удалось определить местоположение'
      };
    }
  }

  /**
   * Начинает отслеживание позиции пользователя
   */
  async watchPosition(
    callback: (position: GeolocationResult) => void,
    options?: GeolocationOptions
  ): Promise<number> {
    const defaultOptions: GeolocationOptions = {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 300000,
      ...options
    };

    // Для веба используем Web Geolocation API
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        callback({
          success: true,
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed
          }
        });
      },
      (error) => {
        callback({
          success: false,
          error: this.getErrorMessage(error)
        });
      },
      defaultOptions
    );

    return watchId;
  }

  /**
   * Останавливает отслеживание позиции
   */
  async clearWatch(watchId: number): Promise<void> {
    navigator.geolocation.clearWatch(watchId);
  }

  /**
   * Преобразует ошибку геолокации в понятное сообщение
   */
  private getErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Доступ к геолокации запрещен';
      case error.POSITION_UNAVAILABLE:
        return 'Информация о местоположении недоступна';
      case error.TIMEOUT:
        return 'Превышено время ожидания запроса геолокации';
      default:
        return 'Не удалось определить местоположение';
    }
  }
}

// Экспортируем singleton instance
export const geolocationService = new GeolocationService();
