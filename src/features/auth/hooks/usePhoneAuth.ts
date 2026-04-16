import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  sendOTP,
  verifyOTP,
  checkOTPStatus,
  normalizePhone,
  validatePhone,
  formatPhoneDisplay,
  isTestPhone,
  getTestPhoneConfig,
} from "../services/otpService";
import { useUnifiedAuthStore } from "../unifiedAuthStore";
import { authService } from "../services/authService";
import { fetchJson, z } from "@/api/unifiedClient";
import type { Owner } from "../types/auth.types";
import { logger } from "@/shared/utils/logger";

interface UsePhoneAuthOptions {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function usePhoneAuth(options: UsePhoneAuthOptions = {}) {
  const { onSuccess, redirectTo = "/" } = options;
  const navigate = useNavigate();
  const { login, loginAsOwner } = useUnifiedAuthStore();

  const [phone, setPhone] = useState("+996");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      value = value.replace(/[^\d+]/g, "");
      if (!value.startsWith("+")) {
        value = "+" + value.replace(/\+/g, "");
      }
      setPhone(value);
      setError(null);
    },
    [],
  );

  // Set phone directly (for split-page flow where prefix is separate)
  const setPhoneValue = useCallback((value: string) => {
    setPhone(value);
    setError(null);
  }, []);

  const handleSendOTP = useCallback(async () => {
    setError(null);
    const validation = validatePhone(phone);
    if (!validation.valid) {
      setError(validation.error || "Неверный номер телефона");
      return false;
    }

    setIsLoading(true);
    try {
      const result = await sendOTP(phone);
      if (result.success) {
        setCountdown(60);
        logger.info("[PhoneAuth] OTP sent", { phone: normalizePhone(phone) });
        return true;
      } else {
        setError(result.message);
        if (
          result.error === "rate_limit" &&
          result.message.includes("секунд")
        ) {
          const seconds = parseInt(result.message.match(/\d+/)?.[0] || "60");
          setCountdown(seconds);
        }
        return false;
      }
    } catch (err) {
      logger.error("[PhoneAuth] Send OTP error", err);
      setError("Ошибка отправки кода. Попробуйте позже.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [phone]);

  const handleVerifyOTP = useCallback(
    async (code: string) => {
      setError(null);
      setIsLoading(true);

      try {
        const result = await verifyOTP(phone, code);

        if (result.success) {
          logger.info("[PhoneAuth] Verification successful", {
            user_type: result.user_type,
          });

          // Тестовый телефон — создаём демо-пользователя без бэкенда
          if (isTestPhone(phone)) {
            const testConfig = getTestPhoneConfig(phone)!;
            const demoRole = testConfig.is_partner ? "partner" : testConfig.user_type === "owner" ? "admin" : "client";

            const demoUser = {
              id: `demo-${demoRole}`,
              email: null,
              phone: normalizePhone(phone),
              name: testConfig.label,
              balance: 5000,
              status: "active" as const,
              favoriteStations: [] as string[],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            login(demoUser);

            if (demoRole === "partner" || demoRole === "admin") {
              const ownerData: Owner = {
                id: `demo-${demoRole}`,
                phone: normalizePhone(phone),
                role: testConfig.role || "operator",
                is_active: true,
                is_partner: testConfig.is_partner || false,
              };
              loginAsOwner(ownerData);
            }

            // Включаем демо-режим
            sessionStorage.setItem("demo_mode", "true");
            sessionStorage.setItem("demo_role", demoRole);
            window.dispatchEvent(new CustomEvent("demo-mode-changed", { detail: { mode: true, role: demoRole } }));

            if (onSuccess) {
              onSuccess();
            } else if (demoRole === "partner") {
              navigate("/partner/dashboard");
            } else if (demoRole === "admin") {
              navigate("/owner/dashboard");
            } else {
              navigate(redirectTo);
            }
            return true;
          }

          // Реальный пользователь — получаем данные с бэкенда
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
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
            login(unifiedUser);

            if (result.user_type === "owner" && result.role) {
              // Проверяем, является ли пользователь партнёром
              const isPartner = await fetchJson("/api/v1/partner/dashboard", { method: "GET" }, z.object({ success: z.boolean() }).passthrough())
                .then(() => true)
                .catch(() => false);

              const ownerData: Owner = {
                id: currentUser.id,
                phone: currentUser.phone || undefined,
                email: currentUser.email || undefined,
                role: result.role,
                is_active: true,
                is_partner: isPartner,
                admin_id: result.admin_id,
                stations_count: currentUser.stations_count,
                locations_count: currentUser.locations_count,
              };
              loginAsOwner(ownerData);

              if (!onSuccess) {
                navigate(isPartner ? "/partner/dashboard" : "/owner/dashboard");
                return true;
              }
            }
          }

          if (onSuccess) {
            onSuccess();
          } else {
            if (result.user_type === "owner") {
              navigate("/owner/dashboard");
            } else {
              navigate(redirectTo);
            }
          }
          return true;
        } else {
          setError(result.message);
          setOtpCode("");
          return false;
        }
      } catch (err) {
        logger.error("[PhoneAuth] Verify OTP error", err);
        setError("Ошибка проверки кода. Попробуйте позже.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [phone, login, loginAsOwner, onSuccess, navigate, redirectTo],
  );

  const handleResendOTP = useCallback(async () => {
    if (countdown > 0) return;
    setOtpCode("");
    setError(null);
    await handleSendOTP();
  }, [countdown, handleSendOTP]);

  const checkStatus = useCallback(async () => {
    const status = await checkOTPStatus(phone);
    if (!status.can_send && status.wait_seconds > 0) {
      setCountdown(status.wait_seconds);
    }
  }, [phone]);

  return {
    phone,
    otpCode,
    isLoading,
    error,
    countdown,
    setPhone: setPhoneValue,
    setOtpCode,
    setError,
    handlePhoneChange,
    handleSendOTP,
    handleVerifyOTP,
    handleResendOTP,
    checkStatus,
    formatPhoneDisplay,
  };
}
