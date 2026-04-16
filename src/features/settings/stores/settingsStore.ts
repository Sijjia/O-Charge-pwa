import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BooleanNotificationKey = "chargingStart" | "chargingComplete" | "chargingError" | "lowBalance" | "chargingLimits" | "paymentAlert";

export interface NotificationPreferences {
  chargingStart: boolean;
  chargingComplete: boolean;
  chargingError: boolean;
  lowBalance: boolean;
  chargingLimits: boolean;
  paymentAlert: boolean;
  deliveryTiming: "immediate" | "quiet-hours" | "scheduled";
  quietHoursFrom: string;
  quietHoursTo: string;
  frequency: "high" | "medium" | "low";
  groupingSimilar: boolean;
}

interface SettingsStore {
  // Настройки приложения
  notifications: boolean;
  notificationPreferences: NotificationPreferences;
  darkMode: boolean;
  language: "ru" | "en" | "ky";

  // Actions
  setNotifications: (enabled: boolean) => void;
  setNotificationPreference: (
    key: BooleanNotificationKey,
    enabled: boolean,
  ) => void;
  setDeliveryTiming: (timing: "immediate" | "quiet-hours" | "scheduled") => void;
  setQuietHours: (from: string, to: string) => void;
  setFrequency: (frequency: "high" | "medium" | "low") => void;
  setGroupingSimilar: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  setLanguage: (lang: "ru" | "en" | "ky") => void;
  resetSettings: () => void;
}

const defaultNotificationPreferences: NotificationPreferences = {
  chargingStart: true,
  chargingComplete: true,
  chargingError: true,
  lowBalance: true,
  chargingLimits: true,
  paymentAlert: true,
  deliveryTiming: "immediate",
  quietHoursFrom: "22:00",
  quietHoursTo: "08:00",
  frequency: "high",
  groupingSimilar: false,
};

const defaultSettings = {
  notifications: true,
  notificationPreferences: defaultNotificationPreferences,
  darkMode: false,
  language: "ru" as const,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setNotifications: (enabled) => set({ notifications: enabled }),

      setNotificationPreference: (key, enabled) =>
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            [key]: enabled,
          },
        })),

      setDeliveryTiming: (timing) =>
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            deliveryTiming: timing,
          },
        })),

      setQuietHours: (from, to) =>
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            quietHoursFrom: from,
            quietHoursTo: to,
          },
        })),

      setFrequency: (frequency) =>
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            frequency,
          },
        })),

      setGroupingSimilar: (enabled) =>
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            groupingSimilar: enabled,
          },
        })),

      setDarkMode: (enabled) => set({ darkMode: enabled }),

      setLanguage: (language) => set({ language }),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: "app-settings",
    },
  ),
);
