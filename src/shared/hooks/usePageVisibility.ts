import { useState, useEffect } from "react";

/**
 * Hook для отслеживания видимости страницы (активна ли вкладка)
 * Использует Page Visibility API для определения когда пользователь переключился на другую вкладку
 *
 * @returns {boolean} true если страница видима, false если скрыта
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isVisible = usePageVisibility();
 *
 *   useEffect(() => {
 *     if (!isVisible) {
 *       console.log('Page is hidden, pause expensive operations');
 *     } else {
 *       console.log('Page is visible, resume operations');
 *     }
 *   }, [isVisible]);
 * }
 * ```
 */
export function usePageVisibility(): boolean {
  // Начальное состояние - страница видима (document.hidden обратно isVisible)
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    // SSR safety: если document не существует, считаем страницу видимой
    if (typeof document === "undefined") {
      return true;
    }
    return !document.hidden;
  });

  useEffect(() => {
    // SSR safety
    if (typeof document === "undefined") {
      return;
    }

    /**
     * Обработчик события изменения видимости
     */
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    // Подписываемся на событие visibilitychange
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup при размонтировании
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
