# BACKEND API REFERENCE - RedPetroleum

**Дата последнего обновления:** 2025-12-20
**Backend версия:** v1.4.5
**PWA версия:** v1.0.0 (build 34)
**База данных:** Supabase PostgreSQL (28 таблиц, 189 миграций)
**Real-time:** Redis Pub/Sub + WebSocket
**Backend URL:** `https://ocpp.redp.asystem.kg`

---

## 🏗️ АРХИТЕКТУРА БЭКЕНДА

### Технологический стек:

- **FastAPI** - Python web framework
- **PostgreSQL** (Supabase) - основная база данных
- **Redis** - Pub/Sub для WebSocket real-time updates
- **OCPP 1.6J** - протокол связи с зарядными станциями

### Структура:

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── locations/
│   │   │   └── websocket.py          # WebSocket для локаций
│   │   ├── charging/
│   │   ├── balance/
│   │   └── auth/
│   ├── services/
│   │   └── realtime_service.py       # Redis Pub/Sub сервис
│   ├── core/
│   │   ├── config.py
│   │   ├── security_middleware.py
│   │   └── logging_config.py
│   └── main.py
└── migrations/
    └── 001_enable_rls_security.sql
```

---

## 🔐 АУТЕНТИФИКАЦИЯ

### Основной метод: Phone + OTP через WhatsApp

> **BREAKING CHANGE (v1.0.0):** Email/password аутентификация удалена. Используется только phone + OTP.

**Процесс входа:**

1. Пользователь вводит номер телефона (+996...)
2. Система отправляет 6-значный OTP код в WhatsApp (через Wappi API)
3. Пользователь вводит код в форме OTPInput
4. При успешной верификации устанавливаются cookies

### Cookie-Based Sessions (основной для PWA) 🍪

- Cookies: `evp_access` (10 мин), `evp_refresh` (7 дней)
- CSRF защита: обязательна через `X-CSRF-Token`
- `credentials: 'include'` во всех запросах

### OTP Auth Endpoints:

| Endpoint                  | Метод | Описание                  | CSRF |
| ------------------------- | ----- | ------------------------- | ---- |
| `/api/v1/auth/csrf`       | GET   | Получить CSRF токен       | —    |
| `/api/v1/auth/otp/send`   | POST  | Отправить OTP на WhatsApp | ✅   |
| `/api/v1/auth/otp/verify` | POST  | Верифицировать OTP код    | ✅   |
| `/api/v1/auth/otp/status` | GET   | Статус OTP (cooldown)     | —    |
| `/api/v1/auth/refresh`    | POST  | Обновление токенов        | ❌   |
| `/api/v1/auth/logout`     | POST  | Выход из системы          | ❌   |
| `/api/v1/profile`         | GET   | Профиль пользователя      | —    |
| `/api/v1/auth/me`         | GET   | Алиас для /profile        | —    |

**OTP Send Request:**

```json
POST /api/v1/auth/otp/send
{ "phone": "+996559974545" }
```

**OTP Verify Request:**

```json
POST /api/v1/auth/otp/verify
{ "phone": "+996559974545", "code": "123456" }
```

**OTP Verify Response:**

```json
{
  "success": true,
  "message": "Авторизация успешна",
  "user_type": "client", // "client" | "owner"
  "user_id": "uuid"
}
```

**OTP Verify Response (для owner):**

```json
{
  "success": true,
  "message": "Авторизация успешна",
  "user_type": "owner",
  "user_id": "uuid",
  "role": "admin", // "operator" | "admin" | "superadmin"
  "admin_id": "uuid" // null для admin/superadmin, UUID для operator
}
```

> **v1.4.5:** При успешной верификации OTP для owner автоматически создается запись в таблице `clients` для гибридного функционала (баланс, зарядка).

**Rate Limiting для OTP:**

- Повторная отправка: 60 секунд cooldown
- Максимум попыток верификации: 5 за сессию

> **Важно (v1.4.4+):** `/auth/refresh` и `/auth/logout` исключены из CSRF проверки.
>
> **Формат ответа `/profile`:**
>
> - Для clients: `{ success, client_id, email, phone, name, balance, status }`
> - Для owners: `{ success, client_id, email, phone, name, balance, status, user_type: "owner", role, admin_id, is_active, stations_count, locations_count }`

### Legacy Endpoints (deprecated):

- ❌ `POST /api/v1/auth/signin` - Удалён
- ❌ `POST /api/v1/auth/signup` - Удалён
- ❌ `POST /api/v1/auth/login` - Удалён (использовать OTP)

### CSRF Protection:

- Применяется к POST/PUT/DELETE с cookie-auth
- Заголовок: `X-CSRF-Token: <token_from_cookie>`
- Cookie: `XSRF-TOKEN` (не HttpOnly, читаем из JS, TTL 1 час)

**Исключения из CSRF (v1.4.4):**

```python
CSRF_EXEMPT_PATHS = (
    "/api/v1/auth/refresh",
    "/api/v1/auth/logout",
)
```

> **См. также:** `/docs/AUTH_COOKIE_MIGRATION.md`

### Rate Limiting:

- **REST API (общие):** 60 запросов/минуту
- **Критичные операции** (зарядка/баланс): 10 запросов/минуту
- **Webhook:** 30 запросов/минуту

**Источник:** `backend/app/core/security_middleware.py`, `backend/app/core/config.py:50-52`

---

## 🗺️ LOCATIONS & STATIONS

### REST API Endpoints:

#### GET /api/v1/locations

Получить список всех локаций с вложенными станциями.

**Авторизация:** Не требуется (публичный доступ)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Название локации",
      "address": "Адрес",
      "city": "Бишкек",
      "latitude": 42.8746,
      "longitude": 74.5698,
      "status": "available",
      "stations": [
        {
          "id": "CHR-BGK-001",
          "serial_number": "CHR-BGK-001",
          "model": "AC Charger 22kW",
          "manufacturer": "RedPetroleum",
          "status": "available",
          "power_capacity": 22.0,
          "price_per_kwh": 13.5,
          "session_fee": 0,
          "connector_count": 2,
          "connectors": [
            {
              "connector_id": 1,
              "connector_type": "Type2",
              "status": "available",
              "power_kw": 22.0
            }
          ]
        }
      ]
    }
  ]
}
```

#### GET /api/v1/locations/{id}

Получить детали конкретной локации.

**Авторизация:** Не требуется

**Response:** То же что GET /api/v1/locations, но один объект

#### GET /api/v1/station/status/{stationId}

Получить статус станции и её коннекторов.

**Авторизация:** Не требуется

**Response:**

```json
{
  "success": true,
  "data": {
    "station_id": "CHR-BGK-001",
    "status": "available",
    "connectors": [
      {
        "connector_id": 1,
        "status": "available",
        "connector_type": "Type2",
        "power_kw": 22.0
      }
    ],
    "price_per_kwh": 13.5
  }
}
```

**Источник:** `backend/app/api/v1/locations/`, `backend/app/main.py:356-363`

---

## ⚡ CHARGING

### REST API Endpoints:

#### POST /api/v1/charging/start

Начать зарядку.

**Авторизация:** ✅ Требуется JWT

**Request:**

```json
{
  "station_id": "CHR-BGK-001",
  "connector_id": 1,
  "limit_type": "energy", // "energy" | "amount" | "unlimited"
  "limit_value": 10.0, // кВт⋅ч или сомы
  "idempotency_key": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "status": "active",
    "start_time": "2025-11-18T10:00:00.000Z",
    "station_id": "CHR-BGK-001",
    "connector_id": 1
  }
}
```

#### POST /api/v1/charging/stop

Остановить зарядку.

**Авторизация:** ✅ Требуется JWT

**Request:**

```json
{
  "session_id": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "status": "completed",
    "energy_kwh": 10.5,
    "amount": 141.75,
    "duration_minutes": 45,
    "stop_time": "2025-11-18T10:45:00.000Z"
  }
}
```

#### GET /api/v1/charging/status/{sessionId}

Получить статус активной сессии.

**Авторизация:** ✅ Требуется JWT

**Response:**

```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "status": "active",
    "energy_kwh": 5.5,
    "amount": 74.25,
    "start_time": "2025-11-18T10:00:00.000Z",
    "station_id": "CHR-BGK-001",
    "connector_id": 1,
    "limit_type": "energy",
    "limit_value": 10.0
  }
}
```

**Источник:** `backend/app/api/v1/charging/`

---

## 💰 BALANCE & PAYMENTS

### Получение баланса

**Рекомендуемый способ:** Использовать `/api/v1/profile` вместо отдельного balance endpoint.

> **Важно (v1.4.4):** Баланс возвращается в ответе `/api/v1/profile` как поле `balance`.
> Отдельный endpoint `/api/v1/balance/get` существует, но рекомендуется использовать profile для уменьшения количества запросов.

#### GET /api/v1/profile (рекомендуется)

Возвращает профиль с балансом:

```json
{
  "success": true,
  "client_id": "uuid",
  "email": "user@example.com",
  "phone": "+996555123456",
  "name": "User Name",
  "balance": 1500.0,
  "status": "active"
}
```

#### GET /api/v1/balance/get (legacy)

Получить текущий баланс клиента. Автоматически извлекает `client_id` из cookie (AuthMiddleware).

**Авторизация:** ✅ Требуется Cookie (evp_access)

**Response:**

```json
{
  "client_id": "e9272dc8-9c44-48c1-9839-3fc344c6e469",
  "balance": 1500.0,
  "currency": "KGS",
  "last_topup_at": "2024-10-01T09:00:00Z",
  "total_spent": 850.0
}
```

> **Примечание:** Нет `success` wrapper — это Pydantic response_model напрямую.

#### GET /api/v1/balance/{client_id} (admin)

Получить баланс конкретного клиента (для админки).

**Авторизация:** ✅ Требуется Cookie

**Response:** То же что `/balance/get`

#### POST /api/v1/balance/topup-qr

Создать QR-код для пополнения через O!Деньги.

**Авторизация:** ✅ Требуется JWT

**Request:**

```json
{
  "amount": 100.0,
  "idempotency_key": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "invoice_id": "12345",
    "qr_url": "https://...",
    "qr_data": "data:image/png;base64,...",
    "amount": 100.0,
    "expires_at": "2025-11-18T11:00:00.000Z"
  }
}
```

#### GET /api/v1/payment/status/{invoiceId}

Проверить статус платежа.

**Авторизация:** ✅ Требуется JWT

**Response:**

```json
{
  "success": true,
  "data": {
    "invoice_id": "12345",
    "status": "paid", // "pending" | "paid" | "failed" | "cancelled"
    "amount": 100.0,
    "paid_at": "2025-11-18T10:30:00.000Z"
  }
}
```

#### POST /api/v1/payment/cancel/{invoiceId}

Отменить платёж.

**Авторизация:** ✅ Требуется JWT

**Response:**

```json
{
  "success": true,
  "data": {
    "invoice_id": "12345",
    "status": "cancelled"
  }
}
```

**Источник:** `backend/app/api/v1/balance/`

---

## 🔄 WEBSOCKET REAL-TIME UPDATES

### Endpoint:

```
wss://ocpp.redp.asystem.kg/api/v1/locations/ws/locations
```

### Авторизация:

❌ **НЕ ТРЕБУЕТСЯ** - публичный доступ к обновлениям локаций

**Опциональный параметр:**

```
wss://ocpp.redp.asystem.kg/api/v1/locations/ws/locations?client_id=uuid
```

Если `client_id` не передан, генерируется автоматически.

### Rate Limiting:

- **20 подключений** с одного IP
- **10 подключений** на пользователя (client_id)
- **10 сообщений/секунду** от клиента

### Origin проверка:

✅ Проверяется origin по CORS whitelist

**Источник:** `backend/app/api/v1/locations/websocket.py:103-170`

---

## 📨 WEBSOCKET MESSAGE FORMATS

### Исходящие сообщения (от сервера к клиенту):

#### 1. Connection Established

```json
{
  "type": "connection",
  "status": "connected",
  "client_id": "uuid",
  "message": "Подключено к обновлениям локаций"
}
```

#### 2. Location Status Update

```json
{
  "type": "location_status_update",
  "location_id": "uuid",
  "location_name": "Название локации",
  "status": "available",
  "stations_summary": {
    "total": 5,
    "available": 3,
    "occupied": 1,
    "offline": 1,
    "maintenance": 0
  },
  "connectors_summary": {
    "total": 10,
    "available": 6,
    "occupied": 2,
    "faulted": 2
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

#### 3. Station Status Update

```json
{
  "type": "station_status_update",
  "station_id": "CHR-BGK-001",
  "serial_number": "CHR-BGK-001",
  "location_id": "uuid",
  "status": "available",
  "available_connectors": 2,
  "occupied_connectors": 0,
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

#### 4. Connector Status Update

```json
{
  "type": "connector_status_update",
  "connector_id": 1,
  "station_id": "CHR-BGK-001",
  "location_id": "uuid",
  "status": "available",
  "error_code": null,
  "connector_type": "Type2",
  "power_kw": 22.0,
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Connector статусы:**

- `available` - доступен
- `occupied` - занят
- `preparing` - подготовка
- `charging` - идёт зарядка
- `finishing` - завершение
- `faulted` - ошибка

#### 5. Charging Session Update

```json
{
  "type": "charging_session_update",
  "event": "started",
  "session_id": "uuid",
  "client_id": "uuid",
  "station_id": "CHR-BGK-001",
  "location_id": "uuid",
  "status": "active",
  "energy_kwh": 10.5,
  "amount": 141.75,
  "start_time": "2025-11-18T10:00:00.000Z",
  "stop_time": null,
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Session события:**

- `started` - зарядка началась
- `stopped` - зарядка остановлена
- `error` - ошибка
- `meter_update` - обновление счётчика (энергия/сумма)

#### 6. Pong Response

```json
{
  "type": "pong",
  "timestamp": 1700305800.123
}
```

#### 7. Error Message

```json
{
  "type": "error",
  "message": "Описание ошибки"
}
```

#### 8. Subscription Confirmation

```json
{
  "type": "subscription",
  "status": "subscribed",
  "channel": "all"
}
```

**Источник:** `backend/app/api/v1/locations/websocket.py:109-127`, `backend/app/services/realtime_service.py:203-257`

---

## 📤 WEBSOCKET MESSAGE FORMATS (входящие)

### Входящие сообщения (от клиента к серверу):

#### 1. Subscribe to All Locations

```json
{
  "action": "subscribe",
  "channel": "all"
}
```

#### 2. Subscribe to Specific Location

```json
{
  "action": "subscribe",
  "channel": "location:uuid-локации"
}
```

#### 3. Subscribe to Location Stations

```json
{
  "action": "subscribe",
  "channel": "location_stations:uuid-локации"
}
```

#### 4. Unsubscribe

```json
{
  "action": "unsubscribe",
  "channel": "all"
}
```

#### 5. Ping (Heartbeat)

```json
{
  "action": "ping"
}
```

**Рекомендация:** Отправлять ping каждые 30 секунд для поддержания соединения.

**Источник:** `backend/app/api/v1/locations/websocket.py:218-256`

---

## 🔴 REDIS PUB/SUB CHANNELS

Внутренние каналы Redis (для понимания архитектуры):

- `location_updates:all` - все локации
- `location_updates:{location_id}` - конкретная локация
- `location_stations:{location_id}` - станции локации
- `station_updates:{station_id}` - конкретная станция
- `connector_updates:{station_id}:{connector_id}` - коннектор
- `client_sessions:{client_id}` - сессии клиента
- `station_sessions:{station_id}` - сессии станции

**Источник:** `backend/app/services/realtime_service.py:71-75`

---

## 👥 ADMIN API

### Admin Operators API (v1.4.5)

API для управления операторами. Доступен только для admin и superadmin ролей.

| Endpoint                                | Метод  | Описание                 | Auth      |
| --------------------------------------- | ------ | ------------------------ | --------- |
| `/api/v1/admin/operators`               | GET    | Список операторов        | ✅ admin+ |
| `/api/v1/admin/operators`               | POST   | Создать оператора        | ✅ admin+ |
| `/api/v1/admin/operators/{id}`          | DELETE | Деактивировать оператора | ✅ admin+ |
| `/api/v1/admin/operators/{id}/activate` | POST   | Активировать оператора   | ✅ admin+ |

#### GET /api/v1/admin/operators

Получить список операторов текущего admin.

**Авторизация:** ✅ Требуется Cookie (role: admin или superadmin)

**Response:**

```json
{
  "success": true,
  "operators": [
    {
      "id": "uuid",
      "phone": "+996555123456",
      "name": "Оператор 1",
      "is_active": true
    }
  ]
}
```

#### POST /api/v1/admin/operators

Создать нового оператора по номеру телефона.

**Авторизация:** ✅ Требуется Cookie (role: admin или superadmin)

**Request:**

```json
{
  "phone": "+996555123456",
  "name": "Оператор 1" // опционально
}
```

**Response:**

```json
{
  "id": "uuid",
  "phone": "+996555123456",
  "name": "Оператор 1",
  "is_active": true
}
```

> **Примечание:** При создании оператора автоматически создается запись в таблице `clients` для гибридного функционала.

#### DELETE /api/v1/admin/operators/{id}

Деактивировать оператора.

**Авторизация:** ✅ Требуется Cookie (role: admin или superadmin)

**Response:**

```json
{
  "success": true,
  "message": "Оператор деактивирован"
}
```

#### POST /api/v1/admin/operators/{id}/activate

Активировать ранее деактивированного оператора.

**Авторизация:** ✅ Требуется Cookie (role: admin или superadmin)

**Response:**

```json
{
  "success": true,
  "message": "Оператор активирован"
}
```

**Источник:** `backend/app/api/v1/admin/operators.py`

---

## 📲 PUSH NOTIFICATIONS

### Статус: ✅ РЕАЛИЗОВАНО (v1.4.4+)

Push Notifications полностью реализованы на бэкенде:

### Endpoints:

| Endpoint                                 | Метод | Описание                       | Auth |
| ---------------------------------------- | ----- | ------------------------------ | ---- |
| `/api/v1/notifications/vapid-public-key` | GET   | Получить VAPID public key      | ❌   |
| `/api/v1/notifications/subscribe`        | POST  | Подписаться на push            | ✅   |
| `/api/v1/notifications/unsubscribe`      | POST  | Отписаться от push             | ✅   |
| `/api/v1/notifications/test`             | POST  | Отправить тестовое уведомление | ✅   |

### GET /api/v1/notifications/vapid-public-key

**Авторизация:** Не требуется

**Response:**

```json
{
  "success": true,
  "data": {
    "public_key": "BLxmR2..." // VAPID public key (base64url)
  }
}
```

### POST /api/v1/notifications/subscribe

**Авторизация:** ✅ Требуется JWT

**Request:**

```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "base64...",
      "auth": "base64..."
    }
  },
  "user_type": "client" // "client" | "owner"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Push subscription registered successfully",
  "subscription_id": "uuid"
}
```

### POST /api/v1/notifications/unsubscribe

**Авторизация:** ✅ Требуется JWT

**Request:**

```json
{
  "endpoint": "https://fcm.googleapis.com/..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Push subscription removed successfully"
}
```

### POST /api/v1/notifications/test

**Авторизация:** ✅ Требуется JWT

**Response:**

```json
{
  "success": true,
  "sent_to": 2,
  "message": "Test notification sent to 2 device(s)"
}
```

### Пример использования в PWA:

```javascript
// 1. Получить VAPID key
const vapidResponse = await fetch("/api/v1/notifications/vapid-public-key");
const { data } = await vapidResponse.json();

// 2. Подписаться через browser Push API
const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: data.public_key,
});

// 3. Отправить подписку на backend
await fetch("/api/v1/notifications/subscribe", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    subscription: subscription.toJSON(),
    user_type: "client",
  }),
});
```

---

## ❌ НЕ РЕАЛИЗОВАНО

### 1. Supabase Realtime

**Статус:** ❌ НЕ ИСПОЛЬЗУЕТСЯ

Вместо Supabase Realtime используется собственная реализация **WebSocket + Redis Pub/Sub**.

**Причины:**

1. Полный контроль над форматом сообщений
2. Redis Pub/Sub быстрее
3. Гибкая маршрутизация обновлений
4. Rate limiting на уровне WebSocket
5. Нет зависимости от Supabase Realtime API

### 2. Автоматические Push уведомления

Push API реализован, но автоматическая отправка уведомлений на события ещё не реализована:

- ❌ **Low Balance Warning** - нет автоматического уведомления при балансе < 50 сом
- ❌ **Payment Confirmed** - нет события при успешном пополнении
- ❌ **Daily Revenue Summary** - нет ежедневного отчёта для owners
- ❌ **Charging Events** - уведомления при старте/стопе зарядки (trigger на backend)

**Источник:** Анализ всего backend кода

---

## 🔧 ЦЕНООБРАЗОВАНИЕ

### Текущая реализация:

**Статус:** ✅ Хардкод в PWA

**Цена:** `13.5 сом/кВт⋅ч` (константа в PWA)

**Backend поддержка:**

- ✅ `price_per_kwh` возвращается в API для каждой станции
- ✅ `session_fee` - фиксированная плата за сессию (обычно 0)

**Динамическое ценообразование:**
❌ НЕ РЕАЛИЗОВАНО на бэкенде

**Источник:** Решение PWA агента от 2025-11-18

---

## 🧪 ТЕСТИРОВАНИЕ

### Environments:

- **Production:** `https://ocpp.redp.asystem.kg`
- **Staging:** ⚠️ НЕТ отдельного staging (используйте production или локальный Docker)

### Health Check:

```bash
GET https://ocpp.redp.asystem.kg/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T10:00:00.000Z",
  "version": "1.2.4"
}
```

### WebSocket тест (Browser Console):

```javascript
const ws = new WebSocket("wss://ocpp.redp.asystem.kg/api/v1/locations/ws/locations");

ws.onopen = () => {
  console.log("✅ Connected");
  ws.send(JSON.stringify({ action: "subscribe", channel: "all" }));
  ws.send(JSON.stringify({ action: "ping" }));
};

ws.onmessage = (e) => {
  console.log("📨 Message:", JSON.parse(e.data));
};

ws.onerror = (e) => {
  console.error("❌ Error:", e);
};

ws.onclose = () => {
  console.log("🔌 Disconnected");
};
```

**Источник:** `backend/app/main.py:369-400`

---

## 📊 PRODUCTION READINESS

### WebSocket:

✅ **READY FOR PRODUCTION**

Характеристики:

- До 20 подключений с одного IP
- До 10 подключений на пользователя
- Rate limiting: 10 сообщений/секунду
- Origin проверка (CORS)
- Graceful shutdown
- Reconnection handling

### REST API:

✅ **READY FOR PRODUCTION**

Характеристики:

- JWT авторизация
- Rate limiting
- CORS настроен для `https://redp.asystem.kg`
- Payment audit middleware
- Structured logging

### Мониторинг:

⚠️ **ЧАСТИЧНО ГОТОВО**

Есть:

- ✅ Логирование всех событий
- ✅ Health check endpoint
- ✅ Логи в `/var/log/redpetroleum-ocpp`

Нет:

- ❌ Prometheus metrics
- ❌ Sentry error tracking
- ❌ Grafana dashboards

**Источник:** `backend/app/core/logging_config.py`, `backend/app/main.py:369-400`

---

## 🚀 РЕКОМЕНДАЦИИ ДЛЯ PWA

### 1. WebSocket вместо Push Notifications

Используйте WebSocket для real-time уведомлений:

- ✅ `charging_session_update` с `event: "started"` → "Зарядка началась"
- ✅ `charging_session_update` с `event: "stopped"` → "Зарядка завершена"
- ✅ `station_status_update` с `status: "offline"` → "Станция недоступна"

### 2. Fallback на Polling

Если WebSocket недоступен:

- **Локации:** polling каждые 30 секунд (`GET /api/v1/locations`)
- **Активная сессия:** polling каждые 10 секунд (`GET /api/v1/charging/status/{sessionId}`)
- **Баланс:** polling каждые 60 секунд (`GET /api/v1/balance/current`)

### 3. Reconnection Strategy

При разрыве WebSocket соединения:

1. Попытка переподключения через 1 секунду
2. Exponential backoff: 2s, 4s, 8s, 16s, 30s (max)
3. Максимум 10 попыток
4. Fallback на polling после 10 неудачных попыток

### 4. Rate Limiting Handling

При получении 429 ошибки:

- Exponential backoff для повторных запросов
- Показать пользователю сообщение "Слишком много запросов, попробуйте позже"
- Не более 60 REST запросов в минуту (общие)
- Не более 10 запросов в минуту (зарядка/баланс)

### 5. Авторизация

- **WebSocket:** не требуется для локаций
- **REST API:** JWT в `Authorization: Bearer {token}`
- **Token storage:** sessionStorage (не localStorage)

---

## 📝 CHANGELOG BACKEND

### v1.4.5 (2025-12-20)

- ✅ **Unified Auth:** Единая OTP авторизация для clients и owners через WhatsApp
- ✅ **OTP Verify Response:** Добавлены поля `role` и `admin_id` для owners
- ✅ **Hybrid Users:** Автоматическое создание client записи для owners (баланс, зарядка)
- ✅ **Admin Operators API:** Новые endpoints для управления операторами (`/api/v1/admin/operators`)
- ✅ **Profile API:** Добавлено поле `admin_id` для owners

### v1.4.4 (2025-11-26)

- ✅ **CSRF исключения:** `/auth/refresh` и `/auth/logout` больше не требуют CSRF токен
- ✅ Исправлена проблема 403 при refresh запросах
- ✅ Cookies: `evp_access` (10 мин), `evp_refresh` (7 дней), `XSRF-TOKEN` (1 час)
- ✅ **Balance:** рекомендуется использовать `/profile` для получения баланса
- ✅ **Cookie-auth flow:** PWA автоматически обновляет токен при 401 через interceptor

### v1.2.4 (2025-11-18)

- ✅ WebSocket для локаций полностью работает
- ✅ Redis Pub/Sub для real-time updates
- ✅ Rate limiting для WebSocket
- ✅ Origin проверка
- ⚠️ Push Notifications не реализованы
- ⚠️ Supabase Realtime не используется

---

## 🔗 ИСТОЧНИКИ

Документ составлен на основе реального backend кода:

- `backend/app/api/v1/locations/websocket.py:103-314`
- `backend/app/services/realtime_service.py:22-257`
- `backend/app/core/config.py`
- `backend/app/core/security_middleware.py`
- `backend/app/main.py:315-400`
- `backend/migrations/001_enable_rls_security.sql`
- `ARCHITECTURE.md`
- `CHANGELOG.md`

**Ответы Backend Agent:** 2025-11-18

---

**Этот документ является единственным источником правды о backend API для PWA команды.**
**При изменениях в бэкенде - обновлять этот документ!**
