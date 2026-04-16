/**
 * Push Notification Settings Component
 *
 * Allows users to enable/disable push notifications.
 * Requests permission and manages subscription state.
 */

import { useState } from "react";
import { Icon } from "@iconify/react";
import { usePushNotifications } from "@/shared/hooks/usePushNotifications";
import { useToast } from "@/shared/hooks/useToast";
import { logger } from "@/shared/utils/logger";
import { demoPushNotifications, type DemoPushNotification } from "@/shared/demo/demoData";
import {
  useSettingsStore,
  type BooleanNotificationKey,
} from "../stores/settingsStore";

interface NotificationOption {
  key: BooleanNotificationKey;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const notificationOptions: NotificationOption[] = [
  {
    key: "chargingStart",
    label: "Начало зарядки",
    description: "Когда зарядка успешно началась",
    icon: <Icon icon="solar:bolt-linear" width={16} className="text-green-600" />,
  },
  {
    key: "chargingComplete",
    label: "Завершение зарядки",
    description: "Когда зарядка завершена",
    icon: <Icon icon="solar:check-circle-bold" width={16} className="text-blue-600" />,
  },
  {
    key: "chargingError",
    label: "Ошибки зарядки",
    description: "При возникновении проблем",
    icon: <Icon icon="solar:danger-triangle-linear" width={16} className="text-amber-600" />,
  },
  {
    key: "lowBalance",
    label: "Низкий баланс",
    description: "Когда баланс ниже 50 сом",
    icon: <Icon icon="solar:wallet-linear" width={16} className="text-red-600" />,
  },
  {
    key: "chargingLimits",
    label: "Достижение лимита",
    description: "Когда зарядка приближается к лимиту",
    icon: <Icon icon="solar:gauge-linear" width={16} className="text-orange-600" />,
  },
  {
    key: "paymentAlert",
    label: "Оповещение платежа",
    description: "Подтверждение и статус платежей",
    icon: <Icon icon="solar:card-linear" width={16} className="text-cyan-600" />,
  },
];

function ToggleSwitch({
  enabled,
  onChange,
  disabled = false,
  size = "default",
}: {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
  size?: "default" | "small";
}) {
  const sizeClasses =
    size === "small"
      ? { container: "h-5 w-9", thumb: "h-3 w-3", translate: "translate-x-5" }
      : { container: "h-6 w-11", thumb: "h-4 w-4", translate: "translate-x-6" };

  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`
        relative inline-flex ${sizeClasses.container} items-center rounded-full
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${enabled ? "bg-red-600" : "bg-zinc-700"}
      `}
      aria-pressed={enabled}
    >
      <span
        className={`
          inline-block ${sizeClasses.thumb} transform rounded-full bg-zinc-900 shadow-sm shadow-black/20
          transition-transform duration-200 ease-in-out
          ${enabled ? sizeClasses.translate : "translate-x-1"}
        `}
      />
    </button>
  );
}

export function PushNotificationSettings() {
  const [testNotifications, setTestNotifications] = useState<DemoPushNotification[]>([]);

  const {
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    isSupported,
  } = usePushNotifications();

  const toast = useToast();

  const {
    notificationPreferences,
    setNotificationPreference,
    setDeliveryTiming,
    setQuietHours,
    setFrequency,
    setGroupingSimilar,
  } = useSettingsStore();

  // Handle test notification
  const handleTestNotification = () => {
    const newNotification: DemoPushNotification = {
      id: `notif-test-${Date.now()}`,
      type: "paymentAlert",
      title: "Тестовое уведомление",
      body: "Это тестовое уведомление для проверки настроек",
      timestamp: new Date().toISOString(),
      read: false,
    };

    setTestNotifications([newNotification, ...testNotifications]);
    toast.success("Тестовое уведомление отправлено");
    logger.info("[PushNotificationSettings] Test notification sent");
  };

  // Handle toggle
  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        logger.info("[PushNotificationSettings] Unsubscribed successfully");
      }
    } else {
      const success = await subscribe();
      if (success) {
        logger.info("[PushNotificationSettings] Subscribed successfully");
      }
    }
  };

  // Not supported message
  if (!isSupported) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-start gap-3">
          <Icon icon="solar:info-circle-linear" width={20} className="text-gray-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-white">
              Push уведомления недоступны
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Ваш браузер не поддерживает push уведомления. Попробуйте
              использовать Chrome, Firefox или Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Permission denied message
  if (permission === "denied") {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
        <div className="flex items-start gap-3">
          <Icon icon="solar:bell-off-linear" width={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-amber-400">
              Уведомления заблокированы
            </h3>
            <p className="mt-1 text-sm text-amber-400">
              Вы заблокировали уведомления для этого сайта. Чтобы включить их:
            </p>
            <ol className="mt-2 text-sm text-amber-400 list-decimal list-inside space-y-1">
              <li>Откройте настройки браузера</li>
              <li>
                Найдите раздел &ldquo;Уведомления&rdquo; или
                &ldquo;Разрешения&rdquo;
              </li>
              <li>Разрешите уведомления для redpetroleum.kg</li>
              <li>Обновите страницу</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Toggle Switch */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <Icon icon="solar:bell-bold" width={20} className="text-green-600" />
          ) : (
            <Icon icon="solar:bell-off-linear" width={20} className="text-gray-400" />
          )}
          <div>
            <h3 className="text-sm font-medium text-white">
              Push уведомления
            </h3>
            <p className="text-sm text-gray-400">
              {isSubscribed
                ? "Вы получаете уведомления"
                : "Включите для получения уведомлений"}
            </p>
          </div>
        </div>

        <ToggleSwitch
          enabled={isSubscribed}
          onChange={handleToggle}
          disabled={isLoading}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Notification type settings */}
      {isSubscribed && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1">
            Типы уведомлений
          </p>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
            {notificationOptions.map((option) => (
              <div
                key={option.key}
                className="flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">{option.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {option.description}
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={notificationPreferences[option.key]}
                  onChange={() =>
                    setNotificationPreference(
                      option.key,
                      !notificationPreferences[option.key],
                    )
                  }
                  size="small"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delivery Timing Section */}
      {isSubscribed && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1">
            Время отправки
          </p>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 space-y-3">
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="delivery-timing"
                  value="immediate"
                  checked={notificationPreferences.deliveryTiming === "immediate"}
                  onChange={() => setDeliveryTiming("immediate")}
                  className="w-4 h-4 text-red-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-white">Немедленно</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="delivery-timing"
                  value="quiet-hours"
                  checked={notificationPreferences.deliveryTiming === "quiet-hours"}
                  onChange={() => setDeliveryTiming("quiet-hours")}
                  className="w-4 h-4 text-red-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-white">В тихие часы</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="delivery-timing"
                  value="scheduled"
                  checked={notificationPreferences.deliveryTiming === "scheduled"}
                  onChange={() => setDeliveryTiming("scheduled")}
                  className="w-4 h-4 text-red-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-white">По расписанию</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Quiet Hours Section */}
      {isSubscribed && notificationPreferences.deliveryTiming === "quiet-hours" && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1">
            Тихие часы
          </p>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  С
                </label>
                <input
                  type="time"
                  value={notificationPreferences.quietHoursFrom}
                  onChange={(e) =>
                    setQuietHours(e.target.value, notificationPreferences.quietHoursTo)
                  }
                  className="w-full rounded border border-zinc-700 bg-zinc-800 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  До
                </label>
                <input
                  type="time"
                  value={notificationPreferences.quietHoursTo}
                  onChange={(e) =>
                    setQuietHours(notificationPreferences.quietHoursFrom, e.target.value)
                  }
                  className="w-full rounded border border-zinc-700 bg-zinc-800 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Уведомления будут отложены до конца тихих часов
            </p>
          </div>
        </div>
      )}

      {/* Frequency Selection Section */}
      {isSubscribed && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1">
            Частота уведомлений
          </p>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 space-y-3">
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  value="high"
                  checked={notificationPreferences.frequency === "high"}
                  onChange={() => setFrequency("high")}
                  className="w-4 h-4 text-red-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-white">Высокая (все уведомления)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  value="medium"
                  checked={notificationPreferences.frequency === "medium"}
                  onChange={() => setFrequency("medium")}
                  className="w-4 h-4 text-red-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-white">Средняя (сгруппированные)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  value="low"
                  checked={notificationPreferences.frequency === "low"}
                  onChange={() => setFrequency("low")}
                  className="w-4 h-4 text-red-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-white">Низкая (только критичные)</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Grouping Toggle */}
      {isSubscribed && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon icon="solar:bag-linear" width={16} className="text-purple-600" />
            <div>
              <p className="text-sm font-medium text-white">Группировать похожие</p>
              <p className="text-xs text-gray-500">Объединять похожие уведомления</p>
            </div>
          </div>
          <ToggleSwitch
            enabled={notificationPreferences.groupingSimilar}
            onChange={() => setGroupingSimilar(!notificationPreferences.groupingSimilar)}
            size="small"
          />
        </div>
      )}

      {/* Notification History Section */}
      {isSubscribed && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1">
            Последние уведомления
          </p>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800 overflow-hidden">
            {[...testNotifications, ...(demoPushNotifications.history || [])].map((notification) => {
              const notificationIcons: Record<string, string> = {
                chargingStart: "solar:bolt-linear",
                chargingComplete: "solar:check-circle-bold",
                chargingError: "solar:danger-triangle-linear",
                lowBalance: "solar:wallet-linear",
                chargingLimits: "solar:gauge-linear",
                paymentAlert: "solar:card-linear",
              };

              const typeColors: Record<string, string> = {
                chargingStart: "text-green-600",
                chargingComplete: "text-blue-600",
                chargingError: "text-amber-600",
                lowBalance: "text-red-600",
                chargingLimits: "text-orange-600",
                paymentAlert: "text-cyan-600",
              };

              const timestamp = new Date(notification.timestamp);
              const now = new Date();
              const diffMinutes = Math.round((now.getTime() - timestamp.getTime()) / 60000);
              let timeStr = "";
              if (diffMinutes < 60) {
                timeStr = `${diffMinutes} мин назад`;
              } else if (diffMinutes < 1440) {
                const hours = Math.round(diffMinutes / 60);
                timeStr = `${hours} ч назад`;
              } else {
                timeStr = timestamp.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
              }

              return (
                <div key={notification.id} className="p-3 flex gap-3">
                  <Icon
                    icon={notificationIcons[notification.type] || "solar:bell-linear"}
                    width={20}
                    className={`flex-shrink-0 ${typeColors[notification.type] || "text-gray-500"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${notification.read ? "text-gray-400" : "text-white"}`}>
                        {notification.title}
                      </p>
                      {!notification.read && <div className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{notification.body}</p>
                    <p className="text-xs text-gray-600 mt-1">{timeStr}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Test Notification Button */}
      {isSubscribed && (
        <button
          onClick={handleTestNotification}
          className="w-full rounded-lg bg-gradient-to-r from-red-600 to-orange-600 px-4 py-3 text-white font-medium text-sm flex items-center justify-center gap-2 hover:from-red-700 hover:to-orange-700 transition-colors"
        >
          <Icon icon="solar:bell-linear" width={18} />
          Отправить тестовое уведомление
        </button>
      )}

      {/* Permission info */}
      {!isSubscribed && permission === "default" && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
          <div className="flex items-start gap-2">
            <Icon icon="solar:info-circle-linear" width={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-400">
              При включении браузер запросит разрешение на отправку уведомлений.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
