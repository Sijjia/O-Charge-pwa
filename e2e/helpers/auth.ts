import { Page } from "@playwright/test";

/**
 * Enable demo mode + seed auth store for admin.
 * AdminProtectedRoute checks isDemoModeActive() and auto-logs in,
 * but we also seed auth-storage so the Zustand store hydrates immediately.
 */
export async function setupDemoAdmin(page: Page) {
  const authState = JSON.stringify({
    state: {
      user: {
        id: "demo-system-admin-001",
        email: null,
        phone: "+996555000000",
        name: "Demo Admin",
        balance: 0,
        status: "active",
        favoriteStations: [],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      owner: {
        id: "demo-system-admin-001",
        phone: "+996555000000",
        role: "admin",
        is_active: true,
        is_partner: false,
      },
      userType: "owner",
      isAuthenticated: true,
    },
    version: 0,
  });
  await page.addInitScript((state: string) => {
    localStorage.setItem("auth-storage", state);
    localStorage.setItem("rp_onboarding_completed", "true");
    sessionStorage.setItem("demo_mode", "true");
    sessionStorage.setItem("demo_role", "admin");
  }, authState);
}

/**
 * Enable demo mode + seed auth store for partner.
 * PartnerProtectedRoute requires is_partner=true.
 */
export async function setupDemoPartner(page: Page) {
  const authState = JSON.stringify({
    state: {
      user: {
        id: "demo-partner-company-001",
        email: null,
        phone: "+996555000002",
        name: "Demo Partner",
        balance: 0,
        status: "active",
        favoriteStations: [],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      owner: {
        id: "demo-partner-company-001",
        phone: "+996555000002",
        role: "operator",
        is_active: true,
        is_partner: true,
      },
      userType: "owner",
      isAuthenticated: true,
    },
    version: 0,
  });
  await page.addInitScript((state: string) => {
    localStorage.setItem("auth-storage", state);
    localStorage.setItem("rp_onboarding_completed", "true");
    sessionStorage.setItem("demo_mode", "true");
    sessionStorage.setItem("demo_role", "partner");
  }, authState);
}

/**
 * Enable demo mode + seed auth store for owner (regional operator).
 * OwnerProtectedRoute checks role in [operator, admin, superadmin].
 */
export async function setupDemoOwner(page: Page) {
  const authState = JSON.stringify({
    state: {
      user: {
        id: "demo-regional-operator-001",
        email: null,
        phone: "+996555000001",
        name: "Demo Operator",
        balance: 0,
        status: "active",
        favoriteStations: [],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      owner: {
        id: "demo-regional-operator-001",
        phone: "+996555000001",
        role: "admin",
        is_active: true,
        is_partner: false,
      },
      userType: "owner",
      isAuthenticated: true,
    },
    version: 0,
  });
  await page.addInitScript((state: string) => {
    localStorage.setItem("auth-storage", state);
    localStorage.setItem("rp_onboarding_completed", "true");
    sessionStorage.setItem("demo_mode", "true");
    sessionStorage.setItem("demo_role", "admin");
  }, authState);
}

/**
 * Set up client auth state in localStorage.
 */
export async function setupDemoClient(page: Page) {
  const authState = JSON.stringify({
    state: {
      user: {
        id: "e2e-client-001",
        email: null,
        phone: "+996700000001",
        name: "E2E Клиент",
        balance: 5000,
        status: "active",
        favoriteStations: [],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      owner: null,
      userType: "client",
      isAuthenticated: true,
    },
    version: 0,
  });
  await page.addInitScript((state: string) => {
    localStorage.setItem("auth-storage", state);
    localStorage.setItem("rp_onboarding_completed", "true");
    sessionStorage.setItem("demo_mode", "true");
    sessionStorage.setItem("demo_role", "client");
  }, authState);
}

/** Kept for backward compatibility */
export const setupDemoMode = setupDemoAdmin;
export const setupClientAuth = setupDemoClient;

/** Default timeout for navigation waits */
export const NAV_TIMEOUT = 15_000;
