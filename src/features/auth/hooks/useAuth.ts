import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUnifiedAuthStore as useAuthStore } from "../unifiedAuthStore";
import { authService, sendOTP, verifyOTP } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { logger } from "@/shared/utils/logger";

// ========== OTP Auth Hooks (Recommended) ==========

/**
 * Hook для отправки OTP кода на телефон
 */
export const useSendOTP = () => {
  return useMutation({
    mutationFn: async (phone: string) => {
      return sendOTP(phone);
    },
  });
};

/**
 * Hook для проверки OTP кода и входа
 */
export const useVerifyOTP = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
      return verifyOTP(phone, code);
    },
    onSuccess: async (data) => {
      if (data.success) {
        // Получаем данные пользователя и обновляем store
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
        }

        // Редирект в зависимости от типа пользователя
        if (data.user_type === "owner") {
          navigate("/owner", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }
    },
  });
};

// ========== Legacy Auth Hooks (Deprecated) ==========

interface SignInRequest {
  email?: string;
  phone?: string;
  password: string;
}

interface SignUpRequest {
  email: string;
  phone: string;
  password: string;
}

/**
 * @deprecated Используйте useSendOTP и useVerifyOTP вместо этого хука
 * Sign In mutation - для входа существующих пользователей (clients И owners)
 */
export const useSignIn = () => {
  const { login, loginAsOwner } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: SignInRequest) => {
      // Определяем, что использовать - email или phone
      if (data.phone) {
        const result = await authService.signInWithPhone(
          data.phone,
          data.password,
        );
        return result;
      } else if (data.email) {
        const result = await authService.signInWithEmail(
          data.email,
          data.password,
        );
        return result;
      } else {
        throw new Error("Email или телефон обязателен");
      }
    },
    onSuccess: (data, _variables) => {
      if (!data.success || !data.client) return;

      // Создаём unified user из client данных
      const unifiedUser = {
        id: data.client.id,
        email: data.client.email || null,
        phone: data.client.phone || null,
        name: data.client.name || "User",
        balance: data.client.balance || 0,
        status: "active" as const,
        favoriteStations: [] as string[],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Owner-specific fields (для гибридного подхода)
        roles: data.client.role ? [data.client.role] : undefined,
      };

      // Гибридный подход: сохраняем и user, и owner (если есть)
      if (data.user_type === "owner" && data.owner) {
        // Owner — сохраняем оба объекта
        login(unifiedUser);
        loginAsOwner(data.owner);
      } else {
        // Обычный клиент
        login(unifiedUser);
      }

      // Всегда редирект на главную — owner может использовать приложение как клиент
      navigate("/", { replace: true });
    },
  });
};

/**
 * @deprecated Используйте useSendOTP и useVerifyOTP - регистрация автоматическая при первом входе
 * Sign Up mutation - для регистрации новых пользователей
 */
export const useSignUp = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: SignUpRequest) => {
      const result = await authService.signUpWithEmail(
        data.email,
        data.password,
        data.phone,
      );
      return result;
    },
    onSuccess: (data, _variables) => {
      // Логиним только если есть session (email подтвержден автоматически)
      // Если session === null, значит требуется подтверждение email
      if (data.success && data.session && data.client) {
        // Преобразуем Client в UnifiedUser
        const unifiedUser = {
          id: data.client.id,
          email: data.client.email || null,
          phone: data.client.phone || null,
          name: data.client.name || "User",
          balance: data.client.balance || 0,
          status: "active" as const,
          favoriteStations: [] as string[],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        login(unifiedUser);
        navigate("/", { replace: true });
      }
    },
  });
};

/**
 * @deprecated Используйте useSendOTP и useVerifyOTP вместо этого хука
 */
export const useLogin = useSignIn;

// Logout mutation
export const useLogout = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!import.meta.env.PROD) logger.debug("[useLogout] Starting logout...");
      await authService.signOut();
      if (!import.meta.env.PROD)
        logger.debug("[useLogout] AuthService signOut completed");
      return Promise.resolve();
    },
    onSuccess: () => {
      if (!import.meta.env.PROD)
        logger.debug(
          "[useLogout] onSuccess called, clearing store, cache and navigating...",
        );

      // 1. Очищаем Zustand store (и localStorage)
      logout();

      // 2. Очищаем React Query cache чтобы не было данных от предыдущего пользователя
      queryClient.clear();

      // 3. Дополнительная очистка localStorage (уже делается в logout, но для надежности)
      try {
        localStorage.removeItem("skipped_auth");
      } catch {
        // Ignore storage errors
      }

      // После логаута открываем главную
      navigate("/", { replace: true });
    },
    onError: (error) => {
      if (!import.meta.env.PROD)
        logger.error("[useLogout] Error during logout:", error);
      // Даже при ошибке очищаем локальное состояние
      logout();
      queryClient.clear();
    },
  });
};

// Check if user is authenticated
export const useAuthStatus = () => {
  const { isAuthenticated, user, owner, userType, isInitialized } =
    useAuthStore();

  return {
    isAuthenticated,
    user,
    owner,
    userType,
    phone: user?.phone || null,
    isInitialized,
    isLoading: !isInitialized, // Loading пока не завершена инициализация
  };
};

// Alias for useAuthStatus for backward compatibility
export const useAuth = useAuthStatus;
