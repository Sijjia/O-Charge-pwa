/**
 * Edit User Modal
 * Модалка для редактирования owner-пользователя
 */

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useUpdateUser } from "../hooks/useAdminUsers";
import type { OwnerUser, OwnerRole } from "../services/adminUsersService";

interface EditUserModalProps {
  user: OwnerUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditUserModal({ user, isOpen, onClose }: EditUserModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<OwnerRole>("operator");
  const [error, setError] = useState("");

  const updateUserMutation = useUpdateUser();

  // Синхронизация с пользователем при открытии
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setRole(user.role);
      setError("");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user) return;

    try {
      await updateUserMutation.mutateAsync({
        userId: user.id,
        data: {
          role,
          name: name || undefined,
        },
      });
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Ошибка обновления пользователя",
      );
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl dark:shadow-black/40 w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Редактировать пользователя
          </h2>
          <button
            onClick={onClose}
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

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 text-zinc-400 dark:text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-zinc-400 dark:text-gray-500">Email нельзя изменить</p>
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
              Роль
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

          {/* Status info */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 dark:text-gray-400">Статус:</span>
              {user.is_active ? (
                <span className="text-green-600 font-medium">Активен</span>
              ) : (
                <span className="text-zinc-400 dark:text-gray-500 font-medium">Неактивен</span>
              )}
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-zinc-500 dark:text-gray-400">Станции:</span>
              <span className="font-medium">{user.stations_count}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-zinc-500 dark:text-gray-400">Локации:</span>
              <span className="font-medium">{user.locations_count}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-gray-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900/50 font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={updateUserMutation.isPending}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updateUserMutation.isPending && (
                <Icon icon="solar:refresh-linear" width={16} className="animate-spin" />
              )}
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
