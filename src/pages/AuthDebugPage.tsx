import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { logger } from "@/shared/utils/logger";
import { getCsrfToken } from "@/shared/security/csrf";

type Result = { ok: boolean; status: number; body: string };

/**
 * Debug API call helper
 * @param endpoint - API endpoint path
 * @param method - HTTP method
 * @param skipCsrf - Skip CSRF token (e.g., for /auth/refresh which doesn't require it)
 */
async function call(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  skipCsrf = false,
): Promise<Result> {
  try {
    const base = (import.meta.env["VITE_API_URL"] as string | undefined) || "";
    const url = base ? `${base.replace(/\/$/, "")}${endpoint}` : endpoint;

    const headers: Record<string, string> = {};
    if (method === "POST") {
      headers["Content-Type"] = "application/json";
      // Добавляем CSRF token для POST запросов (кроме refresh)
      if (!skipCsrf) {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
          headers["X-CSRF-Token"] = csrfToken;
        }
      }
    }

    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text.slice(0, 1000) };
  } catch (e) {
    return { ok: false, status: 0, body: String(e) };
  }
}

export function AuthDebugPage() {
  const navigate = useNavigate();
  const enabled =
    import.meta.env["VITE_ENABLE_AUTH_DEBUG"] === "true" || import.meta.env.DEV;
  const [csrf, setCsrf] = useState<Result | null>(null);
  const [refresh, setRefresh] = useState<Result | null>(null);
  const [logout, setLogout] = useState<Result | null>(null);

  if (!enabled) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
        <div className="bg-white dark:bg-zinc-900 shadow-sm shadow-black/5 dark:shadow-black/20 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full bg-yellow-400 hover:bg-yellow-500/100"
            >
              <Icon icon="solar:arrow-left-linear" width={24} />
            </button>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Auth Debug</h1>
            <div className="w-10" />
          </div>
        </div>
        <div className="max-w-3xl mx-auto p-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg text-yellow-600 dark:text-yellow-400">
            Включите VITE_ENABLE_AUTH_DEBUG=true чтобы открыть отладочную панель
            Cookie‑Auth.
          </div>
        </div>
      </div>
    );
  }

  const mode = (import.meta.env["VITE_AUTH_MODE"] as string) || "token";
  const csrfEnabled = import.meta.env["VITE_ENABLE_CSRF"] === "true";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
      <div className="bg-white dark:bg-zinc-900 shadow-sm shadow-black/5 dark:shadow-black/20 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full bg-yellow-400 hover:bg-yellow-500/100"
          >
            <Icon icon="solar:arrow-left-linear" width={24} />
          </button>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Auth Debug</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm dark:shadow-none transition-colors">
          <p className="text-sm text-zinc-500 dark:text-gray-400">Режим аутентификации</p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-white">VITE_AUTH_MODE = {mode}</p>
          <p className="text-sm text-zinc-500 dark:text-gray-400 mt-2">
            CSRF: {csrfEnabled ? "включен" : "выключен"}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 shadow-sm dark:shadow-none transition-colors">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Cookie‑Auth проверки
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={async () => {
                const res = await call("/api/v1/auth/cierra", "GET");
                logger.info("[AuthDebug] CSRF", res);
                setCsrf(res);
              }}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              GET /auth/cierra
            </button>
            <button
              onClick={async () => {
                const res = await call("/api/v1/auth/csrf", "GET");
                logger.info("[AuthDebug] CSRF (fallback)", res);
                setCsrf(res);
              }}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              GET /auth/csrf
            </button>
            <button
              onClick={async () => {
                // Refresh НЕ требует CSRF (использует HttpOnly refresh cookie)
                const res = await call("/api/v1/auth/refresh", "POST", true);
                logger.info("[AuthDebug] Refresh", res);
                setRefresh(res);
              }}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              POST /auth/refresh
            </button>
            <button
              onClick={async () => {
                const res = await call("/api/v1/auth/logout", "POST");
                logger.info("[AuthDebug] Logout", res);
                setLogout(res);
              }}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              POST /auth/logout
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">/auth/cierra</p>
              <p className="text-xs text-zinc-500 dark:text-gray-500">
                status: {csrf?.status ?? "—"}
              </p>
              <pre className="mt-1 text-xs whitespace-pre-wrap break-all text-zinc-700 dark:text-zinc-300">
                {csrf?.body ?? "—"}
              </pre>
            </div>
            <div className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">/auth/refresh</p>
              <p className="text-xs text-zinc-500 dark:text-gray-500">
                status: {refresh?.status ?? "—"}
              </p>
              <pre className="mt-1 text-xs whitespace-pre-wrap break-all text-zinc-700 dark:text-zinc-300">
                {refresh?.body ?? "—"}
              </pre>
            </div>
            <div className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">/auth/logout</p>
              <p className="text-xs text-zinc-500 dark:text-gray-500">
                status: {logout?.status ?? "—"}
              </p>
              <pre className="mt-1 text-xs whitespace-pre-wrap break-all text-zinc-700 dark:text-zinc-300">
                {logout?.body ?? "—"}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
