# API Contract Analysis - Frontend vs Backend

> **Дата:** 2025-11-26
>
> **Статус:** ✅ ИСПРАВЛЕНО
>
> **Цель:** Раз и навсегда зафиксировать что ожидает фронтенд и что возвращает бэкенд

---

## КРИТИЧЕСКИЕ РАСХОЖДЕНИЯ

### 1. GET /api/v1/profile и GET /api/v1/auth/me

#### Frontend ожидает (authService.ts:251-266, 354-372, 595-613):

```typescript
// Zod schema в authService.ts
z.object({
  success: z.boolean(),
  data: z
    .object({
      id: z.string(), // ← id, НЕ client_id
      email: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      name: z.string().optional().nullable(),
      status: z.string().optional().nullable(),
      balance: z.number().optional().nullable(),
    })
    .or(z.any()),
}).passthrough();

// Парсинг:
const d = (prof as { data?: Record<string, unknown> }).data || {};
const client = {
  id: String(d["id"] || ""), // ← Читает d["id"]
  email: String(d["email"] || ""),
  // ...
};
```

#### Backend возвращает (по словам Backend Agent):

```json
{
  "success": true,
  "client_id": "uuid", // ← client_id, НЕ id, НЕ в data wrapper
  "email": "...",
  "phone": "...",
  "name": "...",
  "balance": 1500.0,
  "status": "active"
}
```

#### ПРОБЛЕМА:

1. Frontend ожидает `{ data: { id: "..." } }`
2. Backend возвращает `{ client_id: "..." }` (без data wrapper, другое имя поля)
3. **Результат:** `d["id"]` === `undefined`, user.id пустая строка

---

### 2. Баланс: evpowerApi.getBalance()

#### Frontend реализация (evpowerApi.ts:662-677):

```typescript
async getBalance(): Promise<number> {
  const client_id = await this.getClientId();  // ← Использует Supabase Auth!

  const { data, error } = await supabase
    .from("clients")
    .select("balance")
    .eq("id", client_id)
    .single();
  // ...
}

// getClientId() (строки 139-147):
private async getClientId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();  // ← SUPABASE AUTH!
  if (!user) {
    throw new Error("User not authenticated");
  }
  return user.id;
}
```

#### ПРОБЛЕМА:

1. При cookie-auth (`VITE_AUTH_MODE=cookie`) Supabase session **не существует**
2. `supabase.auth.getUser()` возвращает `null`
3. `getClientId()` выбрасывает ошибку "User not authenticated"
4. `useBalance()` получает ошибку → возвращает `undefined` → ProfilePage показывает `0`

#### Решение (Backend Agent предложил):

Использовать `GET /api/v1/balance/get` который автоматически берёт client_id из cookie

---

### 3. Balance endpoint в endpoints.ts

#### Текущее (endpoints.ts:28-32):

```typescript
balance: {
  get: (clientId: string) => `/api/v1/balance/${clientId}`,  // ← Требует clientId в URL
  topupQR: "/api/v1/balance/topup-qr",
  topupCard: "/api/v1/balance/topup-card",
},
```

#### Backend предлагает:

```
GET /api/v1/balance/get   // ← Без clientId, берёт из cookie
```

#### Нужно добавить:

```typescript
balance: {
  current: "/api/v1/balance/get",  // ← Новый endpoint без clientId
  get: (clientId: string) => `/api/v1/balance/${clientId}`,
  // ...
},
```

---

## ВОПРОСЫ К BACKEND AGENT

### Вопрос 1: Формат ответа /profile

Ты написал что **откатил** изменения v1.4.5 (data wrapper). Но в `BACKEND_API_REFERENCE.md` написано:

> **v1.4.5:** Формат ответа профиля изменён: данные теперь в обёртке `data`, поле `client_id` → `id`

**Что сейчас актуально?** Какой формат возвращает бэкенд ПРЯМО СЕЙЧАС?

Вариант A (откачено):

```json
{ "success": true, "client_id": "uuid", "email": "...", ... }
```

Вариант B (v1.4.5):

```json
{ "success": true, "data": { "id": "uuid", "email": "...", ... } }
```

---

### Вопрос 2: GET /api/v1/balance/get

Ты упоминал endpoint `GET /api/v1/balance/get` который автоматически берёт client_id из cookie.

1. Этот endpoint существует и работает?
2. Какой формат ответа?

Ожидаемый формат (по BACKEND_API_REFERENCE.md):

```json
{
  "client_id": "uuid",
  "balance": 1500.0,
  "currency": "KGS",
  "last_topup_at": "...",
  "total_spent": 850.0
}
```

Или с data wrapper?

```json
{
  "success": true,
  "data": {
    "balance": 1500.0,
    "currency": "KGS"
  }
}
```

---

### Вопрос 3: Cookie persistence

Ты написал что cookies устанавливаются с правильными параметрами:

| Cookie      | max_age     | Domain      |
| ----------- | ----------- | ----------- |
| evp_access  | 600 (10м)   | .redp.asystem.kg |
| evp_refresh | 604800 (7д) | .redp.asystem.kg |

Но на скриншотах видно что после reload страницы `evp_access` отсутствует.

Возможные причины:

1. max_age не устанавливается (session cookie)
2. Domain не `.redp.asystem.kg`
3. Path не `/`

**Можешь проверить в коде бэкенда как именно устанавливаются cookies?**

---

### Вопрос 4: GET /api/v1/balance/current vs /api/v1/balance/get

В BACKEND_API_REFERENCE.md указан endpoint:

```
GET /api/v1/balance/current
```

Но ты упоминаешь:

```
GET /api/v1/balance/get
```

**Какой из них правильный? Или оба работают?**

---

## ПЛАН ДЕЙСТВИЙ (после ответов от Backend)

### Если Backend возвращает `{ client_id: ... }` (без data wrapper):

Frontend адаптируется:

```typescript
// authService.ts - изменить парсинг:
const prof = await fetchJson("/api/v1/profile", ...);
const d = prof as Record<string, unknown>;
const client = {
  id: String(d["client_id"] || d["id"] || ""),  // Поддержка обоих форматов
  email: String(d["email"] || ""),
  // ...
};
```

### Если Backend возвращает `{ data: { id: ... } }` (v1.4.5):

Frontend уже готов, ничего менять не нужно.

### Для баланса:

1. Добавить endpoint `balance.current` в endpoints.ts
2. Переписать `evpowerApi.getBalance()` использовать backend API вместо Supabase
3. Или передавать userId из useAuthStore в balanceService

---

## ФАЙЛЫ ИСПРАВЛЕНЫ

| Файл                                        | Изменение                                         | Статус        |
| ------------------------------------------- | ------------------------------------------------- | ------------- |
| `src/features/auth/services/authService.ts` | Парсинг `client_id` вместо `data.id`              | ✅ Исправлено |
| `src/services/evpowerApi.ts`                | `getBalance()` → использует `/api/v1/balance/get` | ✅ Исправлено |
| `src/api/endpoints.ts`                      | Добавлен `balance.current`                        | ✅ Исправлено |
| `docs/BACKEND_API_REFERENCE.md`             | Обновлено до v1.4.4, исправлен формат             | ✅ Исправлено |

---

## ТЕКУЩИЙ FLOW (с проблемами)

```
┌──────────────────────────────────────────────────────────────────┐
│ LOGIN FLOW                                                        │
├──────────────────────────────────────────────────────────────────┤
│ 1. authService.signInWithEmail()                                  │
│    ├─ GET /auth/csrf → получаем XSRF-TOKEN cookie                │
│    ├─ POST /auth/login { email, password }                        │
│    │   → evp_access cookie (10 min)                              │
│    │   → evp_refresh cookie (7 days)                             │
│    └─ GET /profile → ❌ ПРОБЛЕМА: ожидаем { data: { id } }       │
│                       получаем { client_id }                      │
│                                                                   │
│ 2. ProfilePage renders                                            │
│    ├─ user.name ← ✅ работает (name в ответе есть)               │
│    └─ useBalance() → ❌ ПРОБЛЕМА: использует Supabase Auth       │
│                       при cookie-auth Supabase session = null     │
│                       → getClientId() throws                      │
│                       → balance = 0                               │
├──────────────────────────────────────────────────────────────────┤
│ PAGE RELOAD                                                       │
├──────────────────────────────────────────────────────────────────┤
│ 1. App init → authService.getCurrentUser()                        │
│    └─ GET /profile → если evp_access истёк (10 min)              │
│       └─ 401 → attemptAuthRefresh()                               │
│           └─ POST /auth/refresh (без CSRF) → новые cookies        │
│           └─ retry GET /profile → получаем user                   │
│                                                                   │
│ ❓ ВОПРОС: Если evp_access cookie вообще не сохраняется           │
│           (session cookie без max_age), то каждый reload          │
│           требует refresh, что создаёт лишнюю нагрузку            │
└──────────────────────────────────────────────────────────────────┘
```

---

## ИТОГО

**3 критические проблемы:**

1. **Profile format mismatch** — Frontend ожидает `{ data: { id } }`, Backend возвращает `{ client_id }`
2. **Balance uses Supabase Auth** — При cookie-auth Supabase session отсутствует
3. **Cookie persistence unclear** — Нужно подтвердить что cookies имеют правильный max_age

**После ответов от Backend Agent** — реализуем fixes на фронте.
