/**
 * Push Notifications Hook
 *
 * Manages Web Push notification subscriptions using the Push API.
 *
 * Features:
 * - Request notification permission
 * - Subscribe/unsubscribe to push notifications
 * - Send subscription to backend
 * - Track subscription state
 * - VAPID authentication
 *
 * Usage:
 * ```tsx
 * const { permission, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
 *
 * // Request permission and subscribe
 * await subscribe();
 *
 * // Unsubscribe
 * await unsubscribe();
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import { logger } from "@/shared/utils/logger";
import { rpApi } from "@/services/rpApi";
import { useUnifiedAuthStore as useAuthStore } from "@/features/auth/unifiedAuthStore";
import { useOwnerAuthStore } from "@/features/owner/stores/ownerAuthStore";

export type NotificationPermission = "default" | "granted" | "denied";

interface UsePushNotificationsReturn {
  /**
   * Current notification permission state
   */
  permission: NotificationPermission;

  /**
   * Is user subscribed to push notifications?
   */
  isSubscribed: boolean;

  /**
   * Is subscription check loading?
   */
  isLoading: boolean;

  /**
   * Error message if any
   */
  error: string | null;

  /**
   * Subscribe to push notifications
   * Requests permission if needed
   */
  subscribe: () => Promise<boolean>;

  /**
   * Unsubscribe from push notifications
   */
  unsubscribe: () => Promise<boolean>;

  /**
   * Check if push notifications are supported
   */
  isSupported: boolean;
}

/**
 * Convert base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}

/**
 * Push Notifications Hook
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const { user: clientUser } = useAuthStore();
  const { user: ownerUser } = useOwnerAuthStore();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previousUserType, setPreviousUserType] = useState<
    "client" | "owner" | null
  >(null);

  // Check if push notifications are supported
  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  /**
   * Check current subscription status
   */
  const checkSubscription = useCallback(async () => {
    if (!isSupported) {
      setIsLoading(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      setIsSubscribed(!!subscription);
      setPermission(Notification.permission);

      if (subscription) {
        logger.debug(
          "[usePushNotifications] Active subscription found:",
          subscription.endpoint,
        );
      }
    } catch (err) {
      logger.error("[usePushNotifications] Failed to check subscription:", err);
      setError("Не удалось проверить статус подписки");
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Check subscription on mount
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  /**
   * Subscribe to push notifications
   * Backend v1.3.0: Uses /api/v1/notifications endpoints
   *
   * ВАЖНО: Backend требует явной передачи user_type ('client' или 'owner')
   * См. docs/BACKEND_PUSH_NOTIFICATIONS_SPEC.md раздел "User Type Detection"
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Push уведомления не поддерживаются в этом браузере");
      return false;
    }

    // Determine user type based on auth stores
    // Owner имеет приоритет если залогинен Owner Dashboard
    let userType: "client" | "owner";

    if (ownerUser) {
      userType = "owner";
      logger.info("[usePushNotifications] Subscribing as OWNER");
    } else if (clientUser) {
      userType = "client";
      logger.info("[usePushNotifications] Subscribing as CLIENT");
    } else {
      setError("Необходимо войти в систему");
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Request notification permission
      if (Notification.permission === "default") {
        logger.info(
          "[usePushNotifications] Requesting notification permission",
        );
        const permissionResult = await Notification.requestPermission();
        setPermission(permissionResult);

        if (permissionResult !== "granted") {
          setError("Разрешение на уведомления отклонено");
          return false;
        }
      } else if (Notification.permission === "denied") {
        setError(
          "Разрешение на уведомления отклонено. Включите в настройках браузера.",
        );
        return false;
      }

      // Get Service Worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from backend (v1.3.0)
      logger.info(
        "[usePushNotifications] Fetching VAPID public key from backend",
      );
      const { public_key: vapidPublicKey } =
        await rpApi.getVapidPublicKey();

      if (!vapidPublicKey) {
        throw new Error("VAPID public key not available from backend");
      }

      // Subscribe to push manager
      logger.info("[usePushNotifications] Subscribing to push notifications");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      logger.info(
        "[usePushNotifications] Push subscription created:",
        subscription.endpoint,
      );

      // Send subscription to backend (v1.3.0 API)
      // Backend НЕ определяет user_type автоматически - мы ОБЯЗАНЫ передать его явно
      logger.info(
        "[usePushNotifications] Sending subscription to backend with user_type:",
        userType,
      );
      const result = await rpApi.subscribeToPushNotifications({
        subscription: subscription.toJSON(),
        user_type: userType, // ✅ КРИТИЧНО: явно передаем правильный user_type
      });

      logger.info(
        "[usePushNotifications] Successfully subscribed to push notifications",
        {
          subscription_id: result.subscription_id,
          user_type: userType,
        },
      );

      setIsSubscribed(true);
      setPreviousUserType(userType);

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Не удалось подписаться на уведомления";
      logger.error("[usePushNotifications] Subscribe error:", err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, clientUser, ownerUser]);

  /**
   * Unsubscribe from push notifications
   * Backend v1.3.0: Uses /api/v1/notifications/unsubscribe with endpoint
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Push уведомления не поддерживаются");
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get current subscription
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        logger.warn("[usePushNotifications] No active subscription found");
        setIsSubscribed(false);
        setPreviousUserType(null);
        return true;
      }

      const endpoint = subscription.endpoint;

      // Unsubscribe from push manager
      logger.info(
        "[usePushNotifications] Unsubscribing from push notifications",
      );
      const success = await subscription.unsubscribe();

      if (success) {
        // Notify backend (v1.3.0 API - requires endpoint instead of user_id)
        logger.info("[usePushNotifications] Sending unsubscribe to backend");
        await rpApi.unsubscribeFromPushNotifications(endpoint);

        setIsSubscribed(false);
        setPreviousUserType(null);
        logger.info(
          "[usePushNotifications] Successfully unsubscribed from push notifications",
        );

        return true;
      } else {
        throw new Error("Failed to unsubscribe");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Не удалось отписаться от уведомлений";
      logger.error("[usePushNotifications] Unsubscribe error:", err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  /**
   * Auto-resubscribe when user type changes
   *
   * Scenarios:
   * - User logs into Owner Dashboard while already logged in as client
   * - User logs out of Owner Dashboard and continues as client
   *
   * Backend UPSERT logic ensures old subscription is updated with new user_type
   */
  useEffect(() => {
    // Don't run on initial mount
    if (previousUserType === null) {
      return;
    }

    // Determine current user type
    const currentUserType: "client" | "owner" | null = ownerUser
      ? "owner"
      : clientUser
        ? "client"
        : null;

    // Check if user type changed
    if (
      currentUserType &&
      currentUserType !== previousUserType &&
      isSubscribed
    ) {
      logger.info("[usePushNotifications] User type changed:", {
        from: previousUserType,
        to: currentUserType,
      });
      logger.info(
        "[usePushNotifications] Auto-resubscribing with new user_type",
      );

      // Resubscribe with new user_type (backend UPSERT will update existing subscription)
      subscribe().then((success) => {
        if (success) {
          logger.info("[usePushNotifications] Auto-resubscription successful");
        } else {
          logger.error("[usePushNotifications] Auto-resubscription failed");
        }
      });
    }
  }, [ownerUser, clientUser, previousUserType, isSubscribed, subscribe]);

  return {
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    isSupported,
  };
}
