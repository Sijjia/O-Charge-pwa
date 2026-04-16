/**
 * CSRF utilities for cookie-based authentication
 *
 * Backend требует X-CSRF-Token для ВСЕХ мутирующих запросов (POST/PUT/DELETE)
 * при использовании cookie-auth (evp_access/evp_refresh cookies).
 *
 * Логика включения:
 * - VITE_ENABLE_CSRF=true — явно включено
 * - VITE_AUTH_MODE=cookie — cookie-auth требует CSRF
 * - Production режим с cookie-auth — включено по умолчанию
 *
 * @see /docs/AUTH_COOKIE_MIGRATION.md
 */

export function isCsrfEnabled(): boolean {
  // Явно включено через env
  if (import.meta.env["VITE_ENABLE_CSRF"] === "true") return true;

  // Cookie-auth режим всегда требует CSRF
  const authMode = import.meta.env["VITE_AUTH_MODE"] as string | undefined;
  if (authMode === "cookie") return true;

  // В production с cookie-auth (дефолт для PWA) — включено
  if (import.meta.env.PROD) return true;

  return false;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()!.split(";").shift() || null;
  }
  return null;
}

/**
 * Возвращает CSRF-токен из cookie (имя по умолчанию: XSRF-TOKEN)
 * Можно переопределить именем через VITE_CSRF_COOKIE_NAME
 */
export function getCsrfToken(): string | null {
  const cookieName =
    (import.meta.env["VITE_CSRF_COOKIE_NAME"] as string | undefined) ||
    "XSRF-TOKEN";
  return getCookie(cookieName);
}

/**
 * Дефолтные trusted origins для CSRF
 * Backend API домены, которым доверяем отправлять CSRF токен
 */
const DEFAULT_CSRF_TRUSTED_ORIGINS = [
  "https://ocpp.charge.redpay.kg",
  "https://redp.charge.redpay.kg",
];

/**
 * Проверяет, можно ли прикреплять CSRF для данного URL
 * - Всегда true для same-origin
 * - Для cross-origin — только если host в списке доверенных
 */
export function shouldAttachCsrf(url: string): boolean {
  try {
    const target = new URL(url, window.location.origin);
    if (target.origin === window.location.origin) return true;

    // Собираем trusted origins: дефолтные + из env
    const envTrusted =
      (import.meta.env["VITE_CSRF_TRUSTED_ORIGINS"] as string | undefined) ||
      "";
    const envHosts = envTrusted
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);

    const allTrusted = [...DEFAULT_CSRF_TRUSTED_ORIGINS, ...envHosts];

    return (
      allTrusted.includes(target.origin) || allTrusted.includes(target.hostname)
    );
  } catch {
    return false;
  }
}

/**
 * Гарантирует наличие актуального CSRF токена.
 * Если токена нет в cookie — запрашивает с бэкенда.
 *
 * Используется перед критичными POST операциями (push-subscribe, платежи)
 * где CSRF cookie мог истечь (TTL = 1 час).
 */
export async function ensureCsrfToken(): Promise<string | null> {
  // Если токен уже есть — используем его
  const existing = getCsrfToken();
  if (existing) return existing;

  // CSRF не требуется — ничего не делаем
  if (!isCsrfEnabled()) return null;

  // Запрашиваем новый токен с бэкенда
  try {
    const apiUrl =
      (import.meta.env["VITE_API_URL"] as string | undefined) || "";
    const url = apiUrl ? `${apiUrl}/api/v1/auth/csrf` : "/api/v1/auth/csrf";

    const resp = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (resp.ok) {
      // Cookie XSRF-TOKEN устанавливается автоматически бэкендом
      // Пробуем также получить из response body
      const data = await resp.json();
      if (data?.csrf_token) {
        return data.csrf_token as string;
      }
      // Даже если body пустой, cookie уже установлен
      return getCsrfToken();
    }
  } catch {
    // Игнорируем ошибки — продолжаем без CSRF
  }

  return null;
}
