# Plan: Full Bug Fix Pass — All Issues Top-to-Bottom

## Context
During live VPS testing, a full audit uncovered 16 issues across frontend and backend. User requested fixing everything top-to-bottom by priority.

---

## Fix 1: Push Notifications — DB table missing (CRITICAL)
**Problem:** Backend code references `push_subscriptions` table but it doesn't exist in schema.
**Fix:** Add CREATE TABLE to `000_base_schema_local.sql` and run on VPS DB.

**File:** `ocpp-rp/backend/sql/000_base_schema_local.sql` — add at end:
```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    user_type VARCHAR NOT NULL CHECK (user_type IN ('client', 'owner')),
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    UNIQUE(user_id, user_type, endpoint)
);
```
Then execute on VPS Supabase DB.

---

## Fix 2: NotificationSettingsPage — dark mode broken (CRITICAL)
**Problem:** Hardcoded `bg-zinc-800`, `bg-zinc-900` — no light mode support.
**Fix:** Update to match `SettingsPage.tsx` pattern with `dark:` prefixes.

**File:** `pwa-rp/src/pages/NotificationSettingsPage.tsx`
- `bg-zinc-800` → `bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 transition-colors duration-300`
- Header `bg-zinc-900` → `bg-white/80 dark:bg-[#0A0E17]/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5`
- Content `bg-zinc-900` → `bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl`
- Info text `text-gray-400` → `text-zinc-400 dark:text-zinc-500`
- Back button hover `hover:bg-zinc-800` → `hover:bg-zinc-100 dark:hover:bg-zinc-800`

---

## Fix 3: Balance ownership check — optional bypass (MAJOR)
**Problem:** Line 22: `if auth_client_id and auth_client_id != client_id` — skips check if auth_client_id is None.
**Fix:** Make check mandatory.

**File:** `ocpp-rp/backend/app/api/v1/balance/balance.py` lines 20-23:
```python
auth_client_id = getattr(request.state, "client_id", None)
if not auth_client_id or auth_client_id != client_id:
    raise HTTPException(status_code=403, detail="Доступ запрещён")
```

---

## Fix 4: Guest stop — phone ownership bypass (MAJOR)
**Problem:** Line 209: `if phone and row[1] != phone` — if phone is None, ownership check skipped.
**Fix:** Make phone mandatory for stop.

**File:** `ocpp-rp/backend/app/api/v1/guest/service.py` line 209:
```python
if not phone or row[1] != phone:
```

---

## Fix 5: History — add max_power from OCPP data (MAJOR)
**Problem:** Frontend uses `averagePower` as `maxPower` (TODO in code). Backend doesn't return max_power.
**Fix:** Add subquery to history endpoint to get MAX(power_active_import) from ocpp_meter_values.

**File:** `ocpp-rp/backend/app/api/v1/history/__init__.py` — in SELECT query add:
```sql
(SELECT MAX(mv.power_active_import)
 FROM ocpp_meter_values mv
 JOIN ocpp_transactions ot ON mv.ocpp_transaction_id = ot.id
 WHERE ot.charging_session_id = cs.id) as max_power_kw
```
Add `max_power_kw` to response dict.

**File:** `pwa-rp/src/features/history/hooks/useChargingHistory.ts` line 137:
- Use `item.max_power_kw` from API response instead of calculated averagePower.

---

## Fix 6: Email auth redirect (MAJOR)
**Problem:** `emailRedirectTo` commented out with TODO.
**Fix:** Uncomment and set to `window.location.origin + '/auth/callback'`.

**File:** `pwa-rp/src/features/auth/services/authService.ts` — uncomment emailRedirectTo line.

---

## Fix 7: Booking — add conflict detection for same connector (MAJOR)
**Problem:** No check if connector already has an active booking from another user.
**Fix:** Already partially handled — booking checks connector status = 'available' and sets to 'reserved'. But need to also check bookings table for active booking on same connector.

**File:** `ocpp-rp/backend/app/services/booking_service.py` — add before INSERT:
```python
existing_booking = self.db.execute(text("""
    SELECT id FROM bookings
    WHERE station_id = :station_id AND connector_id = :connector_id AND status = 'active'
"""), {"station_id": station_id, "connector_id": connector_id}).fetchone()

if existing_booking:
    return {"success": False, "error": "connector_already_booked", "message": "Коннектор уже забронирован"}
```

---

## Scope Exclusions (not fixing now)
- **Corporate auth (sessionStorage)** — corporate panel is admin-level, low priority, not user-facing
- **Admin sessions role filtering** — admin already checks role, sessions visible to admins only
- **Error response format standardization** — large refactor, no user-facing impact
- **Rate limiting** — needs Redis infra work, not a bug
- **FCM mobile push** — legacy stubs for future native app, not PWA scope
- **OBANK webhook** — blocked on external credentials, not a code bug

---

## Deploy Steps
1. Build frontend: `npm run build` in pwa-rp/
2. Rsync dist/ to VPS: `/root/pwa-rp/dist/`
3. SCP backend files to VPS: `/root/ocpp-rp/backend/`
4. Run SQL migration on VPS DB for push_subscriptions table
5. Restart uvicorn on VPS

## Verification
- Open NotificationSettingsPage in light mode — should look correct
- Subscribe to push notifications — should work (table exists)
- Check `/api/v1/balance/{wrong_client_id}` without auth — should 403
- Check history response has `max_power_kw` field
- Create booking on occupied connector — should fail with "already booked"
