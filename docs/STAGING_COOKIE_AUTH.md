# Cookie‑Auth: включение на стенде (staging)

> **Статус:** ✅ Backend v1.4.4 готов к production
>
> **Последнее обновление:** 2025-11-26

Цель: безопасно перевести фронт на cookie‑сессии перед продом и прогнать смоук‑тесты.

## Требования к бэкенду ✅ ВСЕ РЕАЛИЗОВАНО

- Реализованы эндпоинты:
  - `POST /api/v1/auth/login` → Set‑Cookie: `evp_access`, `evp_refresh` (Secure, HttpOnly, SameSite=None)
  - `POST /api/v1/auth/refresh` → ротация refresh, новый access (БЕЗ CSRF)
  - `POST /api/v1/auth/logout` → очистить cookies (БЕЗ CSRF)
  - `GET /api/v1/auth/csrf` (или `/cierra`) → выдать CSRF cookie `XSRF-TOKEN`
- CORS: origin фронта разрешён, `credentials: true`
- Rate limiting: login/refresh
- **CSRF исключения:** `/auth/refresh` и `/auth/logout` не требуют CSRF токен

## Настройка фронта (staging)

В `.env.staging`:

```
VITE_AUTH_MODE=cookie
VITE_ENABLE_CSRF=true
VITE_CSRF_COOKIE_NAME=XSRF-TOKEN
# Разделяйте запятыми. Можно указать hostname и/или origin
VITE_CSRF_TRUSTED_ORIGINS=https://ocpp.redp.asystem.kg,ocpp.redp.asystem.kg
VITE_ENABLE_AUTH_REFRESH=true
VITE_ENABLE_AUTH_DEBUG=true
```

Примечания:

- В режиме cookie фронт НЕ шлёт `Authorization: Bearer` (см. `evpowerApi`).
- Все запросы идут с `credentials: 'include'` (см. `unifiedClient`).
- CSRF добавляется только для мутирующих запросов и доверенных origin.

## Смоук‑тесты (последовательно)

1. Открыть `/auth/debug`
2. Нажать `GET /auth/csrf` — ожидать 200 и установку CSRF cookie
3. Выполнить обычный логин через UI
4. `POST /auth/refresh` — ожидать 200 и новую пару cookies (БЕЗ CSRF!)
5. `POST /auth/logout` — ожидать 200, cookies очищены (БЕЗ CSRF!)
6. Проверить, что публичные GET работают; приватные эндпоинты без сессии возвращают 401
7. Проверить, что при 401 на GET сессия авто‑обновляется (`VITE_ENABLE_AUTH_REFRESH=true`)
8. Сниффером убедиться: нет `Authorization` заголовка в cookie‑режиме

**Важно (v1.4.4):** Refresh и Logout теперь работают БЕЗ X-CSRF-Token заголовка!

## Безопасность в проде

- Включить CSP и заголовки по `docs/SECURITY_HEADERS_DEPLOYMENT.md` и `docs/PROD_CSP.md`
- Проверить, что SW не кэширует приватные ответы (уже настроено)

## Откат

- Переключить `VITE_AUTH_MODE=token` (при проблемах на стенде)
- Отключить `VITE_ENABLE_CSRF`
