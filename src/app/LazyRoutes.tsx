/**
 * Централизованное управление lazy-загрузкой роутов
 * с поддержкой prefetch и error boundaries
 */

import { lazy, type ComponentType } from "react";
import { logger } from "@/shared/utils/logger";

// Тип для lazy компонента с prefetch
interface LazyRoute {
  component: React.LazyExoticComponent<ComponentType>;
  prefetch: () => Promise<void>;
}

// Функция для создания lazy роута с prefetch
function createLazyRoute(
  importFn: () => Promise<{ default: ComponentType }>,
): LazyRoute {
  const LazyComponent = lazy(importFn);

  return {
    component: LazyComponent,
    prefetch: async () => {
      await importFn();
    },
  };
}

// Определяем все lazy роуты
export const routes = {
  // Splash Screen
  SplashScreen: createLazyRoute(() =>
    import("../pages/SplashScreen").then((m) => ({
      default: m.SplashScreen,
    })),
  ),

  // Основные страницы
  MapPage: createLazyRoute(() =>
    import("../pages/MapPage").then((m) => ({ default: m.MapPage })),
  ),

  MapHome: createLazyRoute(() => import("../pages/MapHome")),

  StationsList: createLazyRoute(() =>
    import("../pages/StationsList").then((m) => ({ default: m.StationsList })),
  ),

  // QR Scanner
  QRScannerPage: createLazyRoute(() =>
    import("../pages/QRScannerPage").then((m) => ({
      default: m.QRScannerPage,
    })),
  ),

  // Страницы зарядки
  ChargingPage: createLazyRoute(() =>
    import("../pages/ChargingPage").then((m) => ({ default: m.ChargingPage })),
  ),

  ChargingProcessPage: createLazyRoute(() =>
    import("../pages/ChargingProcessPage").then((m) => ({
      default: m.ChargingProcessPage,
    })),
  ),

  ChargingCompletePage: createLazyRoute(() =>
    import("../pages/ChargingCompletePage").then((m) => ({
      default: m.ChargingCompletePage,
    })),
  ),

  // Авторизация
  Auth: createLazyRoute(() => import("../pages/Auth")),

  PhoneAuthPage: createLazyRoute(() =>
    import("../features/auth/pages/PhoneAuthPage").then((m) => ({
      default: m.PhoneAuthPage,
    })),
  ),

  OTPVerifyPage: createLazyRoute(() =>
    import("../features/auth/pages/OTPVerifyPage").then((m) => ({
      default: m.OTPVerifyPage,
    })),
  ),

  SSOCallbackPage: createLazyRoute(() =>
    import("../features/auth/pages/SSOCallbackPage").then((m) => ({
      default: m.SSOCallbackPage,
    })),
  ),

  // Профиль и история
  ProfilePage: createLazyRoute(() =>
    import("../pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
  ),

  HistoryPage: createLazyRoute(() =>
    import("../pages/HistoryPage").then((m) => ({ default: m.HistoryPage })),
  ),

  // Добавляем отсутствующие страницы
  PaymentsPage: createLazyRoute(() => import("../pages/PaymentsPage")),

  BalancePage: createLazyRoute(() =>
    import("../pages/BalancePage").then((m) => ({ default: m.BalancePage })),
  ),

  SettingsPage: createLazyRoute(() =>
    import("../pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
  ),

  NotificationSettingsPage: createLazyRoute(() =>
    import("../pages/NotificationSettingsPage").then((m) => ({
      default: m.NotificationSettingsPage,
    })),
  ),

  AboutPage: createLazyRoute(() =>
    import("../pages/AboutPage").then((m) => ({ default: m.AboutPage })),
  ),
  SupportPage: createLazyRoute(() =>
    import("../pages/SupportPage").then((m) => ({ default: m.SupportPage })),
  ),

  // Admin Panel
  AdminLayout: createLazyRoute(() =>
    import("../features/admin/components/AdminLayout").then((m) => ({
      default: m.AdminLayout,
    })),
  ),

  AdminProtectedRoute: createLazyRoute(() =>
    import("../features/admin/components/AdminProtectedRoute").then((m) => ({
      default: m.AdminProtectedRoute,
    })),
  ),

  // Owner Dashboard
  // OwnerLoginPage удалён - используется единая форма входа /auth

  OwnerLayout: createLazyRoute(() =>
    import("../features/owner/components/OwnerLayout").then((m) => ({
      default: m.OwnerLayout,
    })),
  ),

  OwnerProtectedRoute: createLazyRoute(() =>
    import("../features/owner/components/OwnerProtectedRoute").then((m) => ({
      default: m.OwnerProtectedRoute,
    })),
  ),

  OwnerDashboardPage: createLazyRoute(() =>
    import("../pages/owner/OwnerDashboardPage").then((m) => ({
      default: m.OwnerDashboardPage,
    })),
  ),

  OwnerStationsListPage: createLazyRoute(() =>
    import("../pages/owner/OwnerStationsListPage").then((m) => ({
      default: m.OwnerStationsListPage,
    })),
  ),

  OwnerStationDetailsPage: createLazyRoute(() =>
    import("../pages/owner/OwnerStationDetailsPage").then((m) => ({
      default: m.OwnerStationDetailsPage,
    })),
  ),

  CreateStationPage: createLazyRoute(() =>
    import("../pages/owner/CreateStationPage").then((m) => ({
      default: m.CreateStationPage,
    })),
  ),

  EditStationPage: createLazyRoute(() =>
    import("../pages/owner/EditStationPage").then((m) => ({
      default: m.EditStationPage,
    })),
  ),

  CreateLocationPage: createLazyRoute(() =>
    import("../pages/owner/CreateLocationPage").then((m) => ({
      default: m.CreateLocationPage,
    })),
  ),

  OwnerLocationsListPage: createLazyRoute(() =>
    import("../pages/owner/OwnerLocationsListPage").then((m) => ({
      default: m.OwnerLocationsListPage,
    })),
  ),

  EditLocationPage: createLazyRoute(() =>
    import("../pages/owner/EditLocationPage").then((m) => ({
      default: m.EditLocationPage,
    })),
  ),

  OwnerRevenuePage: createLazyRoute(() =>
    import("../pages/owner/OwnerRevenuePage").then((m) => ({
      default: m.OwnerRevenuePage,
    })),
  ),
  OwnerIncidentsPage: createLazyRoute(() =>
    import("../pages/owner/OwnerIncidentsPage").then((m) => ({
      default: m.OwnerIncidentsPage,
    })),
  ),
  InstallAppPage: createLazyRoute(() =>
    import("../pages/InstallAppPage").then((m) => ({
      default: m.InstallAppPage,
    })),
  ),
  PWADebugPage: createLazyRoute(() =>
    import("../pages/PWADebugPage").then((m) => ({
      default: m.PWADebugPage,
    })),
  ),
  AuthDebugPage: createLazyRoute(() =>
    import("../pages/AuthDebugPage").then((m) => ({
      default: m.AuthDebugPage,
    })),
  ),

  OwnerSessionsPage: createLazyRoute(() =>
    import("../pages/owner/OwnerSessionsPage").then((m) => ({
      default: m.OwnerSessionsPage,
    })),
  ),

  OwnerUsersPage: createLazyRoute(() =>
    import("../pages/owner/OwnerUsersPage").then((m) => ({
      default: m.OwnerUsersPage,
    })),
  ),

  OperatorsPage: createLazyRoute(() =>
    import("../pages/owner/OperatorsPage").then((m) => ({
      default: m.OperatorsPage,
    })),
  ),

  OwnerTariffsPage: createLazyRoute(() =>
    import("../pages/owner/OwnerTariffsPage").then((m) => ({
      default: m.OwnerTariffsPage,
    })),
  ),

  CreateTariffPage: createLazyRoute(() =>
    import("../pages/owner/CreateTariffPage").then((m) => ({
      default: m.CreateTariffPage,
    })),
  ),

  TariffDetailsPage: createLazyRoute(() =>
    import("../pages/owner/TariffDetailsPage").then((m) => ({
      default: m.TariffDetailsPage,
    })),
  ),

  EditTariffPage: createLazyRoute(() =>
    import("../pages/owner/EditTariffPage").then((m) => ({
      default: m.EditTariffPage,
    })),
  ),

  OwnerLogsPage: createLazyRoute(() =>
    import("../pages/owner/OwnerLogsPage").then((m) => ({
      default: m.OwnerLogsPage,
    })),
  ),

  OwnerCorporateGroupsPage: createLazyRoute(() =>
    import("../pages/owner/OwnerCorporateGroupsPage").then((m) => ({
      default: m.OwnerCorporateGroupsPage,
    })),
  ),

  CreateCorporateGroupPage: createLazyRoute(() =>
    import("../pages/owner/CreateCorporateGroupPage").then((m) => ({
      default: m.CreateCorporateGroupPage,
    })),
  ),

  CorporateGroupDetailsPage: createLazyRoute(() =>
    import("../pages/owner/CorporateGroupDetailsPage").then((m) => ({
      default: m.CorporateGroupDetailsPage,
    })),
  ),

  // Auth — Имя
  NameInputPage: createLazyRoute(() =>
    import("../features/auth/pages/NameInputPage").then((m) => ({
      default: m.NameInputPage,
    })),
  ),

  // Профиль — Редактирование
  EditProfilePage: createLazyRoute(() =>
    import("../pages/EditProfilePage").then((m) => ({
      default: m.EditProfilePage,
    })),
  ),

  // Balance — Пополнение
  TopupAmountPage: createLazyRoute(() =>
    import("../features/balance/pages/TopupAmountPage").then((m) => ({
      default: m.TopupAmountPage,
    })),
  ),

  TopupSuccessPage: createLazyRoute(() =>
    import("../features/balance/pages/TopupSuccessPage").then((m) => ({
      default: m.TopupSuccessPage,
    })),
  ),

  // Error States
  ChargingErrorPage: createLazyRoute(() =>
    import("../pages/errors/ChargingErrorPage").then((m) => ({
      default: m.ChargingErrorPage,
    })),
  ),

  LowBalancePage: createLazyRoute(() =>
    import("../pages/errors/LowBalancePage").then((m) => ({
      default: m.LowBalancePage,
    })),
  ),

  OfflinePage: createLazyRoute(() =>
    import("../pages/errors/OfflinePage").then((m) => ({
      default: m.OfflinePage,
    })),
  ),

  StationUnavailablePage: createLazyRoute(() =>
    import("../pages/errors/StationUnavailablePage").then((m) => ({
      default: m.StationUnavailablePage,
    })),
  ),

  ConnectorsBusyPage: createLazyRoute(() =>
    import("../pages/errors/ConnectorsBusyPage").then((m) => ({
      default: m.ConnectorsBusyPage,
    })),
  ),

  PaymentErrorPage: createLazyRoute(() =>
    import("../pages/errors/PaymentErrorPage").then((m) => ({
      default: m.PaymentErrorPage,
    })),
  ),

  LimitReachedPage: createLazyRoute(() =>
    import("../pages/errors/LimitReachedPage").then((m) => ({
      default: m.LimitReachedPage,
    })),
  ),

  NotFoundPage: createLazyRoute(() =>
    import("../pages/errors/NotFoundPage").then((m) => ({
      default: m.NotFoundPage,
    })),
  ),

  // Guest Charging Flow
  GuestLayout: createLazyRoute(() =>
    import("../pages/guest/GuestLayout").then((m) => ({
      default: m.GuestLayout,
    })),
  ),

  GuestLandingPage: createLazyRoute(() =>
    import("../pages/guest/GuestLandingPage").then((m) => ({
      default: m.GuestLandingPage,
    })),
  ),

  GuestPhonePage: createLazyRoute(() =>
    import("../pages/guest/GuestPhonePage").then((m) => ({
      default: m.GuestPhonePage,
    })),
  ),

  GuestPaymentPage: createLazyRoute(() =>
    import("../pages/guest/GuestPaymentPage").then((m) => ({
      default: m.GuestPaymentPage,
    })),
  ),

  GuestPaymentQRPage: createLazyRoute(() =>
    import("../pages/guest/GuestPaymentQRPage").then((m) => ({
      default: m.GuestPaymentQRPage,
    })),
  ),

  GuestChargingPage: createLazyRoute(() =>
    import("../pages/guest/GuestChargingPage").then((m) => ({
      default: m.GuestChargingPage,
    })),
  ),

  GuestCompletePage: createLazyRoute(() =>
    import("../pages/guest/GuestCompletePage").then((m) => ({
      default: m.GuestCompletePage,
    })),
  ),

  // Corporate Panel
  CorporateLayout: createLazyRoute(() =>
    import("../features/corporate/CorporateLayout").then((m) => ({
      default: m.CorporateLayout,
    })),
  ),

  CorporateProtectedRoute: createLazyRoute(() =>
    import("../features/corporate/CorporateProtectedRoute").then((m) => ({
      default: m.CorporateProtectedRoute,
    })),
  ),

  CorporateLoginPage: createLazyRoute(() =>
    import("../pages/corporate/CorporateLoginPage").then((m) => ({
      default: m.CorporateLoginPage,
    })),
  ),

  CorporateDashboardPage: createLazyRoute(() =>
    import("../pages/corporate/CorporateDashboardPage").then((m) => ({
      default: m.CorporateDashboardPage,
    })),
  ),

  CorporateEmployeesPage: createLazyRoute(() =>
    import("../pages/corporate/CorporateEmployeesPage").then((m) => ({
      default: m.CorporateEmployeesPage,
    })),
  ),

  CorporateReportsPage: createLazyRoute(() =>
    import("../pages/corporate/CorporateReportsPage").then((m) => ({
      default: m.CorporateReportsPage,
    })),
  ),

  CorporateInvoicesPage: createLazyRoute(() =>
    import("../pages/corporate/CorporateInvoicesPage").then((m) => ({
      default: m.CorporateInvoicesPage,
    })),
  ),

  // Partner Panel
  PartnerProtectedRoute: createLazyRoute(() =>
    import("../features/partner/components/PartnerProtectedRoute").then((m) => ({
      default: m.PartnerProtectedRoute,
    })),
  ),

  PartnerLayout: createLazyRoute(() =>
    import("../features/partner/components/PartnerLayout").then((m) => ({
      default: m.PartnerLayout,
    })),
  ),

  PartnerDashboardPage: createLazyRoute(() =>
    import("../pages/partner/PartnerDashboardPage").then((m) => ({
      default: m.PartnerDashboardPage,
    })),
  ),

  PartnerStationsPage: createLazyRoute(() =>
    import("../pages/partner/PartnerStationsPage").then((m) => ({
      default: m.PartnerStationsPage,
    })),
  ),

  PartnerStationDetailPage: createLazyRoute(() =>
    import("../pages/partner/PartnerStationDetailPage").then((m) => ({
      default: m.PartnerStationDetailPage,
    })),
  ),

  PartnerSessionsPage: createLazyRoute(() =>
    import("../pages/partner/PartnerSessionsPage").then((m) => ({
      default: m.PartnerSessionsPage,
    })),
  ),

  PartnerRevenuePage: createLazyRoute(() =>
    import("../pages/partner/PartnerRevenuePage").then((m) => ({
      default: m.PartnerRevenuePage,
    })),
  ),

  // Admin Panel - Dashboard & Pages
  AdminDashboardPage: createLazyRoute(() =>
    import("../pages/admin/AdminDashboardPage").then((m) => ({
      default: m.AdminDashboardPage,
    })),
  ),

  AdminSessionDetailPage: createLazyRoute(() =>
    import("../pages/admin/AdminSessionDetailPage").then((m) => ({
      default: m.AdminSessionDetailPage,
    })),
  ),

  AdminConnectorDetailPage: createLazyRoute(() =>
    import("../pages/admin/AdminConnectorDetailPage").then((m) => ({
      default: m.AdminConnectorDetailPage,
    })),
  ),

  AdminClientsPage: createLazyRoute(() =>
    import("../pages/admin/AdminClientsPage").then((m) => ({
      default: m.AdminClientsPage,
    })),
  ),

  AdminClientDetailPage: createLazyRoute(() =>
    import("../pages/admin/AdminClientDetailPage").then((m) => ({
      default: m.AdminClientDetailPage,
    })),
  ),

  AdminReservesPage: createLazyRoute(() =>
    import("../pages/admin/AdminReservesPage").then((m) => ({
      default: m.AdminReservesPage,
    })),
  ),

  AdminPartnersPage: createLazyRoute(() =>
    import("../pages/admin/AdminPartnersPage").then((m) => ({
      default: m.AdminPartnersPage,
    })),
  ),

  AdminPartnerDetailPage: createLazyRoute(() =>
    import("../pages/admin/AdminPartnerDetailPage").then((m) => ({
      default: m.AdminPartnerDetailPage,
    })),
  ),

  AdminAnalyticsPage: createLazyRoute(() =>
    import("../pages/admin/AdminAnalyticsPage").then((m) => ({
      default: m.AdminAnalyticsPage,
    })),
  ),

  AdminSettingsPage: createLazyRoute(() =>
    import("../pages/admin/AdminSettingsPage").then((m) => ({
      default: m.AdminSettingsPage,
    })),
  ),

  AdminStressTestPage: createLazyRoute(() =>
    import("../pages/admin/AdminStressTestPage").then((m) => ({
      default: m.AdminStressTestPage,
    })),
  ),

  AdminStationSimulatorPage: createLazyRoute(() =>
    import("../pages/admin/AdminStationSimulatorPage").then((m) => ({
      default: m.AdminStationSimulatorPage,
    })),
  ),

  AdminAlertsPage: createLazyRoute(() =>
    import("../pages/admin/AdminAlertsPage").then((m) => ({
      default: m.AdminAlertsPage,
    })),
  ),

  AdminErrorGuidePage: createLazyRoute(() =>
    import("../pages/admin/AdminErrorGuidePage").then((m) => ({
      default: m.AdminErrorGuidePage,
    })),
  ),

  AdminLogsPage: createLazyRoute(() =>
    import("../pages/admin/AdminLogsPage").then((m) => ({
      default: m.AdminLogsPage,
    })),
  ),

  AdminStationTerminalPage: createLazyRoute(() =>
    import("../pages/admin/AdminStationTerminalPage").then((m) => ({
      default: m.AdminStationTerminalPage,
    })),
  ),
  AdminSystemMapPage: createLazyRoute(() =>
    import("../pages/admin/AdminSystemMapPage").then((m) => ({
      default: m.AdminSystemMapPage,
    })),
  ),

  AdminRevenuePage: createLazyRoute(() =>
    import("../pages/admin/AdminRevenuePage").then((m) => ({
      default: m.AdminRevenuePage,
    })),
  ),

  AdminLocationDetailPage: createLazyRoute(() =>
    import("../pages/admin/AdminLocationDetailPage").then((m) => ({
      default: m.AdminLocationDetailPage,
    })),
  ),

  AdminEquipmentPage: createLazyRoute(() =>
    import("../pages/admin/AdminEquipmentPage").then((m) => ({
      default: m.AdminEquipmentPage,
    })),
  ),

  AdminIntegrationsPage: createLazyRoute(() =>
    import("../pages/admin/AdminIntegrationsPage").then((m) => ({
      default: m.AdminIntegrationsPage,
    })),
  ),

  // Partner - New Pages
  PartnerSettingsPage: createLazyRoute(() =>
    import("../pages/partner/PartnerSettingsPage").then((m) => ({
      default: m.PartnerSettingsPage,
    })),
  ),
  PartnerIncidentsPage: createLazyRoute(() =>
    import("../pages/partner/PartnerIncidentsPage").then((m) => ({
      default: m.PartnerIncidentsPage,
    })),
  ),

  // Error - New Pages
  AppUpdateRequiredPage: createLazyRoute(() =>
    import("../pages/errors/AppUpdateRequiredPage").then((m) => ({
      default: m.AppUpdateRequiredPage,
    })),
  ),

  // Website - New Pages
  DownloadAppPage: createLazyRoute(() =>
    import("../pages/www/DownloadAppPage").then((m) => ({
      default: m.DownloadAppPage,
    })),
  ),

  // Sandbox
  SandboxPage: createLazyRoute(() =>
    import("../pages/SandboxPage").then((m) => ({
      default: m.SandboxPage,
    })),
  ),

  // Website Landing Pages
  WebsiteLayout: createLazyRoute(() =>
    import("../features/website/WebsiteLayout").then((m) => ({
      default: m.WebsiteLayout,
    })),
  ),

  HomePage: createLazyRoute(() =>
    import("../pages/www/HomePage").then((m) => ({
      default: m.HomePage,
    })),
  ),

  PublicMapPage: createLazyRoute(() =>
    import("../pages/www/PublicMapPage").then((m) => ({
      default: m.PublicMapPage,
    })),
  ),

  TariffsPage: createLazyRoute(() =>
    import("../pages/www/TariffsPage").then((m) => ({
      default: m.TariffsPage,
    })),
  ),

  B2BPage: createLazyRoute(() =>
    import("../pages/www/B2BPage").then((m) => ({
      default: m.B2BPage,
    })),
  ),

  FAQPage: createLazyRoute(() =>
    import("../pages/www/FAQPage").then((m) => ({
      default: m.FAQPage,
    })),
  ),

  ContactsPage: createLazyRoute(() =>
    import("../pages/www/ContactsPage").then((m) => ({
      default: m.ContactsPage,
    })),
  ),
};

// Функция для prefetch критичных роутов
export const prefetchCriticalRoutes = async () => {
  try {
    // Prefetch основные страницы при загрузке приложения
    await Promise.all([
      routes.MapPage.prefetch(),
      routes.ChargingPage.prefetch(),
      routes.ProfilePage.prefetch(),
    ]);
  } catch (error) {
    logger.error("Failed to prefetch critical routes:", error);
  }
};

// Функция для prefetch роутов при наведении
export const prefetchRoute = async (routeName: keyof typeof routes) => {
  try {
    const route = routes[routeName];
    if (route) {
      await route.prefetch();
    }
  } catch (error) {
    logger.error(`Failed to prefetch route ${routeName}:`, error);
  }
};

// Функция для prefetch связанных роутов
export const prefetchRelatedRoutes = async (currentRoute: string) => {
  const relatedRoutes: Record<string, (keyof typeof routes)[]> = {
    "/": ["ChargingPage", "ProfilePage"],
    "/charging": ["ChargingProcessPage"],
    "/history": ["ProfilePage", "PaymentsPage"],
    "/payments": ["ProfilePage", "HistoryPage"],
    "/profile": ["HistoryPage", "PaymentsPage", "SettingsPage", "AboutPage"],
  };

  const toPrefetch = relatedRoutes[currentRoute];
  if (toPrefetch) {
    await Promise.all(toPrefetch.map((routeName) => prefetchRoute(routeName)));
  }
};

// Hook для использования prefetch при взаимодействии
export const usePrefetch = () => {
  const handleMouseEnter = (routeName: keyof typeof routes) => {
    // Задержка перед prefetch чтобы избежать лишних загрузок
    const timer = setTimeout(() => {
      prefetchRoute(routeName);
    }, 200);

    return () => clearTimeout(timer);
  };

  return { handleMouseEnter, prefetchRoute };
};
