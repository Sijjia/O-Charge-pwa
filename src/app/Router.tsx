import { Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { LoadingScreen } from "../shared/components/LoadingScreen";
import { BottomNavigation } from "../shared/components/BottomNavigation";
import { OfflineIndicator } from "../shared/components/OfflineIndicator";
import {
  routes,
  prefetchCriticalRoutes,
  prefetchRelatedRoutes,
} from "./LazyRoutes";
import { RequireAuth } from "../shared/components/RequireAuth";

export function Router() {
  const location = useLocation();

  // Prefetch критичных роутов при загрузке приложения
  useEffect(() => {
    prefetchCriticalRoutes();
  }, []);

  // Prefetch связанных роутов при изменении локации
  useEffect(() => {
    prefetchRelatedRoutes(location.pathname);
  }, [location.pathname]);

  return (
    <>
      {/* Offline Status Indicator */}
      <OfflineIndicator />

      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<routes.MapPage.component />} />
          <Route
            path="/splash"
            element={<routes.SplashScreen.component />}
          />
          <Route path="/auth/sso/callback" element={<routes.SSOCallbackPage.component />} />
          <Route path="/auth/*" element={<routes.Auth.component />} />
          <Route
            path="/auth/phone"
            element={<routes.PhoneAuthPage.component />}
          />
          <Route
            path="/auth/otp"
            element={<routes.OTPVerifyPage.component />}
          />
          <Route path="/map" element={<routes.MapPage.component />} />
          <Route path="/stations" element={<routes.StationsList.component />} />
          <Route
            path="/qr-scanner"
            element={<routes.QRScannerPage.component />}
          />
          <Route path="/charging" element={<routes.ChargingPage.component />} />
          <Route
            path="/charging/:stationId"
            element={<routes.ChargingPage.component />}
          />
          <Route
            path="/charging-process/:sessionId"
            element={<routes.ChargingProcessPage.component />}
          />
          <Route
            path="/charging-complete/:sessionId"
            element={<routes.ChargingCompletePage.component />}
          />
          <Route
            path="/favorites"
            element={<routes.StationsList.component />}
          />
          <Route path="/profile" element={<routes.ProfilePage.component />} />
          <Route path="/settings" element={<routes.SettingsPage.component />} />
          <Route
            path="/settings/notifications"
            element={<routes.NotificationSettingsPage.component />}
          />
          <Route path="/balance" element={<RequireAuth><routes.BalancePage.component /></RequireAuth>} />
          <Route path="/history" element={<RequireAuth><routes.HistoryPage.component /></RequireAuth>} />
          <Route path="/payments" element={<RequireAuth><routes.PaymentsPage.component /></RequireAuth>} />
          <Route path="/about" element={<routes.AboutPage.component />} />
          <Route path="/support" element={<routes.SupportPage.component />} />
          <Route
            path="/pwa/debug"
            element={<routes.PWADebugPage.component />}
          />
          <Route
            path="/install"
            element={<routes.InstallAppPage.component />}
          />
          <Route
            path="/auth/debug"
            element={<routes.AuthDebugPage.component />}
          />
          <Route
            path="/auth/name"
            element={<routes.NameInputPage.component />}
          />

          {/* Profile Edit */}
          <Route
            path="/profile/edit"
            element={<RequireAuth fallback="redirect"><routes.EditProfilePage.component /></RequireAuth>}
          />

          {/* Topup */}
          <Route
            path="/topup"
            element={<RequireAuth><routes.TopupAmountPage.component /></RequireAuth>}
          />
          <Route
            path="/topup/success"
            element={<routes.TopupSuccessPage.component />}
          />

          {/* Error States */}
          <Route
            path="/error/charging"
            element={<routes.ChargingErrorPage.component />}
          />
          <Route
            path="/error/balance"
            element={<routes.LowBalancePage.component />}
          />
          <Route
            path="/error/offline"
            element={<routes.OfflinePage.component />}
          />
          <Route
            path="/error/station"
            element={<routes.StationUnavailablePage.component />}
          />
          <Route
            path="/error/connectors"
            element={<routes.ConnectorsBusyPage.component />}
          />
          <Route
            path="/error/payment"
            element={<routes.PaymentErrorPage.component />}
          />
          <Route
            path="/error/limit"
            element={<routes.LimitReachedPage.component />}
          />
          <Route
            path="/error/update"
            element={<routes.AppUpdateRequiredPage.component />}
          />

          {/* Guest Charging Flow */}
          <Route element={<routes.GuestLayout.component />}>
            <Route
              path="/guest/:stationCode"
              element={<routes.GuestLandingPage.component />}
            />
            <Route
              path="/guest/phone"
              element={<routes.GuestPhonePage.component />}
            />
            <Route
              path="/guest/payment"
              element={<routes.GuestPaymentPage.component />}
            />
            <Route
              path="/guest/payment/qr"
              element={<routes.GuestPaymentQRPage.component />}
            />
            <Route
              path="/guest/charging/:sessionId"
              element={<routes.GuestChargingPage.component />}
            />
            <Route
              path="/guest/complete/:sessionId"
              element={<routes.GuestCompletePage.component />}
            />
          </Route>

          {/* Corporate Panel */}
          <Route
            path="/corporate/login"
            element={<routes.CorporateLoginPage.component />}
          />
          <Route element={<routes.CorporateProtectedRoute.component />}>
            <Route element={<routes.CorporateLayout.component />}>
              <Route
                path="/corporate/dashboard"
                element={<routes.CorporateDashboardPage.component />}
              />
              <Route
                path="/corporate/employees"
                element={<routes.CorporateEmployeesPage.component />}
              />
              <Route
                path="/corporate/reports"
                element={<routes.CorporateReportsPage.component />}
              />
              <Route
                path="/corporate/invoices"
                element={<routes.CorporateInvoicesPage.component />}
              />
            </Route>
          </Route>

          {/* Partner Panel Routes */}
          <Route element={<routes.PartnerProtectedRoute.component />}>
            <Route element={<routes.PartnerLayout.component />}>
              <Route
                path="/partner/dashboard"
                element={<routes.PartnerDashboardPage.component />}
              />
              <Route
                path="/partner/stations"
                element={<routes.PartnerStationsPage.component />}
              />
              <Route
                path="/partner/stations/:stationId"
                element={<routes.PartnerStationDetailPage.component />}
              />
              <Route
                path="/partner/sessions"
                element={<routes.PartnerSessionsPage.component />}
              />
              <Route
                path="/partner/revenue"
                element={<routes.PartnerRevenuePage.component />}
              />
              <Route
                path="/partner/settings"
                element={<routes.PartnerSettingsPage.component />}
              />
              <Route
                path="/partner/incidents"
                element={<routes.PartnerIncidentsPage.component />}
              />
            </Route>
          </Route>

          {/* Website Landing Pages */}
          <Route element={<routes.WebsiteLayout.component />}>
            <Route
              path="/www"
              element={<routes.HomePage.component />}
            />
            <Route
              path="/www/map"
              element={<routes.PublicMapPage.component />}
            />
            <Route
              path="/www/tariffs"
              element={<routes.TariffsPage.component />}
            />
            <Route
              path="/www/b2b"
              element={<routes.B2BPage.component />}
            />
            <Route
              path="/www/faq"
              element={<routes.FAQPage.component />}
            />
            <Route
              path="/www/contacts"
              element={<routes.ContactsPage.component />}
            />
            <Route
              path="/www/download"
              element={<routes.DownloadAppPage.component />}
            />
          </Route>

          {/* Sandbox (dev tools, no auth required) */}
          <Route
            path="/sandbox"
            element={<routes.SandboxPage.component />}
          />

          {/* Admin Panel Routes (admin/superadmin only) */}
          <Route element={<routes.AdminProtectedRoute.component />}>
            <Route element={<routes.AdminLayout.component />}>
              <Route path="/admin/dashboard" element={<routes.AdminDashboardPage.component />} />
              <Route path="/admin/stations" element={<routes.OwnerStationsListPage.component />} />
              <Route path="/admin/stations/create" element={<routes.CreateStationPage.component />} />
              <Route path="/admin/stations/:id" element={<routes.OwnerStationDetailsPage.component />} />
              <Route path="/admin/stations/:id/connector/:connectorId" element={<routes.AdminConnectorDetailPage.component />} />
              <Route path="/admin/stations/:id/edit" element={<routes.EditStationPage.component />} />
              <Route path="/admin/locations" element={<routes.OwnerLocationsListPage.component />} />
              <Route path="/admin/locations/create" element={<routes.CreateLocationPage.component />} />
              <Route path="/admin/locations/:locationId" element={<routes.AdminLocationDetailPage.component />} />
              <Route path="/admin/locations/:locationId/edit" element={<routes.EditLocationPage.component />} />
              <Route path="/admin/sessions" element={<routes.OwnerSessionsPage.component />} />
              <Route path="/admin/sessions/:id" element={<routes.AdminSessionDetailPage.component />} />
              <Route path="/admin/clients" element={<routes.AdminClientsPage.component />} />
              <Route path="/admin/clients/:id" element={<routes.AdminClientDetailPage.component />} />
              <Route path="/admin/reserves" element={<routes.AdminReservesPage.component />} />
              <Route path="/admin/partners" element={<routes.AdminPartnersPage.component />} />
              <Route path="/admin/partners/:partnerId" element={<routes.AdminPartnerDetailPage.component />} />
              <Route path="/admin/analytics" element={<routes.AdminAnalyticsPage.component />} />
              <Route path="/admin/settings" element={<routes.AdminSettingsPage.component />} />
              <Route path="/admin/revenue" element={<routes.AdminRevenuePage.component />} />
              <Route path="/admin/tariffs" element={<routes.OwnerTariffsPage.component />} />
              <Route path="/admin/tariffs/create" element={<routes.CreateTariffPage.component />} />
              <Route path="/admin/tariffs/:id" element={<routes.TariffDetailsPage.component />} />
              <Route path="/admin/tariffs/:id/edit" element={<routes.EditTariffPage.component />} />
              <Route path="/admin/corporate" element={<routes.OwnerCorporateGroupsPage.component />} />
              <Route path="/admin/corporate/create" element={<routes.CreateCorporateGroupPage.component />} />
              <Route path="/admin/corporate/:id" element={<routes.CorporateGroupDetailsPage.component />} />
              <Route path="/admin/operators" element={<routes.OperatorsPage.component />} />
              <Route path="/admin/users" element={<routes.OwnerUsersPage.component />} />
              <Route path="/admin/logs" element={<routes.OwnerLogsPage.component />} />
              <Route path="/admin/stress-test" element={<routes.AdminStressTestPage.component />} />
              <Route path="/admin/simulator" element={<routes.AdminStationSimulatorPage.component />} />
              <Route path="/admin/alerts" element={<routes.AdminAlertsPage.component />} />
              <Route path="/admin/error-guide" element={<routes.AdminErrorGuidePage.component />} />
              <Route path="/admin/server-logs" element={<routes.AdminLogsPage.component />} />
              <Route path="/admin/station-terminal" element={<routes.AdminStationTerminalPage.component />} />
              <Route path="/admin/station-terminal/:stationId" element={<routes.AdminStationTerminalPage.component />} />
              <Route path="/admin/equipment" element={<routes.AdminEquipmentPage.component />} />
              <Route path="/admin/integrations/maps" element={<routes.AdminIntegrationsPage.component />} />
              <Route path="/admin/system-map" element={<routes.AdminSystemMapPage.component />} />
            </Route>
          </Route>

          {/* Owner Dashboard Routes */}
          {/* Единая форма входа используется для всех - /auth */}
          <Route element={<routes.OwnerProtectedRoute.component />}>
            <Route element={<routes.OwnerLayout.component />}>
              <Route
                path="/owner/dashboard"
                element={<routes.OwnerDashboardPage.component />}
              />
              <Route
                path="/owner/stations"
                element={<routes.OwnerStationsListPage.component />}
              />
              <Route
                path="/owner/stations/create"
                element={<routes.CreateStationPage.component />}
              />
              <Route
                path="/owner/stations/:id"
                element={<routes.OwnerStationDetailsPage.component />}
              />
              <Route
                path="/owner/stations/:id/connector/:connectorId"
                element={<routes.AdminConnectorDetailPage.component />}
              />
              <Route
                path="/owner/stations/:id/edit"
                element={<routes.EditStationPage.component />}
              />
              <Route
                path="/owner/revenue"
                element={<routes.OwnerRevenuePage.component />}
              />
              <Route
                path="/owner/incidents"
                element={<routes.OwnerIncidentsPage.component />}
              />
              <Route
                path="/owner/sessions"
                element={<routes.OwnerSessionsPage.component />}
              />
              <Route
                path="/owner/users"
                element={<routes.OwnerUsersPage.component />}
              />
              <Route
                path="/owner/operators"
                element={<routes.OperatorsPage.component />}
              />
              <Route
                path="/owner/tariffs"
                element={<routes.OwnerTariffsPage.component />}
              />
              <Route
                path="/owner/tariffs/create"
                element={<routes.CreateTariffPage.component />}
              />
              <Route
                path="/owner/tariffs/:id"
                element={<routes.TariffDetailsPage.component />}
              />
              <Route
                path="/owner/tariffs/:id/edit"
                element={<routes.EditTariffPage.component />}
              />
              <Route
                path="/owner/logs"
                element={<routes.OwnerLogsPage.component />}
              />
              <Route
                path="/owner/corporate"
                element={<routes.OwnerCorporateGroupsPage.component />}
              />
              <Route
                path="/owner/corporate/create"
                element={<routes.CreateCorporateGroupPage.component />}
              />
              <Route
                path="/owner/corporate/:id"
                element={<routes.CorporateGroupDetailsPage.component />}
              />
              <Route
                path="/owner/locations"
                element={<routes.OwnerLocationsListPage.component />}
              />
              <Route
                path="/owner/locations/create"
                element={<routes.CreateLocationPage.component />}
              />
              <Route
                path="/owner/locations/:locationId"
                element={<routes.AdminLocationDetailPage.component />}
              />
              <Route
                path="/owner/locations/:locationId/edit"
                element={<routes.EditLocationPage.component />}
              />
            </Route>
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<routes.NotFoundPage.component />} />
        </Routes>
      </Suspense>

      {/* Bottom Navigation - Show only on main 4 tab pages */}
      {(["/", "/history", "/payments", "/profile"].includes(location.pathname)
        || (location.pathname.startsWith("/charging")
            && !location.pathname.startsWith("/charging-process")
            && !location.pathname.startsWith("/charging-complete"))) && (
        <BottomNavigation />
      )}
    </>
  );
}
