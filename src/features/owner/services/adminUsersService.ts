/**
 * Admin Users API Service
 * Сервис для управления owner-пользователями (только для superadmin)
 */

import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";

export type OwnerRole = "operator" | "admin" | "superadmin" | "partner";

export interface OwnerUser {
  id: string;
  email: string;
  role: OwnerRole;
  is_active: boolean;
  name?: string;
  created_at?: string;
  stations_count: number;
  locations_count: number;
}

export interface CreateUserData {
  email: string;
  password: string;
  role: OwnerRole;
  name?: string;
}

export interface UpdateUserData {
  role?: OwnerRole;
  is_active?: boolean;
  name?: string;
}

export interface UsersListResponse {
  success: boolean;
  users: OwnerUser[];
  total: number;
  page: number;
  per_page: number;
}

export interface UserDetailResponse {
  success: boolean;
  user: OwnerUser;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

// --- Zod Schemas ---

const OwnerUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.enum(["operator", "admin", "superadmin", "partner"]),
  is_active: z.boolean(),
  name: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  stations_count: z.number().default(0),
  locations_count: z.number().default(0),
});

const UsersListResponseSchema = z.object({
  success: z.boolean(),
  users: z.array(OwnerUserSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
}).passthrough();

const UserDetailResponseSchema = z.object({
  success: z.boolean(),
  user: OwnerUserSchema,
}).passthrough();

const MessageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
}).passthrough();

const BASE = "/api/v1/admin/users";

export const adminUsersService = {
  /**
   * Получить список всех owner-пользователей
   */
  async listUsers(params?: {
    page?: number;
    per_page?: number;
    role?: OwnerRole;
    search?: string;
    is_active?: boolean;
  }): Promise<UsersListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.per_page) searchParams.set("per_page", String(params.per_page));
    if (params?.role) searchParams.set("role", params.role);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.is_active !== undefined)
      searchParams.set("is_active", String(params.is_active));

    const query = searchParams.toString();
    const url = query ? `${BASE}?${query}` : BASE;

    return fetchJson(url, { method: "GET" }, UsersListResponseSchema) as Promise<UsersListResponse>;
  },

  /**
   * Получить детали пользователя
   */
  async getUser(userId: string): Promise<UserDetailResponse> {
    return fetchJson(`${BASE}/${userId}`, { method: "GET" }, UserDetailResponseSchema) as Promise<UserDetailResponse>;
  },

  /**
   * Создать нового owner-пользователя
   */
  async createUser(data: CreateUserData): Promise<UserDetailResponse> {
    return fetchJson(BASE, { method: "POST", body: data }, UserDetailResponseSchema) as Promise<UserDetailResponse>;
  },

  /**
   * Обновить пользователя
   */
  async updateUser(
    userId: string,
    data: UpdateUserData,
  ): Promise<UserDetailResponse> {
    return fetchJson(`${BASE}/${userId}`, { method: "PUT", body: data }, UserDetailResponseSchema) as Promise<UserDetailResponse>;
  },

  /**
   * Деактивировать пользователя
   */
  async deleteUser(userId: string): Promise<MessageResponse> {
    return fetchJson(`${BASE}/${userId}`, { method: "DELETE" }, MessageResponseSchema) as Promise<MessageResponse>;
  },

  /**
   * Активировать пользователя
   */
  async activateUser(userId: string): Promise<MessageResponse> {
    return fetchJson(`${BASE}/${userId}/activate`, { method: "POST" }, MessageResponseSchema) as Promise<MessageResponse>;
  },
};
