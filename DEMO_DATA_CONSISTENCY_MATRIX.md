# Demo Data Consistency Matrix

**Generated**: 2026-02-28
**Purpose**: Visual mapping of which demo data each page uses and what's missing

---

## 1. COMPLETE DEMO DATA FLOW MATRIX

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              DEMO DATA MAPPING                                   │
└──────────────────────────────────────────────────────────────────────────────────┘

ADMIN/SYSTEM ROLE (27 stations total, 35 visible)
├── Pages with Demo Support
│   ├── ✅ AdminDashboardPage
│   │   ├── Demo Data: demoOwnerSessions.slice(0, 5)
│   │   ├── Stations Shown: 35 (all)
│   │   ├── Sessions Shown: 34
│   │   └── File: /pages/admin/AdminDashboardPage.tsx:81
│   │
│   ├── ✅ AdminLogsPage
│   │   ├── Demo Data: OCPP logs
│   │   └── File: /pages/admin/AdminLogsPage.tsx
│   │
│   └── ✅ AdminStationTerminalPage
│       ├── Demo Data: demoStations
│       └── File: /pages/admin/AdminStationTerminalPage.tsx
│
└── Pages WITHOUT Demo Support (Need to Add)
    ├── ❌ AdminAnalyticsPage
    │   ├── Current: API only
    │   ├── Should Use: DEMO_ANALYTICS_OVERVIEW
    │   └── Priority: HIGH
    │
    ├── ❌ AdminStationsPage
    │   ├── Current: API only
    │   ├── Should Use: demoStations (filtered by city)
    │   └── Priority: HIGH
    │
    ├── ❌ AdminClientsPage
    │   ├── Current: API only
    │   ├── Should Use: DEMO_CLIENTS
    │   └── Priority: HIGH
    │
    ├── ❌ AdminPartnersPage
    │   ├── Current: API only
    │   ├── Should Use: DEMO_PARTNERS
    │   └── Priority: HIGH
    │
    └── ❌ AdminAlertsPage
        ├── Current: API only
        ├── Should Use: DEMO_ALERTS
        └── Priority: MEDIUM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OWNER/REGIONAL OPERATOR ROLE (20 stations, 15 locations - Bishkek only)
├── Pages with Demo Support
│   ├── ✅ OwnerDashboardPage
│   │   ├── Demo Data: demoOwnerSessions.slice(0, 5)
│   │   ├── Issue: Should verify city filtering
│   │   ├── Stations Shown: 20 (Bishkek only)
│   │   └── File: /pages/owner/OwnerDashboardPage.tsx:77
│   │
│   └── ✅ OwnerSessionsPage
│       ├── Demo Data: demoOwnerSessions
│       ├── Issue: Should filter by owner's city
│       └── File: /pages/owner/OwnerSessionsPage.tsx
│
└── Pages WITHOUT Demo Support (Need Verification)
    ├── ⚠️ OwnerStationsPage
    │   ├── Current: API only (or useLocations)
    │   ├── Issue: Should show only owner's city
    │   └── Priority: MEDIUM (verify existing)
    │
    ├── ⚠️ OwnerLocationsListPage
    │   ├── Current: useLocations hook
    │   ├── Issue: Should filter by owner city
    │   └── Priority: MEDIUM (verify existing)
    │
    └── ❌ Other Owner Pages
        ├── OwnerTariffsPage (no demo)
        ├── OwnerUsersPage (no demo)
        ├── OwnerCorporateGroupsPage (no demo)
        └── Priority: LOW

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PARTNER/OPERATOR COMPANY ROLE (12 stations, 8 locations across 3 cities)
├── Pages with Demo Support
│   ├── ✅ PartnerDashboardPage
│   │   ├── Demo Data: demoDashboard
│   │   ├── Stations Shown: 12 ✅ CORRECT
│   │   ├── Revenue Calculation: 80% of system ✅ CORRECT
│   │   └── File: /features/partner/hooks/usePartnerDashboard.ts:39
│   │
│   ├── ⚠️ PartnerRevenuePage
│   │   ├── Demo Data: generateRevenueData(period)
│   │   ├── Status: WORKING (generates revenue breakdown)
│   │   └── File: /features/partner/hooks/usePartnerRevenue.ts:34
│   │
│   ├── ❌ PartnerStationsPage (CRITICAL BUG)
│   │   ├── Demo Data: demoStations ← RETURNS ALL 35 ❌
│   │   ├── Expected: Only 12 partner stations
│   │   ├── Impact: Partner sees all company's stations
│   │   ├── Fix Priority: CRITICAL
│   │   └── File: /features/partner/hooks/usePartnerStations.ts:40
│   │
│   └── ❌ PartnerSessionsPage (CRITICAL BUG)
│       ├── Demo Data: demoSessions ← RETURNS ALL 34 ❌
│       ├── Expected: Only partner's sessions
│       ├── Impact: Partner sees all system revenue
│       ├── Fix Priority: CRITICAL
│       └── File: /features/partner/hooks/usePartnerSessions.ts:49

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CORPORATE EMPLOYEE ROLE (Company employees only)
└── Pages WITHOUT Demo Support (MAJOR GAP)
    ├── ❌ CorporateDashboardPage
    │   ├── Current: API direct call (no fallback)
    │   ├── Should Use: demoCorporateDashboard (needs creation)
    │   ├── Impact: Cannot test corporate flows
    │   └── Priority: MEDIUM
    │
    ├── ❌ CorporateEmployeesPage
    │   ├── Current: API direct call
    │   ├── Should Use: demoCorporateEmployees (needs creation)
    │   └── Priority: MEDIUM
    │
    └── ❌ CorporateReportsPage
        ├── Current: API direct call
        ├── Should Use: demoCorporateReports (needs creation)
        └── Priority: MEDIUM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GUEST ROLE (Unauthenticated, single station only)
└── Pages WITHOUT PROPER Demo Support (LIMITED)
    ├── ⚠️ GuestLandingPage
    │   ├── Current: Fallback generic data (not realistic demo)
    │   ├── Should Use: demoStations[0] with demo station data
    │   └── Priority: LOW
    │
    ├── ⚠️ GuestPaymentPage
    │   ├── Current: Fallback generic data
    │   ├── Should Use: demoCorporatePaymentMethods
    │   └── Priority: LOW
    │
    └── ⚠️ GuestChargingPage
        ├── Current: Fallback generic data
        ├── Should Use: demoGuestChargingSession
        └── Priority: LOW

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLIENT/AUTHENTICATED USER ROLE (All stations visible, personal data only)
└── Pages WITHOUT Demo Support (API FALLBACK ONLY)
    ├── ❌ MapHome
    │   ├── Current: API only (useLocations)
    │   ├── Issue: No demo mode check
    │   └── Priority: LOW (hard to demo without full session)
    │
    ├── ❌ Balance
    │   ├── Current: API only (useBalance)
    │   └── Priority: LOW
    │
    ├── ❌ ChargingProcessPage
    │   ├── Current: API only
    │   └── Priority: LOW
    │
    ├── ❌ HistoryPage
    │   ├── Current: API only (useChargingHistory)
    │   └── Priority: LOW
    │
    ├── ❌ PaymentsPage
    │   ├── Current: API only
    │   └── Priority: LOW
    │
    └── ❌ ProfilePage
        ├── Current: API only
        └── Priority: LOW

```

---

## 2. DATA FILTERING REQUIREMENTS BY ROLE

### ✅ Admin/System (No Filtering)
```
Visibility:
├── Stations: 35 ✅
├── Locations: 20 ✅
├── Sessions: ALL (34+) ✅
├── Clients: ALL ✅
├── Partners: ALL ✅
└── Revenue: TOTAL SYSTEM ✅

Status: COMPLETE
```

### ⚠️ Owner/Regional Operator (City Filtering)
```
Visibility by City (Example: Bishkek):
├── Stations: 20 (ONLY Bishkek) ← VERIFY FILTERING
├── Locations: 15 (ONLY Bishkek) ← VERIFY FILTERING
├── Sessions: Bishkek only (≈19 sessions) ← VERIFY
├── Clients: Bishkek residents only ← VERIFY
├── Partners: Operating in Bishkek ← VERIFY
└── Revenue: ~57% of system (Bishkek share) ← VERIFY

Status: PARTIALLY IMPLEMENTED (needs verification)

Distribution:
├── Bishkek: 20 stations (57% revenue)
├── Osh: 8 stations (22% revenue)
└── Naryn: 7 stations (21% revenue)
```

### ❌ Partner Company (Partner Filtering - BROKEN)
```
Current (WRONG):
├── Stations: 35 ❌ (shows ALL)
├── Sessions: 34 ❌ (shows ALL)
└── Revenue: 100% ❌ (not filtered to 80%)

Should Be (CORRECT):
├── Stations: 12 ✅
│   ├── 5 in Bishkek (st-001 to st-005)
│   ├── 4 in Osh (st-021 to st-024)
│   └── 3 in Naryn (st-029 to st-031)
├── Sessions: ~10-15 (filtered by partner's stations)
├── Revenue: 80% of system revenue ✅
├── Locations: 8 across cities
└── Employees: Partner's employees only

Status: CRITICAL BUGS (see fixes needed)

Partner Share Calculation:
└── For each session: revenue × 0.8 = partner_share
```

### ❌ Corporate Employee (Company Filtering - NO DEMO)
```
Current:
└── No demo data (API fallback only)

Should Show:
├── Company balance
├── Employees in company
├── Company's sessions/transactions
├── Monthly spending limit
└── Company billing type (prepaid/postpaid)

Status: NO DEMO DATA (needs implementation)
```

### ⚠️ Guest (Single Station + Session)
```
Current:
└── Generic fallback (not realistic)

Should Show:
├── One selected station (via QR)
├── Station specs
├── Available payment methods
├── Current charging session
└── Simple UI (no auth required)

Status: BASIC FALLBACK (could improve)
```

### ❌ Client/User (All Stations, Personal Data Only)
```
Current:
└── No demo data (API only)

Should Show:
├── All 35 stations on map
├── Personal balance
├── Personal session history
├── Personal favorites
└── User profile data

Status: NO DEMO DATA (needs implementation)
```

---

## 3. PRIORITY MATRIX

```
┌────────────────────────────────────────────────────────────────┐
│ PRIORITY GRID - What to Fix First                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ CRITICAL (Fix this week)                                      │
│ ├── Partner Stations Filtering (show 12 not 35)               │
│ ├── Partner Sessions Filtering (filter by partner)             │
│ └── Verify Owner city filtering                               │
│                                                                │
│ HIGH (Fix this sprint)                                        │
│ ├── Admin pages demo data (5 pages)                           │
│ ├── Verify partner revenue calculations                        │
│ └── Ensure no data leakage between roles                      │
│                                                                │
│ MEDIUM (Nice to have)                                         │
│ ├── Corporate demo data (3 pages)                             │
│ ├── Guest demo data (3 pages)                                 │
│ └── Create test scenarios per role                            │
│                                                                │
│ LOW (Future)                                                  │
│ ├── Client demo data (6 pages)                                │
│ ├── Advanced analytics demo                                   │
│ └── Stress test data generation                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 4. DATA DEPENDENCY GRAPH

```
demoData.ts
├── demoStations (35) ← BASE
│   ├── usePartnerStations ← ❌ NOT FILTERING
│   ├── useLocations → getLocationList()
│   ├── OwnerDashboard ← ⚠️ FILTERING UNCLEAR
│   └── AdminDashboard ✅
│
├── demoSessions (34) ← BASE
│   ├── usePartnerSessions ← ❌ NOT FILTERING
│   ├── AdminDashboard ✅
│   ├── OwnerDashboard ✅
│   └── PartnerRevenue (via generateRevenueData)
│
├── demoDashboard ← PARTNER SPECIFIC
│   ├── usePartnerDashboard ✅
│   └── Shows: stations=12, revenue=80%
│
├── demoOwnerStats ← OWNER SPECIFIC
│   └── useOwnerStats ← ⚠️ NEEDS VERIFICATION
│
├── demoAdminAnalytics ← ADMIN SPECIFIC
│   ├── DEMO_ANALYTICS_OVERVIEW
│   └── AdminAnalyticsPage ❌ NOT USING
│
├── DEMO_ALERTS, DEMO_CLIENTS, DEMO_PARTNERS
│   └── NOT CONNECTED TO ANY PAGES ❌
│
└── No Corporate/Guest/Client demo data ❌
```

---

## 5. STATION DISTRIBUTION TABLE

```
┌─────────────┬───────────┬──────────┬──────────┬──────────────────┐
│ City        │ Stations  │ Online   │ Offline  │ Partner's Owned  │
├─────────────┼───────────┼──────────┼──────────┼──────────────────┤
│ Bishkek     │ 20        │ 16       │ 4        │ 5 (st-001-005)   │
│ Osh         │ 8         │ 6        │ 2        │ 4 (st-021-024)   │
│ Naryn       │ 7         │ 5        │ 2        │ 3 (st-029-031)   │
├─────────────┼───────────┼──────────┼──────────┼──────────────────┤
│ TOTAL       │ 35        │ 27       │ 8        │ 12 (Partner's)   │
└─────────────┴───────────┴──────────┴──────────┴──────────────────┘

Admin sees: All 35
Owner (Bishkek) sees: 20 (Bishkek only)
Owner (Osh) sees: 8 (Osh only)
Owner (Naryn) sees: 7 (Naryn only)
Partner sees: 12 (their stations) ← CURRENTLY BROKEN
```

---

## 6. SESSION REVENUE FLOW

```
demoSessions = 34 sessions generated

Revenue Flow Example:
┌──────────────────────────────────────┐
│ Session: 5000 som (20 kWh charged)   │
├──────────────────────────────────────┤
│ System receives: 5000 som             │
│ Platform keeps: 20% = 1000 som        │
│ Partner receives: 80% = 4000 som      │
└──────────────────────────────────────┘

Admin sees: 5000 (all system revenue)
Partner sees: ❌ Currently 5000 (ALL sessions)
Partner should see: 4000 × (sessions for their 12 stations)

Total Daily Revenue Example:
└── If all 34 sessions @ ~4000 avg
    └── System: 136,000 som
        ├── Admin: sees 136,000
        ├── Partner: sees ❌ 136,000 (WRONG)
        │           should see ≈ 50,000 (their 80% cut)
        └── Owner (city %): sees their city's portion
```

---

## 7. IMPLEMENTATION CHECKLIST

### Phase 1: Critical Fixes (Do First)
- [ ] Fix `usePartnerStations` filtering
  - Stations shown: 12 (not 35)
- [ ] Fix `usePartnerSessions` filtering
  - Sessions shown: filtered to partner's only
- [ ] Verify Owner city filtering
  - Each owner region sees only their stations

### Phase 2: Admin Coverage (Do Second)
- [ ] AdminAnalyticsPage + DEMO_ANALYTICS_OVERVIEW
- [ ] AdminStationsPage + demoStations filtering
- [ ] AdminClientsPage + DEMO_CLIENTS
- [ ] AdminPartnersPage + DEMO_PARTNERS
- [ ] AdminAlertsPage + DEMO_ALERTS

### Phase 3: Corporate & Guest (Do Third)
- [ ] Create demoCorporateDashboard
- [ ] Update CorporateDashboardPage
- [ ] Update CorporateEmployeesPage
- [ ] Create demoGuest objects
- [ ] Update GuestLandingPage

### Phase 4: Verification
- [ ] Run test scenarios for each role
- [ ] Verify no data leakage
- [ ] Check revenue calculations
- [ ] Confirm TypeScript compilation
- [ ] Run unit tests

---

## 8. QUICK REFERENCE

| Component | Current | Should Be | Status |
|-----------|---------|-----------|--------|
| Partner Stations | 35 | 12 | ❌ BROKEN |
| Partner Sessions | 34 | ~10-15 | ❌ BROKEN |
| Partner Revenue | 100% | 80% | ⚠️ NEEDS CHECK |
| Owner (Bishkek) Stations | ? | 20 | ⚠️ VERIFY |
| Admin Dashboard | 35 stations | 35 stations | ✅ WORKS |
| Admin Analytics | API only | Needs demo | ❌ MISSING |
| Corporate Dashboard | API only | Needs demo | ❌ MISSING |
| Guest Pages | Fallback | Needs demo | ⚠️ LIMITED |

---

**Last Updated**: 2026-02-28
**Next Review**: After implementing critical fixes
