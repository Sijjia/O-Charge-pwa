# Demo Data Fix Implementation Guide

**Priority**: CRITICAL
**Estimated Time**: 3-4 hours
**Files to Modify**: 7 files
**Review Checklist**: Included

---

## Overview

This guide provides step-by-step instructions to fix demo data issues across the Red Petroleum PWA application. The main problems are:

1. **Partner sees all 35 stations** (should see 12)
2. **Partner sees all 34 sessions** (should see filtered sessions)
3. **Owner city filtering not verified**
4. **Admin pages missing demo data**
5. **Corporate/Guest/Client pages missing demo data**

---

## CRITICAL FIX #1: Partner Stations Filtering

### File: `/mnt/d/Projects/RedPetroleum/pwa-rp/src/features/partner/hooks/usePartnerStations.ts`

**Problem**: Returns all 35 stations instead of filtering to partner's 12

**Current Code (Lines 37-41)**:
```typescript
queryFn: async (): Promise<DemoStation[]> => {
  if (isDemoModeActive()) {
    logger.debug("[usePartnerStations] Demo mode — returning mock data");
    return demoStations;  // ❌ RETURNS ALL 35
  }
```

**Fix**:
```typescript
queryFn: async (): Promise<DemoStation[]> => {
  if (isDemoModeActive()) {
    logger.debug("[usePartnerStations] Demo mode — returning partner's 12 stations (st-001 to st-012)");
    // Partner "АО Бишкек Электро" has 12 stations across 3 cities:
    // - 5 in Bishkek (st-001 to st-005)
    // - 4 in Osh (st-021 to st-024)
    // - 3 in Naryn (st-029 to st-031)
    const partnerStationIds = [
      "st-001", "st-002", "st-003", "st-004", "st-005",  // Bishkek
      "st-021", "st-022", "st-023", "st-024",            // Osh
      "st-029", "st-030", "st-031"                       // Naryn
    ];
    return demoStations.filter(s => partnerStationIds.includes(s.id));
  }
```

**Test**:
```bash
# In browser DevTools:
# 1. Enable demo mode
# 2. Go to /partner/stations
# 3. Should show ONLY 12 stations (not 35)
# 4. Verify mix of Bishkek, Osh, Naryn
```

---

## CRITICAL FIX #2: Partner Sessions Filtering

### File: `/mnt/d/Projects/RedPetroleum/pwa-rp/src/features/partner/hooks/usePartnerSessions.ts`

**Problem**: Returns all 34 sessions instead of filtering to partner's sessions

**Current Code (Lines 46-58)**:
```typescript
queryFn: async (): Promise<{ sessions: DemoSession[]; total: number }> => {
  if (isDemoModeActive()) {
    logger.debug("[usePartnerSessions] Demo mode — returning mock data");
    let filtered = demoSessions;  // ❌ ALL SESSIONS
    if (stationId) {
      filtered = filtered.filter((s) => s.station_id === stationId);
    }
    const perPage = 10;
    const start = (page - 1) * perPage;
    return {
      sessions: filtered.slice(start, start + perPage),
      total: filtered.length,
    };
  }
```

**Fix**:
```typescript
queryFn: async (): Promise<{ sessions: DemoSession[]; total: number }> => {
  if (isDemoModeActive()) {
    logger.debug("[usePartnerSessions] Demo mode — filtering to partner's stations");
    // Partner's 12 station IDs
    const partnerStationIds = new Set([
      "st-001", "st-002", "st-003", "st-004", "st-005",  // Bishkek
      "st-021", "st-022", "st-023", "st-024",            // Osh
      "st-029", "st-030", "st-031"                       // Naryn
    ]);

    // Filter sessions to partner's stations only
    let filtered = demoSessions.filter(s =>
      partnerStationIds.has(s.station_id)
    );

    if (stationId) {
      filtered = filtered.filter((s) => s.station_id === stationId);
    }
    const perPage = 10;
    const start = (page - 1) * perPage;
    return {
      sessions: filtered.slice(start, start + perPage),
      total: filtered.length,
    };
  }
```

**Test**:
```bash
# In browser DevTools:
# 1. Enable demo mode
# 2. Go to /partner/sessions
# 3. Should show ~10-12 sessions (not all 34)
# 4. Verify station_ids are in partner's list
# 5. Check revenue: should be 80% of session amount
```

---

## HIGH PRIORITY FIX #3: Admin Pages Demo Data

### Files to Update:
1. `AdminAnalyticsPage.tsx`
2. `AdminStationsPage.tsx`
3. `AdminClientsPage.tsx`
4. `AdminPartnersPage.tsx`

### Example Fix for AdminAnalyticsPage:

**Location**: `/mnt/d/Projects/RedPetroleum/pwa-rp/src/pages/admin/AdminAnalyticsPage.tsx`

**Add at top**:
```typescript
import { isDemoModeActive } from '@/shared/demo/useDemoMode';
import { DEMO_ANALYTICS_OVERVIEW } from '@/shared/demo/demoData';
```

**In useQuery**:
```typescript
queryFn: () => {
  if (isDemoModeActive()) {
    return Promise.resolve({ success: true, data: DEMO_ANALYTICS_OVERVIEW });
  }
  return fetchJson(
    '/api/v1/admin/analytics/overview',
    { method: 'GET' },
    AnalyticsSchema
  );
}
```

---

## MEDIUM PRIORITY FIX #4: Owner City Filtering

### File: `/mnt/d/Projects/RedPetroleum/pwa-rp/src/features/owner/hooks/useOwnerStats.ts`

**Action Required**: Audit to verify city filtering is working

**Check Points**:
1. Owner dashboard shows only their city's stats
2. useLocations returns only owner's city stations
3. Revenue breakdown matches city distribution

**Verification Code**:
```typescript
// Should filter by owner's city
const stats = ownerStats.filter(s => s.city === ownerCity);

// Should NOT return all 35 stations
// Should return only 20 (Bishkek) or 8 (Osh) or 7 (Naryn)
```

---

## MEDIUM PRIORITY FIX #5: Corporate Demo Data

### Files to Create/Update:
1. Add corporate demo data to `demoData.ts`
2. Update `CorporateDashboardPage.tsx`
3. Update `CorporateEmployeesPage.tsx`

**Add to demoData.ts**:
```typescript
export const demoCorporateDashboard = {
  company: {
    name: "ООО ТехСервис",
    billing_type: "postpaid",
    balance: 150000,
    credit_limit: 500000,
  },
  current_month: {
    spent: 85000,
    limit: 200000,
    remaining: 115000,
  },
  employees: {
    total: 12,
    active_today: 8,
  },
  recent_transactions: [
    {
      amount: 5000,
      type: "charge",
      description: "Зарядка Volkswagen ID.4",
      created_at: new Date().toISOString(),
      employee_name: "Марат Сейталиев",
    },
    // ... more transactions
  ],
};
```

**Update CorporateDashboardPage.tsx**:
```typescript
import { isDemoModeActive } from '@/shared/demo/useDemoMode';
import { demoCorporateDashboard } from '@/shared/demo/demoData';

// In useQuery:
queryFn: () => {
  if (isDemoModeActive()) {
    return Promise.resolve({ success: true, data: demoCorporateDashboard });
  }
  return fetchJson(...);
}
```

---

## LOW PRIORITY FIX #6: Guest Demo Data

### Files to Update:
1. `GuestLandingPage.tsx`
2. Add guest demo station data

**Action**:
```typescript
// In GuestLandingPage, use demo station for SIM-TEST
if (isDemoModeActive() && stationCode === "SIM-TEST") {
  setStation({
    name: "Станция Demo",
    address: "ул. Киевская 148, Бишкек",
    connectorType: "CCS2",
    powerKw: 60,
    available: true,
  });
}
```

---

## VERIFICATION CHECKLIST

After implementing all fixes, verify:

### Partner Role
- [ ] `/partner/stations` shows 12 stations (not 35)
- [ ] Station list includes mix of Bishkek, Osh, Naryn
- [ ] `/partner/sessions` shows filtered sessions
- [ ] Revenue calculations show 80% of session amounts
- [ ] Dashboard KPIs match filtered data

### Admin Role
- [ ] `/admin/dashboard` shows 35 stations total
- [ ] `/admin/analytics` displays demo analytics
- [ ] `/admin/clients` shows demo client list
- [ ] `/admin/partners` shows demo partner list
- [ ] All pages handle demo mode gracefully

### Owner Role
- [ ] `/owner/dashboard` shows city-specific stats
- [ ] `/owner/stations` shows only owner's city stations
- [ ] Revenue breakdown correct for city
- [ ] No stations from other regions visible

### Demo Mode Toggle
- [ ] `/sandbox` demo mode toggle works
- [ ] Demo data loads when enabled
- [ ] Real API data loads when disabled
- [ ] No console errors in either mode

---

## Testing Steps

### 1. Enable Demo Mode
```typescript
// In browser console at /sandbox:
localStorage.setItem('STRESS_TEST_MODE', 'true');
```

### 2. Test Partner Flow
```
1. Go to /partner/dashboard
2. Verify: 12 stations shown
3. Go to /partner/stations
4. Count stations: should be 12, not 35
5. Go to /partner/sessions
6. Verify stations match partner's list
```

### 3. Test Admin Flow
```
1. Go to /admin/dashboard
2. Verify: 35 stations total
3. Go to /admin/analytics
4. Check revenue numbers match screenshot
5. Go to /admin/clients
6. Verify demo client list appears
```

### 4. Test Owner Flow
```
1. Go to /owner/dashboard
2. Verify: 20 stations (Bishkek only)
3. Check revenue is ~57% of system total
4. Go to /owner/stations
5. All should be in Bishkek
```

---

## Code Review Checklist

Before committing:
- [ ] No hardcoded "st-001" to "st-035" outside demoData.ts
- [ ] Partner filtering uses defined station IDs
- [ ] All demo interceptions check `isDemoModeActive()`
- [ ] No console.log() left in code
- [ ] TypeScript strict mode passes
- [ ] All tests pass: `npm test`
- [ ] No API calls made when demo mode enabled
- [ ] Proper fallback to demo data on API errors

---

## Implementation Order (Recommended)

1. **Fix #1**: Partner stations (30 min) - Critical
2. **Fix #2**: Partner sessions (30 min) - Critical
3. **Verify**: Owner city filtering (30 min) - High
4. **Fix #3**: Admin pages demo data (60 min) - High
5. **Fix #4**: Corporate demo data (90 min) - Medium
6. **Fix #5**: Guest demo data (60 min) - Low

**Total**: 4-5 hours

---

## Git Commit Message Template

```
fix: complete demo data implementation across all roles

- Fix partner stations/sessions filtering (show 12 not 35)
- Add demo interception to admin pages
- Verify owner city filtering
- Add corporate demo data
- Add guest demo data
- Update demo data audit report

Fixes critical data visibility issues where users saw
all 35 stations instead of their role-filtered view.
```

---

## Questions?

Refer back to the DEMO_DATA_AUDIT_REPORT.md for detailed analysis of each page and role.

Last updated: 2026-02-28
