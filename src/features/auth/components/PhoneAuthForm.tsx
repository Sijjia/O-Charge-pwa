/**
 * PhoneAuthForm - Единая форма авторизации по номеру телефона
 * Объединяет регистрацию и вход: если пользователь не существует, он создается автоматически
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { OTPInput } from "./OTPInput";
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
import { AnimatedError } from "@/shared/components/AnimatedError";
import { getPostLoginRedirect } from "../utils/roleRedirect";

type AuthStep = "phone" | "otp";

interface PhoneAuthFormProps {
  redirectTo?: string;
}

export function PhoneAuthForm({
  redirectTo = "/",
}: PhoneAuthFormProps) {
  const navigate = useNavigate();
  const { login, loginAsOwner } = useUnifiedAuthStore();

  // State
  const [step, setStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("+996");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer для повторной отправки
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  // Проверка статуса OTP при переходе на шаг ввода кода
  useEffect(() => {
    if (step === "otp") {
      checkOTPStatus(phone).then((status) => {
        if (!status.can_send && status.wait_seconds > 0) {
          setCountdown(status.wait_seconds);
        }
      });
    }
  }, [step, phone]);

  // Обработка ввода телефона
  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      // Убираем все кроме цифр и +
      value = value.replace(/[^\d+]/g, "");

      // Гарантируем что + в начале
      if (!value.startsWith("+")) {
        value = "+" + value.replace(/\+/g, "");
      }

      setPhone(value);
      setError(null);
    },
    [],
  );

  // Отправка OTP кода
  const handleSendOTP = useCallback(async () => {
    setError(null);

    // Валидация
    const validation = validatePhone(phone);
    if (!validation.valid) {
      setError(validation.error || "Неверный номер телефона");
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendOTP(phone);

      if (result.success) {
        setStep("otp");
        setCountdown(60); // 60 секунд до повторной отправки
        logger.info("[PhoneAuth] OTP sent", { phone: normalizePhone(phone) });
      } else {
        setError(result.message);
        // Если rate limit, показываем countdown
        if (
          result.error === "rate_limit" &&
          result.message.includes("секунд")
        ) {
          const seconds = parseInt(result.message.match(/\d+/)?.[0] || "60");
          setCountdown(seconds);
        }
      }
    } catch (err) {
      logger.error("[PhoneAuth] Send OTP error", err);
      setError("Ошибка отправки кода. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  }, [phone]);

  // Проверка OTP кода
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

            sessionStorage.setItem("demo_mode", "true");
            sessionStorage.setItem("demo_role", demoRole);
            window.dispatchEvent(new CustomEvent("demo-mode-changed", { detail: { mode: true, role: demoRole } }));

            navigate(
              getPostLoginRedirect({
                userType: testConfig.user_type,
                role: testConfig.role,
                isPartner: testConfig.is_partner,
              }),
              { replace: true },
            );
            return;
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

            // Если owner — проверяем партнёра ДО login() чтобы избежать race condition
            if (result.user_type === "owner" && result.role) {
              const isPartner = await fetchJson("/api/v1/partner/dashboard", { method: "GET" }, z.object({ success: z.boolean() }).passthrough())
                .then((res) => res.success === true)
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
              // Вызываем синхронно — React 18 батчит в один рендер
              login(unifiedUser);
              loginAsOwner(ownerData);

              navigate(
                getPostLoginRedirect({
                  userType: "owner",
                  role: result.role,
                  isPartner,
                }),
                { replace: true },
              );
              return;
            } else {
              login(unifiedUser);
            }
          }

          // Редирект в зависимости от типа пользователя
          navigate(
            getPostLoginRedirect({
              userType: result.user_type || "client",
              role: result.role,
            }),
            { replace: true },
          );
        } else {
          setError(result.message);
          setOtpCode(""); // Очищаем код при ошибке
        }
      } catch (err) {
        logger.error("[PhoneAuth] Verify OTP error", err);
        setError("Ошибка проверки кода. Попробуйте позже.");
      } finally {
        setIsLoading(false);
      }
    },
    [phone, login, loginAsOwner, navigate, redirectTo],
  );

  // Повторная отправка кода
  const handleResendOTP = useCallback(async () => {
    if (countdown > 0) return;

    setOtpCode("");
    setError(null);
    await handleSendOTP();
  }, [countdown, handleSendOTP]);

  // Возврат к вводу телефона
  const handleBackToPhone = useCallback(() => {
    setStep("phone");
    setOtpCode("");
    setError(null);
  }, []);

  const handleOTPComplete = useCallback(
    (code: string) => {
      handleVerifyOTP(code);
    },
    [handleVerifyOTP],
  );

  const localPhoneValue = phone.replace("+996", "").trim();

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold font-display text-zinc-900 dark:text-white mb-2 tracking-tight">
          {step === "phone" ? "Вход или регистрация" : "Введите код"}
        </h2>
        <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400">
          {step === "phone"
            ? "Укажите номер телефона, мы отправим SMS"
            : `Код отправлен на номер ${formatPhoneDisplay(phone)}`}
        </p>
      </div>

      {/* Phone Step */}
      {step === "phone" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendOTP();
          }}
          className="space-y-6"
        >
          <div>
            <div
              className={`group relative bg-white dark:bg-zinc-900/50 rounded-2xl border transition-all duration-300 shadow-sm dark:shadow-none ${error
                ? "border-red-500/50 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]"
                : "border-zinc-200 dark:border-zinc-800 focus-within:border-red-500/50 focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:shadow-[0_0_0_1px_rgba(239,68,68,0.2)]"
                }`}
            >
              <label className="flex items-center h-[72px] px-5 w-full cursor-text">
                {/* Country Flag & Code Prefix */}
                <div className="flex items-center gap-3 pr-4 border-r border-zinc-200 dark:border-zinc-800 mr-4 h-6">
                  <img
                    src="https://flagcdn.com/kg.svg"
                    alt="Кыргызстан"
                    className="w-6 h-6 rounded-full object-cover shadow-sm border border-zinc-100 dark:border-zinc-700/50"
                  />
                  <span className="text-zinc-900 dark:text-zinc-300 font-mono text-lg pt-0.5 select-none">
                    +996
                  </span>
                </div>

                {/* Phone Input */}
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={localPhoneValue}
                  onChange={handlePhoneChange}
                  placeholder="700 000 000"
                  disabled={isLoading}
                  className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-white text-xl font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-600 h-full w-full pt-0.5 tracking-wide"
                  autoFocus
                  autoComplete="tel"
                />
              </label>
            </div>
            <AnimatedError error={error} />
          </div>

          <button
            type="submit"
            disabled={isLoading || phone.length < 10}
            className={`
              w-full h-14 text-base font-medium rounded-xl flex items-center justify-center gap-2 px-6 transition-all duration-300 active:scale-[0.98]
              ${isLoading || phone.length < 10
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20"
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Отправка...
              </span>
            ) : (
              "Получить код"
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            SMS с кодом будет отправлен на указанный номер
          </p>
        </form>
      )}

      {/* OTP Step */}
      {step === "otp" && (
        <div className="space-y-6">
          <OTPInput
            value={otpCode}
            onChange={setOtpCode}
            onComplete={handleOTPComplete}
            disabled={isLoading}
            error={error || undefined}
            autoFocus
          />

          <button
            onClick={() => handleVerifyOTP(otpCode)}
            disabled={isLoading || otpCode.length !== 6}
            className={`
              w-full h-14 text-base font-medium rounded-xl flex items-center justify-center gap-2 px-6 transition-all duration-300 active:scale-[0.98]
              ${isLoading || otpCode.length !== 6
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20"
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Проверка...
              </span>
            ) : (
              "Войти"
            )}
          </button>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleResendOTP}
              disabled={countdown > 0 || isLoading}
              className={`
                text-sm
                ${countdown > 0 || isLoading
                  ? "text-zinc-500 dark:text-gray-400 cursor-not-allowed"
                  : "text-green-600 hover:text-green-400 hover:underline"
                }
              `}
            >
              {countdown > 0
                ? `Повторная отправка через ${countdown} сек.`
                : "Отправить код повторно"}
            </button>

            <button
              onClick={handleBackToPhone}
              disabled={isLoading}
              className="text-sm text-zinc-500 dark:text-gray-500 hover:text-zinc-700 dark:hover:text-gray-300 hover:underline"
            >
              Изменить номер телефона
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhoneAuthForm;
