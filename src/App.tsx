import { useEffect, useState } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { type Query } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Router } from "./app/Router";
import { Providers } from "./app/Providers";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import { AuthModal } from "./features/auth/components/AuthModal";
import { ToastContainer } from "./shared/hooks/useToast";
import { UpdatePrompt } from "./shared/components/UpdatePrompt";
import { InstallPrompt } from "./shared/components/InstallPrompt";
import { useWarmupOfflineData } from "./features/pwa/hooks/useWarmupOfflineData";
import { NetworkStatusBanner } from "./shared/components/NetworkStatusBanner";
import { AuthEnvBanner } from "./shared/components/AuthEnvBanner";
import { createIDBPersister } from "./lib/queryPersister";
import { queryClient, shouldPersistQuery } from "./lib/queryClient";
import { versionManager } from "./lib/versionManager";
import { LoadingScreen } from "./shared/components/LoadingScreen";
import { logger } from "./shared/utils/logger";
import { OnboardingSlides, useOnboarding } from "./features/onboarding";

const persister = createIDBPersister();

function App() {
  const [isVersionCheckComplete, setIsVersionCheckComplete] = useState(false);
  const {
    showOnboarding,
    isLoading: isOnboardingLoading,
    completeOnboarding,
    skipOnboarding,
  } = useOnboarding();
  useWarmupOfflineData();

  // Проверка версии и миграции при старте приложения
  useEffect(() => {
    const initializeVersion = async () => {
      try {
        if (!import.meta.env.PROD)
          logger.debug("[App] Starting version check...");
        const result = await versionManager.initialize();

        if (!result.success) {
          if (!import.meta.env.PROD)
            logger.error("[App] Version migration errors:", result.errors);
          // Даже при ошибках продолжаем работу - миграции не критичны
        }

        if (result.migrationsRun.length > 0) {
          if (!import.meta.env.PROD)
            logger.info("[App] Migrations completed:", result.migrationsRun);
          // Показываем пользователю что приложение обновилось
          if (import.meta.env.PROD) {
            // В production можно показать toast или уведомление
            logger.info(
              "[App] App updated to version:",
              versionManager.getVersionInfo().version,
            );
          }
        }

        setIsVersionCheckComplete(true);
      } catch (error) {
        if (!import.meta.env.PROD)
          logger.error("[App] Version check failed:", error);
        // Продолжаем работу даже при ошибке
        setIsVersionCheckComplete(true);
      }
    };

    initializeVersion();
  }, []);

  // Показываем loading screen пока идет проверка версии
  if (!isVersionCheckComplete || isOnboardingLoading) {
    return <LoadingScreen />;
  }

  // Показываем onboarding при первом запуске
  if (showOnboarding) {
    return (
      <OnboardingSlides
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      />
    );
  }

  return (
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
          dehydrateOptions: {
            shouldDehydrateQuery: (query: Query) => {
              // Only persist queries that match our criteria
              return (
                query.state.status === "success" &&
                shouldPersistQuery(query.queryKey)
              );
            },
          },
        }}
      >
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Providers>
            <div className="min-h-screen bg-[var(--ev-bg-primary)]">
              <AuthEnvBanner />
              <NetworkStatusBanner />
              <Router />
              {/** Не показываем модалку авторизации на странице /auth, чтобы не дублировать форму */}
              <AuthModalGate />
              <ToastContainer />
              <UpdatePrompt />
              <InstallPrompt />
            </div>
          </Providers>
        </BrowserRouter>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

function AuthModalGate() {
  const location = useLocation();
  // Не показываем модалку на странице авторизации
  if (location.pathname.startsWith("/auth")) {
    return null;
  }

  // Показываем модалку только если явно запрошено через ?auth=required
  const params = new URLSearchParams(location.search);
  const forceAuth = params.get("auth") === "required";

  if (!forceAuth) {
    return null;
  }

  return (
    <AuthModal
      isOpen={true}
      requireAuth={true}
      allowSkip={false}
      onClose={undefined}
    />
  );
}
