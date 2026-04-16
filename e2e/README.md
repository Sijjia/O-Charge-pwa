# E2E Tests with Playwright

End-to-end tests for the Red Petroleum PWA organized by role and business process.

## Test Files

| File | Role | Tests | Coverage |
|------|------|-------|----------|
| **auth.spec.ts** | Public | 10 | Splash, phone auth, OTP, sandbox login flows |
| **admin.spec.ts** | Admin | 26 | All 22 admin pages + sidebar nav + API docs link + responsive |
| **admin-simulator.spec.ts** | Admin | 8 | Station simulator: connection, controls, CSRF, no-redirect |
| **partner.spec.ts** | Partner | 7 | Dashboard, stations, sessions, revenue, settings + sidebar |
| **owner.spec.ts** | Owner | 11 | Dashboard, stations, sessions, revenue, incidents, tariffs, logs, locations, corporate, operators, users |
| **client.spec.ts** | Client | 26 | Map, stations, charging flow, balance, payments, history, profile, settings, about, support, all error states |
| **guest.spec.ts** | Guest | 6 | Landing, phone, payment, QR, charging session, completion |
| **website.spec.ts** | Public | 9 | Home, map, tariffs, B2B, FAQ, contacts, download, nav, 404 |

**Total: 103 tests across all roles**

## Auth Helpers

Shared helpers in `helpers/auth.ts`:
- `setupDemoAdmin(page)` — Seeds admin auth state + demo mode
- `setupDemoPartner(page)` — Seeds partner auth state + demo mode
- `setupDemoOwner(page)` — Seeds owner/operator auth state + demo mode
- `setupDemoClient(page)` — Seeds client auth state + demo mode

## Running Tests

```bash
# Install Playwright browsers (first time)
npx playwright install chromium

# Run all tests (local dev server on port 3000)
npx playwright test --config playwright.local.config.ts

# Run specific role tests
npx playwright test --config playwright.local.config.ts e2e/admin.spec.ts
npx playwright test --config playwright.local.config.ts e2e/partner.spec.ts

# Run in headed mode (see browser)
npx playwright test --config playwright.local.config.ts --headed

# Run in debug mode
npx playwright test --config playwright.local.config.ts --debug

# View test report
npx playwright show-report
```

## Configuration

- **Local config** (`playwright.local.config.ts`): Port 3000, Chromium only, no retries
- **CI config** (`playwright.config.ts`): Port 5173, all browsers + mobile, 2 retries

## Architecture

Tests use demo mode auth (sessionStorage + localStorage) to bypass real API calls.
Protected routes (Admin/Partner/Owner) auto-login when `demo_mode=true` is set.
