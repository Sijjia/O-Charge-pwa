import {
  supabase,
  supabaseWithTimeout,
  isSupabaseConfigured,
} from "../../../shared/utils/supabaseHelpers";
import type {
  AuthResponse,
  Client,
  Owner,
  UserType,
} from "../types/auth.types";
import { pushNotificationService } from "@/lib/platform/push";
import { logger } from "@/shared/utils/logger";
import { fetchJson, z } from "@/api/unifiedClient";

// Re-export OTP service for convenient imports
export {
  sendOTP,
  verifyOTP,
  checkOTPStatus,
  normalizePhone,
  validatePhone,
  formatPhoneDisplay,
  otpService,
} from "./otpService";
export type {
  SendOTPRequest,
  SendOTPResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  OTPStatusResponse,
} from "./otpService";

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  /**
   * Получить CSRF токен с учётом расхождений в контракте (/auth/cierra vs /auth/csrf).
   * Возвращает строку токена из ответа, если сервер её отдает (рекомендуемо),
   * и параллельно сервер выставляет cookie XSRF-TOKEN (которую браузер отправит с POST).
   * Если токен не удалось извлечь из тела ответа, вернёт null (cookie всё равно будет установлена).
   */
  private async getCsrfTokenFromServer(): Promise<string | null> {
    const parseToken = (obj: unknown): string | null => {
      try {
        const rec = obj as Record<string, unknown>;
        // ожидаем { success, csrf_token } или { success, data: { csrf_token } }
        if (typeof rec?.["csrf_token"] === "string")
          return rec["csrf_token"] as string;
        const data = rec?.["data"] as Record<string, unknown> | undefined;
        if (data && typeof data["csrf_token"] === "string")
          return data["csrf_token"] as string;
      } catch {
        // ignore
      }
      return null;
    };
    try {
      const res = await fetchJson(
        "/api/v1/auth/csrf",
        { method: "GET" },
        z
          .object({ success: z.boolean() })
          .passthrough() as unknown as z.ZodType<unknown>,
      );
      return parseToken(res as unknown);
    } catch {
      return null;
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signUpWithEmail(
    email: string,
    password: string,
    phone?: string,
  ): Promise<AuthResponse> {
    // Блокируем повторную регистрацию, если аккаунт уже существует и деактивирован
    try {
      const { data: existing } = await supabase
        .from("clients")
        .select("status")
        .eq("email", email)
        .maybeSingle();
      if (existing && existing.status && existing.status !== "active") {
        throw new Error(
          "Аккаунт деактивирован/в процессе удаления. Восстановите доступ перед регистрацией.",
        );
      }
    } catch {
      // Ignore error - user may already exist in Supabase
    }
    // Проверяем, не используется ли уже этот телефон
    if (phone) {
      const { data: existingClientByPhone } = await supabase
        .from("clients")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();

      if (existingClientByPhone) {
        throw new Error(
          "Пользователь с таким номером телефона уже существует. Попробуйте войти или используйте другой номер.",
        );
      }
    }

    // Создаем пользователя через Supabase Auth с телефоном в метаданных
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone: phone || null,
          name: email.split("@")[0] || "User",
          user_type: "client", // ВАЖНО! Для триггера
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      // Нормализуем сообщение об ошибке для UI с понятными русскими сообщениями
      const errorMessage = String(
        (authError as { message?: string }).message || "",
      ).toLowerCase();

      let message = "Не удалось зарегистрировать пользователя";

      // Обрабатываем разные типы ошибок
      if (
        errorMessage.includes("already") ||
        errorMessage.includes("duplicate") ||
        errorMessage.includes("user_already_exists")
      ) {
        message =
          "Пользователь с таким email уже существует. Попробуйте войти.";
      } else if (
        errorMessage.includes("password") &&
        errorMessage.includes("short")
      ) {
        message = "Пароль слишком короткий. Минимум 6 символов.";
      } else if (errorMessage.includes("weak password")) {
        message = "Пароль слишком простой. Используйте более надежный пароль.";
      } else if (
        errorMessage.includes("email") &&
        errorMessage.includes("invalid")
      ) {
        message = "Некорректный email адрес.";
      } else if (errorMessage.includes("rate limit")) {
        message =
          "Слишком много попыток регистрации. Попробуйте позже через несколько минут.";
      } else if (errorMessage.includes("database")) {
        message = "Ошибка сервера. Попробуйте позже.";
      } else if (errorMessage) {
        // Если есть конкретное сообщение от Supabase, показываем его
        message = `Ошибка регистрации: ${(authError as { message?: string }).message}`;
      }

      const normalizedError = new Error(message) as Error & { status?: number };
      normalizedError.status = (authError as { status?: number }).status;
      throw normalizedError;
    }

    if (!authData.user) {
      throw new Error("Failed to create user");
    }

    // Запись в public.clients создастся АВТОМАТИЧЕСКИ через триггер!
    // НЕ НУЖНО делать дополнительный INSERT

    // Ждем немного чтобы триггер создал запись и пытаемся получить данные клиента
    let clientData: Client | null = null;
    if (authData.session) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Даем триггеру время

      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (clientError) {
        // Если триггер упал (например, из-за duplicate constraint), обрабатываем
        const errorMsg = String(clientError.message || "").toLowerCase();
        if (errorMsg.includes("duplicate") || errorMsg.includes("unique")) {
          throw new Error(
            "Не удалось создать профиль пользователя. Возможно, телефон или email уже используются.",
          );
        }
        logger.warn(
          "Client not found after registration, trigger may be delayed",
          clientError,
        );
      }

      if (client) {
        if (
          (client as { status?: string }).status &&
          (client as { status?: string }).status !== "active"
        ) {
          // Сессию не убиваем — она нужна для восстановления через RPC
          throw new Error(
            "Аккаунт деактивирован/в процессе удаления. Обратитесь в поддержку.",
          );
        }
        clientData = client as Client;
      }
    }

    return {
      success: true,
      client: clientData || undefined,
      session: authData.session || undefined,
    };
  }

  async signInWithPhone(
    phone: string,
    password: string,
  ): Promise<AuthResponse> {
    // Cookie-mode: используем backend /api/v1/auth/login и /api/v1/profile
    if (
      import.meta.env.PROD ||
      (import.meta.env["VITE_AUTH_MODE"] as string) === "cookie"
    ) {
      const digits = (phone || "").replace(/\D/g, "");
      const normalizedPhone = digits
        ? digits.length === 9 && !digits.startsWith("996")
          ? `+996${digits}`
          : digits.startsWith("996")
            ? `+${digits}`
            : digits.startsWith("0") && digits.length === 10
              ? `+996${digits.substring(1)}`
              : `+${digits}`
        : "";
      // CSRF: получаем токен (и сервер ставит cookie XSRF-TOKEN)
      const csrfToken = await this.getCsrfTokenFromServer();
      // 1) Логинимся (cookie устанавливаются сервером)
      await fetchJson(
        "/api/v1/auth/login",
        {
          method: "POST",
          headers: csrfToken ? { "X-CSRF-Token": csrfToken } : undefined,
          body: { phone: normalizedPhone, password },
        },
        z.object({ success: z.boolean() }).passthrough(),
      );
      // 2) Получаем профиль
      // Backend v1.4.4: flat response { success, client_id, email, ... }
      const prof = await fetchJson(
        "/api/v1/profile",
        { method: "GET" },
        z
          .object({
            success: z.boolean(),
            client_id: z.string(),
            email: z.string().optional().nullable(),
            phone: z.string().optional().nullable(),
            name: z.string().optional().nullable(),
            status: z.string().optional().nullable(),
            balance: z.number().optional().nullable(),
          })
          .passthrough(),
      );
      const d = prof as Record<string, unknown>;
      const client: Client = {
        id: String(d["client_id"] || ""),
        email: (d["email"] as string) || undefined,
        phone: String(d["phone"] || ""),
        name: (d["name"] as string) || undefined,
        balance:
          typeof d["balance"] === "number" ? (d["balance"] as number) : 0,
        status: ((d["status"] as string) || "active") as never,
        created_at: (d["created_at"] as string) || new Date().toISOString(),
        updated_at: (d["updated_at"] as string) || new Date().toISOString(),
      };
      return { success: true, client, session: undefined };
    }
    // Нормализуем телефон к E.164 (+996...)
    const digits = (phone || "").replace(/\D/g, "");
    const normalizedPhone = digits
      ? digits.length === 9 && !digits.startsWith("996")
        ? `+996${digits}`
        : digits.startsWith("996")
          ? `+${digits}`
          : digits.startsWith("0") && digits.length === 10
            ? `+996${digits.substring(1)}`
            : `+${digits}`
      : "";

    // Находим клиента по телефону
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("phone", normalizedPhone)
      .single();

    if (clientError || !clientData) {
      throw new Error("Пользователь с таким телефоном не найден");
    }

    // Если у клиента есть email, пытаемся войти через Supabase Auth
    if (clientData.email) {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: clientData.email,
            password: password,
          });

        if (!authError && authData.user) {
          return {
            success: true,
            client: clientData || undefined,
            session: authData.session || undefined,
          };
        }
      } catch {
        // Если не удалось через Supabase Auth, продолжаем
      }
    }

    // Проверяем пароль напрямую (для старых пользователей без Supabase Auth)
    // TODO: В будущем можно добавить проверку через password_hash
    return {
      success: true,
      client: clientData || undefined,
      session: undefined,
    };
  }

  async signInWithEmail(
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    // Cookie-mode: используем backend /api/v1/auth/login и /api/v1/profile
    if (
      import.meta.env.PROD ||
      (import.meta.env["VITE_AUTH_MODE"] as string) === "cookie"
    ) {
      // CSRF: получаем токен (и сервер ставит cookie XSRF-TOKEN)
      const csrfToken = await this.getCsrfTokenFromServer();
      await fetchJson(
        "/api/v1/auth/login",
        {
          method: "POST",
          headers: csrfToken ? { "X-CSRF-Token": csrfToken } : undefined,
          body: { email, password },
        },
        z.object({ success: z.boolean() }).passthrough(),
      );
      // Backend v1.4.5+: flat response с user_type: "client" | "owner"
      const prof = await fetchJson(
        "/api/v1/profile",
        { method: "GET" },
        z
          .object({
            success: z.boolean(),
            user_type: z.enum(["client", "owner"]).optional(),
            client_id: z.string(),
            email: z.string().optional().nullable(),
            phone: z.string().optional().nullable(),
            name: z.string().optional().nullable(),
            status: z.string().optional().nullable(),
            balance: z.number().optional().nullable(),
            // Owner-specific fields
            role: z.string().optional().nullable(),
            is_active: z.boolean().optional().nullable(),
            stations_count: z.number().optional().nullable(),
            locations_count: z.number().optional().nullable(),
          })
          .passthrough(),
      );
      const d = prof as Record<string, unknown>;
      const userType = (d["user_type"] as UserType) || "client";

      // Базовые клиентские данные (есть у всех — и client, и owner)
      const client: Client = {
        id: String(d["client_id"] || ""),
        email: (d["email"] as string) || undefined,
        phone: String(d["phone"] || ""),
        name: (d["name"] as string) || undefined,
        balance:
          typeof d["balance"] === "number" ? (d["balance"] as number) : 0,
        status: ((d["status"] as string) || "active") as never,
        created_at: (d["created_at"] as string) || new Date().toISOString(),
        updated_at: (d["updated_at"] as string) || new Date().toISOString(),
        user_type: userType,
      };

      // Если это владелец станций — добавляем owner данные
      if (userType === "owner") {
        const owner: Owner = {
          id: String(d["client_id"] || d["user_id"] || ""),
          email: String(d["email"] || ""),
          role: (d["role"] as Owner["role"]) || "operator",
          is_active: (d["is_active"] as boolean) ?? true,
          stations_count: (d["stations_count"] as number) || 0,
          locations_count: (d["locations_count"] as number) || 0,
          user_type: "owner",
        };
        // Гибридный ответ: и client, и owner
        return {
          success: true,
          client,
          owner,
          user_type: "owner",
          session: undefined,
        };
      }

      // Обычный клиент
      return { success: true, client, user_type: "client", session: undefined };
    }
    // В режиме разработки используем mock данные только если явно не указано использовать реальный API
    if (
      import.meta.env.DEV &&
      !import.meta.env["VITE_USE_REAL_API"] &&
      !import.meta.env["VITE_SUPABASE_ANON_KEY"]
    ) {
      return {
        success: true,
        client: {
          id: "demo-user-id",
          email: email,
          phone: "+996700000000",
          name: email.split("@")[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          balance: 250.75,
          status: "active",
        },
        session: undefined,
      };
    }

    // Входим через Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      // Обрабатываем ошибку неподтвержденного email
      const errorMessage = String(authError.message || "");
      if (
        errorMessage.includes("Email not confirmed") ||
        errorMessage.includes("email_not_confirmed")
      ) {
        throw new Error(
          "Email не подтвержден. Пожалуйста, проверьте вашу почту и перейдите по ссылке подтверждения.",
        );
      }
      // Сохраняем оригинальную ошибку от Supabase для правильной обработки
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Failed to authenticate");
    }

    // Получаем данные клиента из нашей таблицы
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (clientError || !clientData) {
      // Если клиента нет, создаем его
      const { data: newClient, error: createError } = await supabase
        .from("clients")
        .insert({
          id: authData.user.id,
          email: email,
          name: email.split("@")[0] || "User",
          balance: 0,
        })
        .select()
        .single();

      if (createError) {
        logger.error("Error creating client on signin:", createError);
        throw new Error("Failed to get user data: " + createError.message);
      }

      return {
        success: true,
        client: newClient,
        session: authData.session || undefined,
      };
    }

    // Блокируем вход если аккаунт помечен как неактивный/удаляемый/удалённый
    if (
      (clientData as { status?: string }).status &&
      (clientData as { status?: string }).status !== "active"
    ) {
      // Оставляем сессию активной для RPC восстановления
      throw new Error("Аккаунт деактивирован или в процессе удаления");
    }

    return {
      success: true,
      client: clientData || undefined,
      session: authData.session || undefined,
    };
  }

  async authenticateWithEmail(
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    // Сначала пытаемся войти
    try {
      const result = await this.signInWithEmail(email, password);
      return result;
    } catch (signInError: unknown) {
      logger.debug("Sign in error:", signInError);

      // Проверяем сначала - может пользователь уже существует в auth.users
      const { data: existingUser } = await supabase
        .from("clients")
        .select("id")
        .eq("email", email)
        .single();

      if (existingUser) {
        // Пользователь существует - значит просто неверный пароль
        throw new Error("Неверный пароль");
      }

      // Пользователь не существует - создаем нового
      logger.debug("User not found, creating new account...");
      try {
        return await this.signUpWithEmail(email, password);
      } catch {
        // Если регистрация не удалась, возвращаем оригинальную ошибку входа
        throw new Error("Неверный email или пароль");
      }
    }
  }

  async signOut(): Promise<void> {
    if (!import.meta.env.PROD)
      logger.debug("[AuthService] Attempting sign out...");
    try {
      // Cookie-mode: выходим через backend
      if (
        import.meta.env.PROD ||
        (import.meta.env["VITE_AUTH_MODE"] as string) === "cookie"
      ) {
        try {
          await fetchJson(
            "/api/v1/auth/logout",
            { method: "POST" },
            z.object({ success: z.boolean() }).passthrough(),
          );
        } catch {
          // ignore
        }
        try {
          await pushNotificationService.unregister();
        } catch {
          // ignore
        }
        if (!import.meta.env.PROD)
          logger.debug("[AuthService] Cookie sign out successful");
        return;
      }
      if (isSupabaseConfigured()) {
        // 1) Мгновенно чистим локальную сессию (без сети)
        try {
          await supabase.auth.signOut({
            scope: "local" as "local" | "global" | "others",
          });
        } catch {
          // Ignore error - local signOut is best effort
        }

        // 2) Дополнительно подчистим возможные ключи supabase в localStorage
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));
        } catch {
          // Ignore error - localStorage cleanup is best effort
        }

        // 3) Пытаемся отозвать токен на сервере (не критично)
        await supabaseWithTimeout(() => supabase.auth.signOut(), 2000, {
          error: null,
        });
      }

      // 4) Удаляем FCM токен с бэкенда (при выходе из аккаунта)
      try {
        await pushNotificationService.unregister();
      } catch {
        // Ignore error - push unregister is best effort
      }

      if (!import.meta.env.PROD)
        logger.debug("[AuthService] Sign out successful");
    } catch (error) {
      if (!import.meta.env.PROD)
        logger.error("[AuthService] Sign out error:", error);
    }
  }

  async getCurrentUser(): Promise<Client | null> {
    try {
      // Cookie-mode: профиль через backend
      if (
        import.meta.env.PROD ||
        (import.meta.env["VITE_AUTH_MODE"] as string) === "cookie"
      ) {
        // Backend v1.4.5+: flat response с user_type: "client" | "owner"
        const prof = await fetchJson(
          "/api/v1/profile",
          { method: "GET" },
          z
            .object({
              success: z.boolean(),
              user_type: z.enum(["client", "owner"]).optional(),
              client_id: z.string(),
              email: z.string().optional().nullable(),
              phone: z.string().optional().nullable(),
              name: z.string().optional().nullable(),
              status: z.string().optional().nullable(),
              balance: z.number().optional().nullable(),
              // Owner-specific fields
              role: z.string().optional().nullable(),
              is_active: z.boolean().optional().nullable(),
              admin_id: z.string().optional().nullable(),
              stations_count: z.number().optional().nullable(),
              locations_count: z.number().optional().nullable(),
            })
            .passthrough(),
        );
        const d = prof as Record<string, unknown>;
        if (!d || !d["client_id"]) return null;

        const userType = (d["user_type"] as UserType) || "client";

        // Гибридный клиент — содержит и клиентские, и owner данные (если owner)
        const client: Client = {
          id: String(d["client_id"] || ""),
          email: (d["email"] as string) || undefined,
          phone: String(d["phone"] || ""),
          name: (d["name"] as string) || undefined,
          balance:
            typeof d["balance"] === "number" ? (d["balance"] as number) : 0,
          status: ((d["status"] as string) || "active") as never,
          created_at: (d["created_at"] as string) || new Date().toISOString(),
          updated_at: (d["updated_at"] as string) || new Date().toISOString(),
          user_type: userType,
          // Owner-specific fields
          role:
            userType === "owner"
              ? (d["role"] as Client["role"]) || "operator"
              : undefined,
          is_active:
            userType === "owner"
              ? ((d["is_active"] as boolean) ?? true)
              : undefined,
          stations_count:
            userType === "owner"
              ? (d["stations_count"] as number) || 0
              : undefined,
          locations_count:
            userType === "owner"
              ? (d["locations_count"] as number) || 0
              : undefined,
        };

        // Проверки активности
        if (userType === "owner" && client.is_active === false) return null;
        if (client.status !== "active") return null;

        return client;
      }
      if (!import.meta.env.PROD)
        logger.debug("[AuthService] getCurrentUser: Getting auth user...");

      // Если Supabase не сконфигурирован, возвращаем null
      if (!isSupabaseConfigured()) {
        if (!import.meta.env.PROD)
          logger.debug(
            "[AuthService] getCurrentUser: Supabase not configured, returning null",
          );
        return null;
      }

      // Получаем пользователя с timeout
      const { data, error: authGetError } = await supabaseWithTimeout(
        () => supabase.auth.getUser(),
        5000, // Увеличен timeout до 5 секунд
        { data: { user: null as never }, error: null },
      );

      if (!import.meta.env.PROD) {
        logger.debug("[AuthService] getCurrentUser: getUser response:", {
          hasData: !!data,
          hasUser: !!data?.user,
          userId: data?.user?.id,
          authGetError,
        });
      }

      const user = data?.user ?? null;
      if (!import.meta.env.PROD)
        logger.debug(
          "[AuthService] getCurrentUser: Auth user:",
          user ? user.id : "null",
        );
      if (user) {
        if (!import.meta.env.PROD)
          logger.debug(
            "[AuthService] getCurrentUser: Fetching client data for",
            user.id,
          );
        const { data: clientData, error } = await supabase
          .from("clients")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!import.meta.env.PROD) {
          logger.debug("[AuthService] getCurrentUser: Client query result:", {
            hasClientData: !!clientData,
            clientId: clientData?.id,
            clientEmail: clientData?.email,
            clientStatus: (clientData as { status?: string })?.status,
            balance: clientData?.balance,
            error: error?.message,
          });
        }

        if (!error && clientData) {
          if (
            (clientData as { status?: string }).status &&
            (clientData as { status?: string }).status !== "active"
          ) {
            // Для UI — считаем как неавторизованного
            return null;
          }
          return clientData;
        }
      }

      if (!import.meta.env.PROD)
        logger.debug("[AuthService] getCurrentUser: Returning null");
      return null;
    } catch (error) {
      if (!import.meta.env.PROD)
        logger.error("[AuthService] getCurrentUser error:", error);
      return null;
    }
  }

  async resetPassword(email: string): Promise<void> {
    // Для Supabase Auth пользователей
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) {
      // Для custom auth можно реализовать свой механизм сброса пароля
    }
  }

  // refreshSession удален - Supabase автоматически обновляет токены

  async updatePassword(newPassword: string): Promise<void> {
    // Обновляем в Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      throw error;
    }
  }

  onAuthStateChange(
    callback: (
      event: string,
      session: { user?: { id?: string; [key: string]: unknown } } | null,
    ) => void,
  ) {
    return supabase.auth.onAuthStateChange(callback as never);
  }
}

export const authService = AuthService.getInstance();
