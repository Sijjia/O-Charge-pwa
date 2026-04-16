# Фаза 0 — Security Baseline (план миграции)

> **Статус:** ✅ Cookie-auth реализовано (Backend v1.4.4 + Frontend)
>
> **Последнее обновление:** 2025-11-26
>
> Цель: устранить ключевые риски безопасности перед продакшн‑запуском. Строго следовать `RULES.md`: сначала анализ, затем реализация. Никаких компромиссов по безопасности.

## Обзор рисков (анализ)

- Сессии Supabase сохраняются в `localStorage` → риск XSS‑эксфильтрации.
- SW мог кэшировать приватные ответы → устранено в `src/sw.ts` (NetworkOnly для `Authorization`, Supabase, critical endpoints).
- CSP содержит `'unsafe-inline'/'unsafe-eval'` → требуется стратегия nonce/hash и корректные источники для Яндекс.Карт.
- Псевдо‑"security headers" из фронта не работают как HTTP‑заголовки → заголовки должны выставляться на уровне сервера/платформы.

## Чеклист работ

- [x] Перевести аутентификацию на cookie‑based (HttpOnly, Secure, SameSite=None) ✅
- [x] Добавить CSRF защиту (X-CSRF-Token header) ✅
- [x] Короткоживущий access (10 мин) и refresh‑rotation (7 дней) ✅
- [x] CSRF исключения для `/auth/refresh` и `/auth/logout` (v1.4.4) ✅
- [x] Унифицировать auth‑store (`unifiedAuthStore.ts`) ✅
- [x] Service Worker: актуализировано — см. `src/sw.ts` ✅
- [ ] CSP: заменить `'unsafe-inline'/'unsafe-eval'` на nonce/sha256 (где возможно)
- [ ] Security headers: применить на сервере/платформе деплоя
- [ ] Включить Sentry (DSN через `.env`, stub уже подключён)

## Детали реализации

### 1) Cookie‑based auth + CSRF ✅ РЕАЛИЗОВАНО

- Access/refresh выдаёт backend как `Set-Cookie` (HttpOnly, Secure, SameSite=None)
- Frontend не хранит токены; использует `credentials: 'include'` для запросов
- CSRF: токен в cookie `XSRF-TOKEN` + header `X-CSRF-Token`
- **v1.4.4:** `/auth/refresh` и `/auth/logout` исключены из CSRF проверки
- При 401 — автоматический silent refresh через `authRefresh.ts`
- При неудачном refresh — редирект на логин

**Cookies (актуально):**
| Cookie | HttpOnly | TTL |
|--------|----------|-----|
| `evp_access` | ✅ | 10 мин |
| `evp_refresh` | ✅ | 7 дней |
| `XSRF-TOKEN` | ❌ | 1 час |

### 2) Унификация auth‑store ✅ РЕАЛИЗОВАНО

- Один стор `unifiedAuthStore.ts` для auth‑состояния (user, isAuthenticated)
- Нет ручного expiry в сторе; статус валиден, пока backend cookie валидны
- Logout вызывает `POST /auth/logout` (без CSRF) и чистит кэши
- `refreshUser()` обновляет профиль через API

### 3) CSP и Security Headers

- CSP пример (сервер, не meta):
  - `default-src 'self'`
  - `script-src 'self' https://api-maps.yandex.ru 'nonce-<generated>'`
  - `style-src 'self' 'unsafe-inline'` (временная уступка для стилей Tailwind)
  - `img-src 'self' data: https: blob:`
  - `font-src 'self' data:`
  - `connect-src 'self' https://ocpp.redp.asystem.kg https://*.supabase.co wss://*.supabase.co https://api.dengi.o.kg`
  - `frame-src 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`
  - `upgrade-insecure-requests`

- Обязательные заголовки:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`
  - `Cross-Origin-Opener-Policy: same-origin`

Реализация заголовков — в конфигурации Vercel/Netlify/Cloudflare/NGINX (не через клиентский код).

### 4) Sentry (включение)

- `npm i @sentry/react` и добавить `VITE_SENTRY_DSN`.
- Включить `initSentry()` в `main.tsx` (уже подключено в STUB‑режиме; станет реальным после установки пакета).

## Definition of Done Фазы 0

- [x] Логин/запросы работают на cookie‑based auth, нет использования `localStorage` для токенов ✅
- [x] CSRF проверен, доступ к POST/PUT/DELETE защищён (кроме refresh/logout) ✅
- [ ] CSP и заголовки безопасности применяются сервером на проде
- [ ] Sentry получает ошибки из production
- [ ] E2E сценарий логина/зарядки/оплаты/логаута успешен
