import { API_ENDPOINTS } from "./endpoints";

/** Once refresh fails, skip further attempts for this page load. */
let refreshFailed = false;

/**
 * Управляемая попытка refresh (cookie-based).
 * Включается только при флаге VITE_ENABLE_AUTH_REFRESH === 'true'.
 * Возвращает true, если refresh завершился успешно (HTTP 200).
 *
 * После первого неудачного refresh пропускает повторные попытки
 * в рамках текущей загрузки страницы (предотвращает лишние 401).
 */
export async function attemptAuthRefresh(): Promise<boolean> {
  if (import.meta.env["VITE_ENABLE_AUTH_REFRESH"] !== "true") {
    return false;
  }
  if (refreshFailed) {
    return false;
  }
  try {
    const apiBase =
      (import.meta.env["VITE_API_URL"] as string | undefined) || "";
    const path = API_ENDPOINTS.auth.refresh;
    const url = apiBase ? `${apiBase.replace(/\/$/, "")}${path}` : path;

    const resp = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });
    if (!resp.ok) {
      refreshFailed = true;
      return false;
    }
    refreshFailed = false;
    return true;
  } catch {
    refreshFailed = true;
    return false;
  }
}

/** Reset the failed flag (call after successful login). */
export function resetRefreshState() {
  refreshFailed = false;
}
