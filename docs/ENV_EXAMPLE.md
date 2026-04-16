# Пример .env (скопируйте в корень проекта как `.env`)

> **Обновлено:** 2025-11-26 (Backend v1.4.4)

```env
# Core
VITE_API_URL=https://ocpp.charge.redpay.kg
VITE_WEBSOCKET_URL=wss://ocpp.charge.redpay.kg
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_YANDEX_MAPS_API_KEY=your_yandex_maps_key

# PWA / Push
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
VITE_ENABLE_PUSH_NOTIFICATIONS=true

# Monitoring
VITE_SENTRY_DSN=

# Cookie-based Auth (v1.4.4)
VITE_AUTH_MODE=cookie              # token|cookie (cookie для production)
VITE_ENABLE_CSRF=true              # CSRF защита для мутирующих запросов
VITE_CSRF_COOKIE_NAME=XSRF-TOKEN   # Имя CSRF cookie
VITE_ENABLE_AUTH_REFRESH=true      # Автоматический refresh при 401

# Debug (только для development)
VITE_ENABLE_PWA_DEBUG=true
VITE_ENABLE_AUTH_DEBUG=true
VITE_DEBUG_MODE=false

# Comma-separated origins or hostnames
VITE_CSRF_TRUSTED_ORIGINS=https://ocpp.charge.redpay.kg,ocpp.charge.redpay.kg
```

## Production настройки

```env
# .env.production
VITE_AUTH_MODE=cookie
VITE_ENABLE_CSRF=true
VITE_ENABLE_AUTH_REFRESH=true
VITE_DEBUG_MODE=false
```
