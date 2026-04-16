import { z } from "zod";
import { ApiError, handleApiError } from "@/shared/errors/apiErrors";
import { logger } from "@/shared/utils/logger";
import { captureException, addBreadcrumb } from "@/shared/monitoring/sentry";
import {
  isCsrfEnabled,
  shouldAttachCsrf,
  ensureCsrfToken,
} from "@/shared/security/csrf";
import { attemptAuthRefresh } from "./authRefresh";

// Re-export for backward compatibility
export { ApiError, handleApiError };

export class TransportError extends Error {
  public status: number | undefined;
  public code: string | undefined;
  constructor(message: string, opts?: { status?: number; code?: string }) {
    super(message);
    this.name = "TransportError";
    this.status = opts?.status;
    this.code = opts?.code;
  }
}

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
};

const defaultOptions: Required<Pick<RequestOptions, "timeoutMs" | "retries">> =
  {
    timeoutMs: 10000,
    retries: 2,
  };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isIdempotent(method?: string) {
  return !method || method === "GET";
}

/**
 * Проверяет, является ли URL эндпоинтом авторизации.
 * Для таких эндпоинтов 401 означает "неверные данные", а не "сессия истекла".
 */
function isAuthEndpoint(url: string): boolean {
  const authPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/signup",
    "/auth/token",
    "/auth/otp/send",
    "/auth/otp/verify",
    "/auth/otp/status",
    "/auth/sms/send-otp",
    "/auth/sms/verify",
  ];
  return authPaths.some((path) => url.includes(path));
}

/**
 * Проверяет, безопасен ли retry запроса после auth refresh.
 * GET, PUT, DELETE идемпотентны по HTTP спецификации.
 * Для POST разрешаем только идемпотентные по дизайну endpoints.
 */
function isSafeToRetryAfterRefresh(url: string, method: string): boolean {
  // GET, PUT, DELETE идемпотентны по HTTP спецификации
  if (method === "GET" || method === "PUT" || method === "DELETE") {
    return true;
  }

  // POST к /favorites идемпотентен по дизайну (add/toggle)
  if (method === "POST" && url.includes("/favorites")) {
    return true;
  }

  return false;
}

export async function fetchJson<T>(
  url: string,
  options: RequestOptions,
  schema: z.ZodType<T>,
): Promise<T> {
  // Resolve relative '/api/...' to absolute API base in PROD.
  const resolveApiUrl = (input: string): string => {
    if (/^https?:\/\//i.test(input) || /^wss?:\/\//i.test(input)) return input;
    const base = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "";
    if (!base) return input; // DEV or Vercel proxy: rely on rewrite for /api/*
    const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    if (input.startsWith("/")) return `${trimmedBase}${input}`;
    return `${trimmedBase}/${input}`;
  };
  const resolvedUrl = resolveApiUrl(url);
  addBreadcrumb({
    category: "api",
    message: `${options.method ?? "GET"} ${resolvedUrl}`,
    data: { method: options.method ?? "GET" },
  });
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? defaultOptions.timeoutMs,
  );

  let didAuthRefresh = false;

  const makeOnce = async (): Promise<T> => {
    // PWA: Always use browser fetch
    // Web platform: use browser fetch
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    };

    // Attach CSRF token only if enabled, method is mutating and origin is allowed
    const method = options.method ?? "GET";
    if (isCsrfEnabled() && method !== "GET" && shouldAttachCsrf(resolvedUrl)) {
      // Ensure CSRF token exists (fetch from backend if missing)
      const token = await ensureCsrfToken();
      if (token) {
        headers["X-CSRF-Token"] = token;
      }
    }

    const resp = await fetch(resolvedUrl, {
      method: options.method ?? "GET",
      headers,
      credentials: "include",
      body: options.body ? JSON.stringify(options.body) : null,
      signal: controller.signal,
    });

    const status = resp.status;
    const contentType = resp.headers.get("content-type") || "";

    // Auth refresh retry: if 401 and feature enabled, try refresh once for idempotent requests
    if (
      status === 401 &&
      !didAuthRefresh &&
      import.meta.env["VITE_ENABLE_AUTH_REFRESH"] === "true" &&
      isSafeToRetryAfterRefresh(resolvedUrl, options.method ?? "GET")
    ) {
      const refreshed = await attemptAuthRefresh();
      didAuthRefresh = true;
      if (refreshed) {
        return await makeOnce();
      }
      // Refresh не удался — просто логируем (модалку не показываем)
      if (!isAuthEndpoint(resolvedUrl)) {
        logger.debug("[UnifiedClient] Auth refresh failed, session expired");
      }
    }

    if (!contentType.includes("application/json")) {
      const textResponse = await resp.text();
      if (import.meta.env.DEV) {
        logger.error(
          `[UnifiedClient] Backend non-JSON response: ${status} ${contentType}`,
        );
      }
      captureException(
        new TransportError(
          `Backend error (${status}): ${textResponse || "No message"}`,
          { status },
        ),
        {
          tags: { feature: "api", kind: "non-json" },
          extra: { url: resolvedUrl, status, contentType },
        },
      );
      throw new TransportError(
        `Backend error (${status}): ${textResponse || "No message"}`,
        { status },
      );
    }

    const json = (await resp.json()) as unknown;

    if (!resp.ok) {
      const errorObj = json as Record<string, unknown>;
      const rawDetail = errorObj?.["detail"];
      // FastAPI validation errors return detail as an array of objects
      const message = (Array.isArray(rawDetail)
        ? rawDetail.map((e: Record<string, unknown>) => e?.["msg"] ?? JSON.stringify(e)).join("; ")
        : rawDetail) || errorObj?.["error"] || errorObj?.["message"] || `HTTP ${status}`;
      const errorCode = (errorObj?.["error_code"] || errorObj?.["error"]) as
        | string
        | undefined;
      captureException(
        new TransportError(String(message), { status, code: errorCode }),
        {
          tags: { feature: "api", kind: "http-error" },
          extra: {
            url,
            method: options.method ?? "GET",
            status,
            errorCode,
            body: errorObj,
          },
        },
      );
      throw new TransportError(String(message), {
        status,
        code: errorCode,
      });
    }

    // Common validation logic for both platforms
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      if (import.meta.env.DEV) {
        logger.error(
          `[UnifiedClient] Validation failed: ${options.method ?? "GET"} ${resolvedUrl}`,
        );
        logger.error(
          "[UnifiedClient] Validation errors:",
          JSON.stringify(parsed.error.errors, null, 2),
        );
        logger.error(
          "[UnifiedClient] Response data:",
          JSON.stringify(json, null, 2),
        );
      }
      captureException(new Error("Response validation failed"), {
        tags: { feature: "api", kind: "validation" },
        extra: {
          url: resolvedUrl,
          method: options.method ?? "GET",
          errors: parsed.error.errors,
        },
      });
      throw new TransportError("Response validation failed", {
        status,
        code: "INVALID_RESPONSE",
      });
    }
    return parsed.data;
  };

  try {
    const retries = options.retries ?? defaultOptions.retries;
    let attempt = 0;
    let delay = 300;
    // Exponential backoff only for idempotent requests
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const result = await makeOnce();
        return result;
      } catch (err) {
        // AbortError — ожидаемое поведение при отмене запроса (переключение страницы и т.д.)
        // Не логируем как ошибку, просто прокидываем дальше
        const isAbort =
          err instanceof DOMException && err.name === "AbortError";
        if (isAbort) {
          throw err;
        }

        attempt++;
        const retryable = isIdempotent(options.method) && attempt <= retries;
        if (!retryable) throw err;
        await sleep(delay);
        delay = Math.min(delay * 2, 1500);
      }
    }
  } finally {
    clearTimeout(timeout);
  }
}

export { z };

// ================== Error utilities for API boundary ==================
// NOTE: ApiError and handleApiError now imported from @/shared/errors/apiErrors
// DO NOT duplicate error handling code here!

// Minimal wrapper used by PWA warmup and other simple GETs
export const unifiedClient = {
  async get<T>(url: string, opts: { schema: z.ZodType<T> }): Promise<T> {
    return await fetchJson<T>(url, { method: "GET", headers: {} }, opts.schema);
  },
};
