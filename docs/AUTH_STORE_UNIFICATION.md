# Унификация auth-store (переход на cookie‑модель без TTL на клиенте)

> **Статус:** ✅ Реализовано (v1.4.4)
>
> **Последнее обновление:** 2025-11-26
>
> Цель: единый источник истины для auth‑состояния на фронтенде. Без хранения access/refresh токенов в клиентских хранилищах. Совместимо с HttpOnly cookies + CSRF.

## Текущая реализация

`useUnifiedAuthStore` (`src/features/auth/unifiedAuthStore.ts`) — единственный источник истины для auth-состояния:

- **user** — профиль пользователя (id, роли)
- **isAuthenticated** — флаг авторизации
- **isInitialized** — флаг инициализации (для предотвращения мерцания UI)

Токены не хранятся на клиенте — валидность определяется сервером через HttpOnly cookies.

## Архитектура

```
                     ┌─────────────────────────────────────┐
                     │         useUnifiedAuthStore         │
                     │  (user, isAuthenticated, isInit)    │
                     └──────────────────┬──────────────────┘
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         │                              │                              │
    AuthProvider                   RequireRole                 evpowerApi
   (инициализация)               (защита роутов)           (API запросы)
         │                              │                              │
         └──────────────────────────────┼──────────────────────────────┘
                                        │
                            Backend (HttpOnly cookies)
                         evp_access (10 мин), evp_refresh (7 дней)
```

## Файлы реализации

| Файл                                           | Назначение                          |
| ---------------------------------------------- | ----------------------------------- |
| `src/features/auth/unifiedAuthStore.ts`        | Единый auth store                   |
| `src/features/auth/providers/AuthProvider.tsx` | Провайдер авторизации               |
| `src/shared/components/RequireRole.tsx`        | Защита роутов                       |
| `src/features/auth/services/authService.ts`    | Auth service (login/logout/profile) |

## Методы

| Метод                  | Описание                                  |
| ---------------------- | ----------------------------------------- |
| `login(user)`          | Установка состояния после успешного login |
| `logout()`             | Вызов server-logout + очистка состояния   |
| `refreshUser()`        | Обновление профиля; при 401 → soft-logout |
| `setInitialized(bool)` | Установка флага инициализации             |

## Чеклист реализации

- [x] Фаза A: Создать `useUnifiedAuthStore` ✅
  - [x] Реплицировать интерфейс (user/isAuthenticated/isInitialized)
  - [x] Интегрировать с `AuthProvider`
  - [x] Обратная совместимость с legacy stores
- [x] Фаза B: Cookie-based auth ✅
  - [x] `credentials: 'include'` во всех запросах
  - [x] CSRF для мутирующих запросов (кроме refresh/logout)
  - [x] Auto-refresh при 401 (`authRefresh.ts`)
- [ ] Фаза C: Очистка (опционально)
  - [ ] Удалить legacy `useSecureAuthStore` (после тестирования)
  - [ ] E2E: логин/мутации/логаут/401 сценарии

## Definition of Done

- [x] В проекте единый auth store (`useUnifiedAuthStore`) ✅
- [x] Нет логики TTL/expiry на клиенте ✅
- [x] Cookie-based auth с CSRF ✅
- [ ] E2E тестирование на production
