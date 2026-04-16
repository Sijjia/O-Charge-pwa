/**
 * Low Balance Notification Hook
 *
 * Monitors user balance and triggers notification when it falls below threshold.
 * Uses localStorage to prevent spam notifications.
 */

import { useEffect, useRef } from 'react';
import { useBalance } from './useBalance';
import { NotificationService } from '@/shared/utils/notifications';
import { logger } from '@/shared/utils/logger';

const LOW_BALANCE_THRESHOLD = 50; // сом
const NOTIFICATION_COOLDOWN = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Hook to monitor balance and show low balance notification
 */
export function useLowBalanceNotification() {
  const { data: balance } = useBalance();
  const lastNotificationRef = useRef<number>(0);

  useEffect(() => {
    if (typeof balance !== 'number') return;

    // Check if balance is low
    if (balance < LOW_BALANCE_THRESHOLD) {
      const now = Date.now();
      const lastNotificationTime =
        parseInt(localStorage.getItem('lastLowBalanceNotification') || '0', 10) || 0;

      // Check cooldown
      if (now - lastNotificationTime > NOTIFICATION_COOLDOWN) {
        // Show notification
        NotificationService.notifyLowBalance(balance)
          .then(() => {
            // Update last notification time
            localStorage.setItem('lastLowBalanceNotification', now.toString());
            lastNotificationRef.current = now;
            logger.info('[useLowBalanceNotification] Low balance notification shown');
          })
          .catch((error) => {
            logger.warn('[useLowBalanceNotification] Failed to show notification:', error);
          });
      } else {
        logger.debug(
          '[useLowBalanceNotification] Skipping notification due to cooldown',
          {
            balance,
            lastNotificationTime,
            cooldownRemaining: NOTIFICATION_COOLDOWN - (now - lastNotificationTime),
          }
        );
      }
    }
  }, [balance]);

  return {
    threshold: LOW_BALANCE_THRESHOLD,
    isLow: typeof balance === 'number' && balance < LOW_BALANCE_THRESHOLD,
  };
}
