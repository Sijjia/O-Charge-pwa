# Миграция на Cookie‑based Auth + CSRF

> **Статус:** ✅ Реализовано (Frontend + Backend v1.4.5)
>
> **Последнее обновление:** 2025-12-20
>
> **Backend версия:** v1.4.5
>
> **Цель:** Заменить хранение токенов в `localStorage` на безопасные HttpOnly cookies с CSRF‑защитой.
>
> **v1.4.5:** Единая WhatsApp OTP авторизация для clients И owners (admin/operator).

---

## Unified Auth Flow (v1.4.5)

### Единая авторизация для всех пользователей

С версии 1.4.5 используется **единая форма авторизации** через WhatsApp OTP для всех типов пользователей:

1. **Clients** - обычные пользователи (зарядка, баланс)
2. **Owners** - владельцы станций:
   - `operator` - видит станции своего admin
   - `admin` - управляет своими станциями и операторами
   - `superadmin` - полный доступ

### Hybrid User Approach

При авторизации owner автоматически получает client-функционал:

- Баланс в приложении
- Возможность заряжать автомобиль
- История зарядок

Backend автоматически создаёт запись в таблице `clients` для owners при первом входе.

### OTP Verify Response

**Для clients:**

```json
{ "success": true, "user_type": "client", "user_id": "uuid" }
```

**Для owners:**

```json
{
  "success": true,
  "user_type": "owner",
  "user_id": "uuid",
  "role": "admin",
  "admin_id": null
}
```

### Frontend Flow

1. `PhoneAuthForm` отправляет OTP
2. При `user_type: "owner"` вызывается `loginAsOwner()` из `unifiedAuthStore`
3. ProfilePage показывает кнопку "Dashboard" для owners
4. Redirect в `/owner/dashboard` для owners

---

## Архитектура

### Backend (реализовано)

| Endpoint               | Метод | Описание                                                  | CSRF   |
| ---------------------- | ----- | --------------------------------------------------------- | ------ |
| `/api/v1/auth/csrf`    | GET   | Выдает CSRF‑токен (cookie + body)                         | —      |
| `/api/v1/auth/cierra`  | GET   | Алиас для `/csrf`                                         | —      |
| `/api/v1/auth/login`   | POST  | Логин, устанавливает `evp_access` и `evp_refresh` cookies | ✅ Да  |
| `/api/v1/auth/refresh` | POST  | Ротация токенов через HttpOnly refresh cookie             | ❌ Нет |
| `/api/v1/auth/logout`  | POST  | Очистка cookies                                           | ❌ Нет |
| `/api/v1/profile`      | GET   | Получение профиля пользователя                            | —      |
| `/api/v1/auth/me`      | GET   | Алиас для `/profile` (скоро)                              | —      |

> **v1.4.4:** `/auth/refresh` и `/auth/logout` исключены из CSRF проверки в `SecurityMiddleware`.
>
> **v1.4.5:** Исправлен `SameSite` для cookies в `/auth/refresh` — теперь оба токена (`evp_access`, `evp_refresh`) устанавливаются с `SameSite=None` для корректной работы cross-subdomain запросов.

### Cookies

| Cookie        | HttpOnly | Secure | SameSite | TTL    |
| ------------- | -------- | ------ | -------- | ------ |
| `evp_access`  | ✅       | ✅     | None     | 10 мин |
| `evp_refresh` | ✅       | ✅     | None     | 7 дней |
| `XSRF-TOKEN`  | ❌       | ✅     | None     | 1 час  |

### Frontend (реализовано)

- **API клиент:** `credentials: 'include'` во всех запросах
- **CSRF:** Автоматическая отправка `X-CSRF-Token` для POST/PUT/DELETE
- **Auth refresh:** При 401 → автоматический retry через `/auth/refresh`
- **Флаги:**
  - `VITE_AUTH_MODE=cookie` — cookie-based auth
  - `VITE_ENABLE_CSRF=true` — явное включение CSRF (в production включено по умолчанию)

---

## Файлы реализации

| Файл                                        | Назначение                                                     |
| ------------------------------------------- | -------------------------------------------------------------- |
| `src/shared/security/csrf.ts`               | CSRF utilities (getCsrfToken, isCsrfEnabled, shouldAttachCsrf) |
| `src/api/unifiedClient.ts`                  | HTTP клиент с автоматическим CSRF                              |
| `src/api/authRefresh.ts`                    | Refresh token logic                                            |
| `src/api/endpoints.ts`                      | API endpoints константы                                        |
| `src/features/auth/services/authService.ts` | Auth service (login/logout/profile)                            |
| `src/pages/AuthDebugPage.tsx`               | Debug страница для тестирования                                |

---

## Чеклист реализации

### Backend (v1.4.5)

- [x] Endpoint `/auth/csrf` (+ алиас `/auth/cierra`)
- [x] Endpoint `/auth/login` с установкой cookies
- [x] Endpoint `/auth/refresh` (без CSRF, SameSite=None) ✅
- [x] Endpoint `/auth/logout` (без CSRF) ✅
- [x] Endpoint `/profile` (включает balance)
- [ ] Endpoint `/auth/me` (алиас для profile)
- [x] ~~Endpoint `/balance/get`~~ — удалён, баланс берётся из `/profile`
- [x] CSRF проверка в SecurityMiddleware
- [x] CSRF исключения (`CSRF_EXEMPT_PATHS`) для refresh/logout ✅
- [x] SameSite=None для всех auth cookies (cross-subdomain) ✅

### Frontend

- [x] `credentials: 'include'` во всех запросах (`unifiedClient.ts`)
- [x] CSRF token автоматически в мутирующих запросах (кроме refresh/logout)
- [x] Auth refresh при 401 (`authRefresh.ts`)
- [x] Cookie auth mode в `authService.ts`
- [x] Endpoint `/auth/logout` (исправлено с `/signout`)
- [x] Debug страница с CSRF (`AuthDebugPage.tsx`)
- [x] Trusted origins для CSRF (`csrf.ts`)
- [x] Включить `VITE_ENABLE_AUTH_REFRESH=true` в production ✅
- [ ] E2E тестирование на production

---

## Тест-кейсы

| Тест                            | Ожидаемый результат                  | Статус     |
| ------------------------------- | ------------------------------------ | ---------- |
| Login с правильными credentials | cookies установлены, profile получен | 🔄 Ожидает |
| Login без CSRF токена           | 401 csrf_error                       | 🔄 Ожидает |
| Мутация без X-CSRF-Token        | 403 csrf_failed                      | 🔄 Ожидает |
| Мутация с X-CSRF-Token          | 200 OK                               | 🔄 Ожидает |
| Просроченный access token       | 401 → refresh → retry успешен        | 🔄 Ожидает |
| Просроченный refresh token      | redirect to /login                   | 🔄 Ожидает |
| Logout                          | cookies очищены                      | 🔄 Ожидает |
| **Перезагрузка страницы**       | **сессия сохраняется (v1.4.5)**      | 🔄 Ожидает |

---

## Environment Variables

```bash
# Production
VITE_API_URL=https://ocpp.redp.asystem.kg
VITE_AUTH_MODE=cookie
VITE_ENABLE_CSRF=true
VITE_ENABLE_AUTH_REFRESH=true

# Development
VITE_API_URL=http://localhost:9210
VITE_AUTH_MODE=cookie
VITE_ENABLE_CSRF=true
VITE_ENABLE_AUTH_DEBUG=true
```

---

## Troubleshooting

### CSRF error при логине

```
{ "success": false, "error": "csrf_error", "message": "Invalid CSRF token" }
```

**Причины:**

1. Не отправлен заголовок `X-CSRF-Token`
2. Cookie `XSRF-TOKEN` отсутствует
3. Заголовок и cookie не совпадают

**Решение:**

1. Перед login вызвать `GET /auth/csrf`
2. Прочитать cookie: `getCsrfToken()` из `csrf.ts`
3. Отправить в заголовке: `X-CSRF-Token: <token>`

### Cookies не сохраняются на localhost

**Причина:** `SameSite=None; Secure` требует HTTPS.

**Решение (ждём от backend):**
Backend добавит автоматический `SameSite=Lax` для localhost origins.

---

## Автоматический Refresh при 401 (v1.4.4)

После исправления на бэкенде, автоматический refresh работает:

```typescript
// Refresh НЕ требует X-CSRF-Token заголовка
const response = await fetch("https://ocpp.redp.asystem.kg/api/v1/auth/refresh", {
  method: "POST",
  credentials: "include", // Только cookies
  // НЕ нужен X-CSRF-Token!
});
```

**Логика в `authRefresh.ts`:**

1. При получении 401 на GET запрос
2. Если `VITE_ENABLE_AUTH_REFRESH=true`
3. Выполняется `POST /auth/refresh` (без CSRF)
4. При успехе — повтор оригинального запроса
5. При неудаче — редирект на логин

---

## Контакты

- **Frontend:** Этот документ
- **Backend:** Backend Agent
- **Версия API:** v1.4.4

---

_Документ обновлён 2025-11-26 после исправления CSRF для refresh/logout на бэкенде._
