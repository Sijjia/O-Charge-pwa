import { useState, useEffect, useCallback } from "react";

const ONBOARDING_STORAGE_KEY = "rp_onboarding_completed";

/**
 * Hook для управления состоянием onboarding
 * Отслеживает, видел ли пользователь onboarding при первом запуске
 */
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Проверяем при монтировании, показывался ли onboarding ранее,
  // а также пропускаем его для десктопных устройств/широких экранов.
  useEffect(() => {
    try {
      const isDesktop = window.innerWidth >= 768; // Tailwind md breakpoint

      const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);

      // Автоматически пропускаем онбординг, если:
      // 1. Он уже был пройден
      // 2. Это устройство с широким экраном (desktop/tablet landscape)
      if (completed || isDesktop) {
        setShowOnboarding(false);
        if (isDesktop && !completed) {
          // Записываем, что пройден, чтобы при ресайзе не появился снова
          localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
        }
      } else {
        setShowOnboarding(true);
      }
    } catch {
      // localStorage недоступен, не показываем onboarding
      setShowOnboarding(false);
    }
    setIsLoading(false);
  }, []);

  // Отмечаем onboarding как завершённый
  const completeOnboarding = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {
      // ignore storage errors
    }
    setShowOnboarding(false);
  }, []);

  // Пропустить onboarding
  const skipOnboarding = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  // Сбросить onboarding (для тестирования)
  const resetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    setShowOnboarding(true);
  }, []);

  return {
    showOnboarding,
    isLoading,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
}

export default useOnboarding;
