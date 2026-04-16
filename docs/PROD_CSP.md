# Production CSP (строгая политика безопасности контента)

> Цель: исключить XSS/инъекции в продакшне. CSP должен выставляться сервером (см. `docs/SECURITY_HEADERS_DEPLOYMENT.md`). Этот документ — готовый шаблон.

## Базовая политика (рекомендуемая)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://api-maps.yandex.ru 'nonce-<generated>';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  font-src 'self' data:;
  connect-src 'self' https://ocpp.redp.asystem.kg https://*.supabase.co wss://*.supabase.co https://api-maps.yandex.ru;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

Примечания:

- `script-src` без `'unsafe-eval'`/`'unsafe-inline'`. Используйте nonce при необходимости инлайнов.
- `style-src 'unsafe-inline'` временно допустим из-за сторонних стилей. Планируйте переход на hash/nonce.
- `connect-src` включает необходимые домены (backend, Supabase, Yandex Maps).

## Dev vs Prod

- В `index.html` присутствует DEV‑совместимая meta‑CSP (с `'unsafe-eval'`) для Vite HMR.
- В продакшне meta‑CSP игнорируем. Используем серверные заголовки CSP из этого файла.

## Интеграция

См. `docs/SECURITY_HEADERS_DEPLOYMENT.md` для NGINX/Cloudflare/Vercel.
