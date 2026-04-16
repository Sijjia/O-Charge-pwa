/**
 * SSOCallbackPage — handles redirect back from Keycloak
 * Validates state, exchanges code for session, redirects to dashboard.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import {
  getSSOCallbackParams,
  validateSSOState,
  getSSOCodeVerifier,
  exchangeSSOCode,
  clearSSOState,
} from "../services/ssoService";
import { authService } from "../services/authService";
import { useUnifiedAuthStore } from "../unifiedAuthStore";
import { fetchJson, z } from "@/api/unifiedClient";
import type { Owner } from "../types/auth.types";
import { logger } from "@/shared/utils/logger";
import { getPostLoginRedirect } from "../utils/roleRedirect";

type CallbackStatus = "processing" | "error";

export function SSOCallbackPage() {
  const navigate = useNavigate();
  const { login, loginAsOwner } = useUnifiedAuthStore();
  const [status, setStatus] = useState<CallbackStatus>("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        const { code, state } = getSSOCallbackParams();

        // Check for error from Keycloak
        const params = new URLSearchParams(window.location.search);
        const kcError = params.get("error");
        if (kcError) {
          throw new Error(params.get("error_description") || kcError);
        }

        if (!code || !state) {
          throw new Error("Отсутствуют параметры авторизации");
        }

        // Validate CSRF state
        if (!validateSSOState(state)) {
          throw new Error("Неверный параметр state. Попробуйте снова.");
        }

        const codeVerifier = getSSOCodeVerifier();
        if (!codeVerifier) {
          throw new Error("Отсутствует code_verifier. Попробуйте снова.");
        }

        // Exchange code for session
        const result = await exchangeSSOCode(code, codeVerifier);
        clearSSOState();

        if (cancelled) return;

        if (!result.success) {
          throw new Error(result.message || "Ошибка авторизации");
        }

        // Fetch current user data (cookies are now set)
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          throw new Error("Не удалось получить данные пользователя");
        }

        if (cancelled) return;

        // Update Zustand store — same pattern as PhoneAuthForm
        const unifiedUser = {
          id: currentUser.id,
          email: currentUser.email || null,
          phone: currentUser.phone || null,
          name: currentUser.name || "User",
          balance: currentUser.balance || 0,
          status: "active" as const,
          favoriteStations: [] as string[],
          createdAt: currentUser.created_at || new Date().toISOString(),
          updatedAt: currentUser.updated_at || new Date().toISOString(),
        };

        // Check partner status
        const isPartner = await fetchJson(
          "/api/v1/partner/dashboard",
          { method: "GET" },
          z.object({ success: z.boolean() }).passthrough(),
        )
          .then((res) => res.success === true)
          .catch(() => false);

        const ownerData: Owner = {
          id: currentUser.id,
          phone: currentUser.phone || undefined,
          email: currentUser.email || undefined,
          role: result.role as Owner["role"],
          is_active: true,
          is_partner: isPartner,
          admin_id: result.admin_id,
          stations_count: currentUser.stations_count,
          locations_count: currentUser.locations_count,
        };

        login(unifiedUser);
        loginAsOwner(ownerData);

        // Redirect based on role
        navigate(
          getPostLoginRedirect({
            userType: "owner",
            role: result.role,
            isPartner,
          }),
          { replace: true },
        );
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Неизвестная ошибка";
        logger.error("[SSO Callback] Error:", err);
        setErrorMessage(message);
        setStatus("error");
        clearSSOState();
      }
    }

    handleCallback();
    return () => {
      cancelled = true;
    };
  }, [navigate, login, loginAsOwner]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#050507] p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Icon icon="solar:danger-triangle-bold" width={32} className="text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            Ошибка авторизации
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            {errorMessage}
          </p>
          <button
            onClick={() => navigate("/auth", { replace: true })}
            className="w-full h-12 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-100"
          >
            Вернуться к входу
          </button>
        </div>
      </div>
    );
  }

  // Processing state
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#050507] p-6">
      <div className="text-center">
        <Icon icon="svg-spinners:ring-resize" width={40} className="text-red-500 mx-auto mb-4" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Выполняется вход...
        </p>
      </div>
    </div>
  );
}
