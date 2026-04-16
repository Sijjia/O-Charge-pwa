import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

export function AuthEnvBanner() {
  const mode = (import.meta.env["VITE_AUTH_MODE"] as string) || "token";
  const csrfEnabled = import.meta.env["VITE_ENABLE_CSRF"] === "true";
  const enableAuthDebug = import.meta.env["VITE_ENABLE_AUTH_DEBUG"] === "true";

  const show =
    (import.meta.env.DEV || enableAuthDebug) &&
    mode === "cookie" &&
    !csrfEnabled;

  if (!show) return null;

  return (
    <div className="sticky top-0 z-50">
      <div className="mx-auto max-w-screen-md m-2 rounded-xl px-3 py-2 text-sm font-medium shadow-lg shadow-black/40 border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon icon="solar:danger-triangle-linear" width={16} />
            <span>
              Cookie‑Auth включен (VITE_AUTH_MODE=cookie), но CSRF выключен.
              Включите VITE_ENABLE_CSRF=true и проверьте /auth/debug.
            </span>
          </div>
          <Link
            to="/auth/debug"
            className="inline-flex items-center gap-1 text-yellow-900 underline underline-offset-2"
          >
            <Icon icon="solar:link-linear" width={16} />
            Проверить
          </Link>
        </div>
      </div>
    </div>
  );
}
