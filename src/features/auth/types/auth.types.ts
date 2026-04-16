import type { Session } from "@supabase/supabase-js";

/**
 * Архитектура ролей:
 * - client = пользователь-водитель (заряжает EV) -> /
 * - operator = региональный оператор станций -> /owner/
 * - admin / superadmin = системные администраторы -> /admin/
 * - partner = НЕ роль, а флаг is_partner на Owner -> /partner/
 * - corporate = отдельный auth flow -> /corporate/
 *
 * Тип пользователя (userType):
 * - client: обычный клиент (заряжает авто)
 * - owner: владелец станций (админка/дашборд)
 * - corporate: корпоративный клиент (панель управления)
 *
 * Маршрутизация после логина: см. getPostLoginRedirect() в utils/roleRedirect.ts
 */
export type UserType = "client" | "owner" | "corporate";

/**
 * Роль владельца станций
 */
export type OwnerRole = "operator" | "admin" | "superadmin";

export interface Client {
  id: string; // UUID (собственный, не из auth.users)
  email?: string; // Nullable (legacy, не требуется для phone-only auth)
  name?: string; // Nullable
  phone: string; // Required для phone-only auth
  balance: number; // В СОМАХ (не копейках!)
  status: "active" | "inactive" | "blocked";
  favorite_stations?: string[];
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
  user_type?: UserType; // Тип пользователя (client по умолчанию)
  // Owner-specific fields (для гибридного подхода)
  role?: OwnerRole; // Роль владельца (если owner)
  is_active?: boolean; // Активен ли owner
  stations_count?: number; // Количество станций
  locations_count?: number; // Количество локаций
}

/**
 * Данные владельца станций (из таблицы users)
 * Гибридный подход: owner также имеет client-данные (баланс, зарядки)
 */
export interface Owner {
  id: string;
  email?: string; // Legacy, не требуется для phone-only auth
  phone?: string; // Phone для OTP авторизации
  role: OwnerRole;
  is_active: boolean;
  is_partner?: boolean; // true если есть запись в таблице partners
  admin_id?: string | null; // ID админа для операторов
  stations_count?: number; // Optional - может не быть
  locations_count?: number; // Optional - может не быть
  user_type?: "owner"; // Optional для обратной совместимости
}

export type User = Client | Owner;

export interface AuthResponse {
  success: boolean;
  client?: Client;
  owner?: Owner;
  user_type?: UserType;
  session?: Session; // Supabase Session
  message?: string;
  // Убрали token и refreshToken - Supabase управляет ими автоматически
}

export interface AuthState {
  isAuthenticated: boolean;
  client: Client | null;
  loading: boolean;
  error: string | null;
}

/**
 * @deprecated Используйте OTP авторизацию через phone
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * @deprecated Используйте OTP авторизацию через phone
 */
export interface SignUpCredentials {
  email: string;
  password: string;
  name?: string;
}

// ========== OTP Auth Types ==========

/**
 * Запрос на отправку OTP кода
 */
export interface SendOTPRequest {
  phone: string;
}

/**
 * Ответ на отправку OTP кода
 */
export interface SendOTPResponse {
  success: boolean;
  message: string;
  phone?: string;
  error?: string;
}

/**
 * Запрос на проверку OTP кода
 */
export interface VerifyOTPRequest {
  phone: string;
  code: string;
}

/**
 * Ответ на проверку OTP кода
 */
export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  user_type?: UserType;
  user_id?: string;
  error?: string;
}
