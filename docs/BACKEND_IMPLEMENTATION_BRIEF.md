# Backend Implementation Brief (для агента бэкенда)

Цель: довести фронт до production-ready, закрыв критичные эндпоинты и безопасность. Ниже — точные требования и контракты.

## 1) Аутентификация: cookie-based (HttpOnly)

- Cookies: `access` (короткий TTL 5–15 мин), `refresh` (rotation), `Secure`, `HttpOnly`, `SameSite=Lax/Strict`.
- CSRF:
  - Выдавать CSRF cookie (например, `XSRF-TOKEN`) и отдавать его значением в `/auth/csrf` (GET).
  - При мутациях фронт присылает `X-CSRF-Token` в заголовке.
- Эндпоинты:
  - `POST /api/v1/auth/login` → Set-Cookie `access`, `refresh`
  - `POST /api/v1/auth/refresh` → Set-Cookie новый `access` (+ ротация `refresh`)
  - `POST /api/v1/auth/logout` → инвалидация `refresh` и очистка cookies
  - `GET  /api/v1/auth/csrf` → { csrf_token } (опционально дублировать значение)
- CORS: разрешить фронтовый origin; включить `credentials=true`.
- Rate limiting: для login/refresh.

Примечание фронта:

- Включение cookie-режима управляется флагом `VITE_AUTH_MODE=cookie`.
- В режиме cookie фронт не отправляет Authorization: Bearer; всегда `credentials: 'include'`.

## 2) Notifications (Web Push, v1.3.0)

- `GET  /api/v1/notifications/vapid-public-key` → `{ success, data: { public_key } }`
- `POST /api/v1/notifications/subscribe` (JWT обязателен):
  - Body: `{ subscription: PushSubscriptionJSON, user_type: 'client' | 'owner' }`
  - Поведение: UPSERT по endpoint (если уже есть, обновить user_type).
  - Response: `{ success, message, subscription_id }`
- `POST /api/v1/notifications/unsubscribe` (JWT обязателен):
  - Body: `{ endpoint }`
  - Response: `{ success, message }`
- `POST /api/v1/notifications/test` (JWT обязателен, для проверки):
  - Body (optional): `{ title?: string, body?: string }`
  - Отправить тестовое уведомление подписке пользователя
  - Response: `{ success, message, sent_count }`

## 3) Инциденты (Owner Incidents)

Задача: давать владельцам (admin/superadmin) список инцидентов: оффлайн станции, ошибки коннекторов, сбои сессий.

- `GET  /api/v1/owner/incidents?status=open|investigating|resolved&query=...&limit&offset`
  - Response: `{ success, incidents: Array<{ id, station_serial, location_name, type, severity, status, created_at }> }`
  - type: `station_offline | connector_fault | session_error`
  - severity: `critical | major | minor | info`
  - status: `open | investigating | resolved`
- `POST /api/v1/owner/incidents/:id/status` (admin/superadmin)
  - Body: `{ status: 'open' | 'investigating' | 'resolved' }`
  - Response: `{ success }`
- Источник инцидентов: агрегировать из телеметрии/логов; записи должны быть доступны по организации/роль-настроенной видимости (RBAC).

RBAC:

- Роли: `client`, `operator`, `admin`, `superadmin`, `auditor` (read-only).
- Incidents — доступны `admin`/`superadmin` в рамках своей организации.
- Передавать org в JWT/сессии; на уровне БД — RLS.

## 4) Статусы и справочники

- Station status: `available | offline | maintenance | partial`
- Connector status: `available | occupied | faulted`
- Локация: агрегированный статус по станциям/коннекторам.

## 5) Endpoints для зарядки (актуализация)

- `POST /api/v1/charging/start` — принимает `{ station_id, connector_id, amount_som?, energy_kwh? }`
- `GET  /api/v1/charging/status/:session_id` — детальный статус
- `POST /api/v1/charging/stop` — `{ session_id }`
- Требования: идемпотентность (заголовок `Idempotency-Key` поддержать), корректные коды ошибок и json-ответы.

## 6) Locations/Stations (публичные GET, приватные — только для владельцев)

- `GET /api/v1/locations?include_stations=true` — публичный список для клиента (как сейчас). Поля: координаты, summaries, станции c тарифом.
- `GET /api/v1/station/status/:station_id` — публично (как сейчас), с `tariff_rub_kwh` и списком коннекторов.

## 7) Безопасность и заголовки

- CSP и security headers — см. `docs/SECURITY_HEADERS_DEPLOYMENT.md`, `docs/PROD_CSP.md`
- Не кэшировать приватные ответы; SW уже настроен на стороне фронта.
- Валидация входных данных, rate limiting, audit logs для чувствительных действий.

## 8) Совместимость и флаги

- Фронт уже готов к cookie‑auth (`VITE_AUTH_MODE=cookie`), CSRF заголовок добавляется автоматически.
- Для dev можно оставить режим `token` до готовности cookie endpoints.

## 9) Контракты ответов (пример)

Унифицированный ответ: `{ success: boolean, message?: string, ...payload }`. Ошибки — `{ error, message, code, status }`.

## 10) Проверка готовности

- Включить cookie‑auth и CSRF; проверить login/refresh/logout с куками.
- Notifications: получить VAPID ключ, подписаться, отправить тестовое уведомление.
- Инциденты: вернуть список, обновить статус; проверить RBAC.

Вопросы — готовы синхронизировать схемы Zod/ответов и внести правки в контракт при необходимости.
