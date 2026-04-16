/**
 * OTP Service - API клиент для phone-only авторизации
 * Использует SMS OTP коды через Nikita SMS
 */
import { logger } from "@/shared/utils/logger";

// Пустая строка = relative URL через proxy (Vercel rewrites / nginx)
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || "";

// ========== Тестовые телефоны (демо-режим без бэкенда) ==========

export interface TestPhoneConfig {
  user_type: "client" | "owner";
  role?: "operator" | "admin" | "superadmin";
  is_partner?: boolean;
  label: string;
}

export const TEST_PHONES: Record<string, TestPhoneConfig> = import.meta.env.PROD
  ? {}
  : {
      "+996700000000": { user_type: "client", label: "Тест Клиент" },
      "+996700000001": { user_type: "owner", role: "operator", is_partner: true, label: "Тест Партнёр" },
      "+996700000002": { user_type: "owner", role: "admin", label: "Тест Админ" },
    };

export const TEST_OTP_CODE = "000000";

export function isTestPhone(phone: string): boolean {
  return normalizePhone(phone) in TEST_PHONES;
}

export function getTestPhoneConfig(phone: string): TestPhoneConfig | null {
  return TEST_PHONES[normalizePhone(phone)] || null;
}

// ========== Types ==========

export interface SendOTPRequest {
  phone: string;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  phone?: string;
  error?: string;
}

export interface VerifyOTPRequest {
  phone: string;
  code: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  user_type?: "client" | "owner";
  user_id?: string;
  role?: "operator" | "admin" | "superadmin";
  admin_id?: string | null;
  error?: string;
}

export interface OTPStatusResponse {
  success: boolean;
  phone: string;
  can_send: boolean;
  wait_seconds: number;
}

// ========== Utility Functions ==========

/**
 * Нормализация номера телефона в международный формат
 */
export function normalizePhone(phone: string): string {
  // Убираем все кроме цифр и +
  let normalized = phone.replace(/[^\d+]/g, "");

  // Добавляем + если нет
  if (!normalized.startsWith("+")) {
    // Если номер начинается с 0, предполагаем Кыргызстан
    if (normalized.startsWith("0")) {
      normalized = "+996" + normalized.slice(1);
    } else if (normalized.length === 9) {
      // 9 цифр без кода страны - добавляем +996
      normalized = "+996" + normalized;
    } else {
      normalized = "+" + normalized;
    }
  }

  return normalized;
}

/**
 * Валидация номера телефона
 */
export function validatePhone(phone: string): {
  valid: boolean;
  error?: string;
} {
  const normalized = normalizePhone(phone);

  if (normalized.length < 10) {
    return { valid: false, error: "Номер слишком короткий" };
  }

  if (normalized.length > 15) {
    return { valid: false, error: "Номер слишком длинный" };
  }

  // Проверяем что номер содержит только цифры после +
  if (!/^\+\d+$/.test(normalized)) {
    return { valid: false, error: "Неверный формат номера" };
  }

  return { valid: true };
}

/**
 * Форматирование номера для отображения
 */
export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhone(phone);

  // Формат для Кыргызстана: +996 XXX XXX XXX
  if (normalized.startsWith("+996") && normalized.length === 13) {
    return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7, 10)} ${normalized.slice(10)}`;
  }

  return normalized;
}

// ========== API Functions ==========

/**
 * Отправить OTP код на номер телефона (через SMS Nikita)
 */
export async function sendOTP(phone: string): Promise<SendOTPResponse> {
  const normalized = normalizePhone(phone);

  // Test phone bypass — не вызываем API
  if (normalized in TEST_PHONES) {
    logger.info("[OTP] Test phone detected, skipping SMS", { phone: normalized });
    return {
      success: true,
      message: "Тестовый режим. Код: 000000",
      phone: normalized,
    };
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/auth/sms/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ phone: normalized }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.warn("[OTP] Send failed", { status: response.status, data });
      return {
        success: false,
        message: data.message || "Ошибка отправки кода",
        error: data.error,
      };
    }

    logger.info("[OTP] Code sent via SMS", { phone: normalized });
    return {
      success: true,
      message: data.message || "Код отправлен по SMS",
      phone: normalized,
    };
  } catch (error) {
    logger.error("[OTP] Send error", error);
    return {
      success: false,
      message: "Ошибка сети. Проверьте подключение к интернету.",
      error: "network_error",
    };
  }
}

/**
 * Проверить OTP код и выполнить вход
 */
export async function verifyOTP(
  phone: string,
  code: string,
): Promise<VerifyOTPResponse> {
  const normalized = normalizePhone(phone);

  // Test phone bypass — проверяем тестовый код без API
  if (normalized in TEST_PHONES && code === TEST_OTP_CODE) {
    const config = TEST_PHONES[normalized]!;
    const demoRole = config.is_partner ? "partner" : config.user_type === "owner" ? "admin" : "client";
    logger.info("[OTP] Test phone verified", { phone: normalized, role: demoRole });
    return {
      success: true,
      message: "Тестовый вход выполнен",
      user_type: config.user_type,
      user_id: `demo-${demoRole}`,
      role: config.role,
    };
  }

  // Test phone с неверным кодом
  if (normalized in TEST_PHONES) {
    return {
      success: false,
      message: "Неверный код. Для тестовых номеров используйте 000000",
      error: "invalid_code",
    };
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/auth/sms/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ phone: normalized, code }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.warn("[OTP] Verify failed", { status: response.status, data });
      return {
        success: false,
        message: data.message || "Неверный код",
        error: data.error,
      };
    }

    logger.info("[OTP] Verification successful", {
      phone: normalized,
      user_type: data.user_type,
    });

    return {
      success: true,
      message: data.message || "Авторизация успешна",
      user_type: data.user_type,
      user_id: data.user_id,
      role: data.role,
      admin_id: data.admin_id,
    };
  } catch (error) {
    logger.error("[OTP] Verify error", error);
    return {
      success: false,
      message: "Ошибка сети. Проверьте подключение к интернету.",
      error: "network_error",
    };
  }
}

/**
 * Проверить статус OTP (можно ли отправить новый код)
 */
export async function checkOTPStatus(
  phone: string,
): Promise<OTPStatusResponse> {
  const normalized = normalizePhone(phone);

  try {
    const response = await fetch(
      `${API_URL}/api/v1/auth/sms/send-otp/status?phone=${encodeURIComponent(normalized)}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const data = await response.json();

    return {
      success: data.success ?? true,
      phone: normalized,
      can_send: data.can_send ?? true,
      wait_seconds: data.wait_seconds ?? 0,
    };
  } catch (error) {
    logger.error("[OTP] Status check error", error);
    return {
      success: false,
      phone: normalized,
      can_send: true, // Разрешаем попытку при ошибке
      wait_seconds: 0,
    };
  }
}

// ========== Default Export ==========

export const otpService = {
  sendOTP,
  verifyOTP,
  checkOTPStatus,
  normalizePhone,
  validatePhone,
  formatPhoneDisplay,
};

export default otpService;
