import { logger } from "@/shared/utils/logger";
import { fetchJson, z } from "@/api/unifiedClient";
import { API_ENDPOINTS } from "@/api/endpoints";

/**
 * FavoriteService - управление избранными станциями через backend API.
 *
 * В cookie-режиме (production) прямые вызовы Supabase не работают,
 * т.к. RLS политики требуют auth.uid(), а сессия Supabase отсутствует.
 * Поэтому все операции выполняются через backend API.
 */
export class FavoriteService {
  private static instance: FavoriteService;

  private constructor() {}

  static getInstance(): FavoriteService {
    if (!FavoriteService.instance) {
      FavoriteService.instance = new FavoriteService();
    }
    return FavoriteService.instance;
  }

  /**
   * Получить список избранных станций пользователя (location_id)
   * @param _userId - не используется, backend определяет user по cookie
   */
  async getFavorites(_userId?: string): Promise<string[]> {
    try {
      const response = await fetchJson(
        API_ENDPOINTS.favorites.list,
        { method: "GET" },
        z.object({
          success: z.boolean(),
          favorites: z.array(z.string()),
        }),
      );

      if (response.success) {
        return response.favorites;
      }

      return [];
    } catch (error) {
      logger.error("[FavoriteService] Error fetching favorites", { error });
      return [];
    }
  }

  /**
   * Добавить станцию в избранное (location_id)
   * @param _userId - не используется, backend определяет user по cookie
   * @param locationId - ID локации для добавления
   */
  async addToFavorites(_userId: string, locationId: string): Promise<boolean> {
    try {
      const response = await fetchJson(
        API_ENDPOINTS.favorites.add,
        {
          method: "POST",
          body: { location_id: locationId },
        },
        z.object({
          success: z.boolean(),
          already_exists: z.boolean().optional(),
        }),
      );

      if (response.success) {
        logger.info("[FavoriteService] Added to favorites", { locationId });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("[FavoriteService] Error adding to favorites", {
        locationId,
        error,
      });
      return false;
    }
  }

  /**
   * Удалить локацию из избранного
   * @param _userId - не используется, backend определяет user по cookie
   * @param locationId - ID локации для удаления
   */
  async removeFromFavorites(
    _userId: string,
    locationId: string,
  ): Promise<boolean> {
    try {
      const response = await fetchJson(
        API_ENDPOINTS.favorites.remove(locationId),
        { method: "DELETE" },
        z.object({
          success: z.boolean(),
        }),
      );

      if (response.success) {
        logger.info("[FavoriteService] Removed from favorites", { locationId });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("[FavoriteService] Error removing from favorites", {
        locationId,
        error,
      });
      return false;
    }
  }

  /**
   * Переключить статус избранного
   * @param _userId - не используется, backend определяет user по cookie
   * @param locationId - ID станции
   */
  async toggleFavorite(_userId: string, locationId: string): Promise<boolean> {
    try {
      const response = await fetchJson(
        API_ENDPOINTS.favorites.toggle(locationId),
        { method: "POST" },
        z.object({
          success: z.boolean(),
          is_favorite: z.boolean(),
          action: z.enum(["added", "removed"]),
        }),
      );

      if (response.success) {
        logger.info("[FavoriteService] Toggled favorite", {
          locationId,
          action: response.action,
          is_favorite: response.is_favorite,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("[FavoriteService] Error toggling favorite", {
        locationId,
        error,
      });
      return false;
    }
  }

  /**
   * Проверить, является ли станция избранной
   * @param _userId - не используется, backend определяет user по cookie
   * @param locationId - ID станции
   */
  async isFavorite(_userId: string, locationId: string): Promise<boolean> {
    try {
      const response = await fetchJson(
        API_ENDPOINTS.favorites.check(locationId),
        { method: "GET" },
        z.object({
          success: z.boolean(),
          is_favorite: z.boolean(),
        }),
      );

      return response.success && response.is_favorite;
    } catch (error) {
      logger.error("[FavoriteService] Error checking favorite status", {
        locationId,
        error,
      });
      return false;
    }
  }
}

export const favoriteService = FavoriteService.getInstance();
