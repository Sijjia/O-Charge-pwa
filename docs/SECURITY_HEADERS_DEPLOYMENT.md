# Security Headers — Продакшн‑настройка

> Эти заголовки должны устанавливаться сервером/хостинг‑платформой. Клиентский код не может выставить HTTP‑заголовки корректно.

## Обязательные заголовки

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
Cross-Origin-Opener-Policy: same-origin
```

## CSP (Content-Security-Policy)

Пример (адаптируйте под домены и nonce):

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://api-maps.yandex.ru 'nonce-<generated>';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  font-src 'self' data:;
  connect-src 'self' https://ocpp.redp.asystem.kg https://*.supabase.co wss://*.supabase.co https://api.dengi.o.kg;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

Важно: используйте nonce/sha256 для inline‑скриптов, избегайте `'unsafe-eval'`.

## Платформы

### NGINX

```
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self)" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://api-maps.yandex.ru 'nonce-<generated>'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://ocpp.redp.asystem.kg https://*.supabase.co wss://*.supabase.co https://api.dengi.o.kg; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests" always;
```

### Cloudflare (Workers/Pages)

Используйте `Response` с `headers.set(...)` или Pages Rules/Functions для добавления заголовков.

### Vercel

Добавьте в `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(self)"
        },
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' https://api-maps.yandex.ru 'nonce-<generated>'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://ocpp.redp.asystem.kg https://*.supabase.co wss://*.supabase.co https://api.dengi.o.kg; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
        }
      ]
    }
  ]
}
```

## DEV окружение

В `vite.config.ts` добавлены базовые dev‑заголовки (без CSP), чтобы не ломать Vite. На продакшне используйте конфигурации выше.
