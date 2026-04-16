/**
 * React Query hooks для управления owner-пользователями
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminUsersService,
  type OwnerRole,
  type CreateUserData,
  type UpdateUserData,
} from "../services/adminUsersService";

const USERS_QUERY_KEY = ["admin", "users"];

/**
 * Получить список всех owner-пользователей
 */
export function useAdminUsers(params?: {
  page?: number;
  per_page?: number;
  role?: OwnerRole;
  search?: string;
  is_active?: boolean;
}) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, params],
    queryFn: () => adminUsersService.listUsers(params),
    staleTime: 30 * 1000, // 30 секунд
  });
}

/**
 * Получить детали пользователя
 */
export function useAdminUser(userId: string | undefined) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, userId],
    queryFn: () => adminUsersService.getUser(userId!),
    enabled: !!userId,
  });
}

/**
 * Создать нового пользователя
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserData) => adminUsersService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

/**
 * Обновить пользователя
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserData }) =>
      adminUsersService.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

/**
 * Деактивировать пользователя
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminUsersService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

/**
 * Активировать пользователя
 */
export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminUsersService.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
