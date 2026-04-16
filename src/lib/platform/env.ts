/**
 * Platform environment detection - PWA version
 * PWA всегда работает в веб-контексте
 */

/**
 * Определяет, запущено ли приложение в нативной оболочке
 * PWA: всегда false
 */
export const isNativePlatform = (): boolean => {
  return false;
};

/**
 * Определяет, запущено ли приложение в вебе (PWA)
 * PWA: всегда true
 */
export const isWebPlatform = (): boolean => {
  return true;
};

/**
 * Получает текущую платформу
 * PWA: всегда 'web'
 */
export const getPlatform = (): 'web' => {
  return 'web';
};

/**
 * Определяет, запущено ли приложение на iOS
 * PWA: всегда false (хотя может работать в Safari iOS)
 */
export const isIOS = (): boolean => {
  return false;
};

/**
 * Определяет, запущено ли приложение на Android
 * PWA: всегда false (хотя может работать в Chrome Android)
 */
export const isAndroid = (): boolean => {
  return false;
};

/**
 * Получает информацию о платформе для логирования
 */
export const getPlatformInfo = () => {
  return {
    platform: 'web' as const,
    isNative: false,
    isWeb: true,
    isIOS: false,
    isAndroid: false,
    userAgent: navigator.userAgent
  };
};
