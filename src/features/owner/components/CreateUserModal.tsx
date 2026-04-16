/**
 * Create User Modal
 * Модалка для создания нового owner-пользователя
 */

import { useState } from "react";
import { Icon } from "@iconify/react";
import { useCreateUser } from "../hooks/useAdminUsers";
import type { OwnerRole } from "../services/adminUsersService";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<OwnerRole>("operator");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const createUserMutation = useCreateUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email и пароль обязательны");
      return;
    }

    if (password.length < 8) {
      setError("Пароль должен быть не менее 8 символов");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        email,
        password,
        role,
        name: name || undefined,
      });
      // Успех — закрываем и сбрасываем форму
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка создания пользователя");
    }
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setName("");
    setRole("operator");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl dark:shadow-black/40 w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Добавить пользователя
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-500 dark:text-gray-400 hover:text-zinc-500 dark:hover:text-gray-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Закрыть"
          >
            <Icon icon="solar:close-linear" width={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-1">
              Пароль <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                className="w-full px-4 py-2.5 pr-12 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-gray-400 hover:text-zinc-500 dark:hover:text-gray-400"
              >
                {showPassword ? (
                  <Icon icon="solar:eye-closed-linear" width={20} />
                ) : (
                  <Icon icon="solar:eye-linear" width={20} />
                )}
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-1">
              Имя
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иван Иванов"
              className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-1">
              Роль <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as OwnerRole)}
              className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-zinc-900"
            >
              <option value="operator">Оператор</option>
              <option value="admin">Администратор</option>
              <option value="superadmin">Суперадмин</option>
            </select>
            <p className="mt-1 text-xs text-zinc-400 dark:text-gray-500">
              {role === "operator" && "Может управлять своими станциями"}
              {role === "admin" &&
                "Расширенный доступ к аналитике и инцидентам"}
              {role === "superadmin" &&
                "Полный доступ ко всем функциям системы"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-gray-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900/50 font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={createUserMutation.isPending}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createUserMutation.isPending && (
                <Icon icon="solar:refresh-linear" width={16} className="animate-spin" />
              )}
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
