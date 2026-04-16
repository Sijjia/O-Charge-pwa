/**
 * Owner Users Page
 * Управление owner-пользователями (только для superadmin)
 */

import { useState } from "react";
import { Icon } from "@iconify/react";
import {
  useAdminUsers,
  useDeleteUser,
  useActivateUser,
} from "@/features/owner/hooks/useAdminUsers";
import { CreateUserModal } from "@/features/owner/components/CreateUserModal";
import { EditUserModal } from "@/features/owner/components/EditUserModal";
import { useToast } from "@/shared/hooks/useToast";
import type {
  OwnerUser,
  OwnerRole,
} from "@/features/owner/services/adminUsersService";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminSearchBar } from "@/features/admin/components/AdminSearchBar";
import { AdminStatusBadge } from "@/features/admin/components/AdminStatusBadge";
import { FilterSelect, AdminFilterBar } from "@/features/admin/components/AdminFilterBar";

const roleLabels: Record<OwnerRole, string> = {
  operator: "Оператор",
  admin: "Администратор",
  superadmin: "Суперадмин",
  partner: "Партнер",
};

const roleIcons: Record<OwnerRole, string> = {
  operator: "solar:shield-linear",
  admin: "solar:shield-check-linear",
  superadmin: "solar:shield-warning-linear",
  partner: "solar:shop-linear",
};

const roleColors: Record<OwnerRole, string> = {
  operator: "bg-blue-500/15 text-blue-400",
  admin: "bg-purple-500/15 text-purple-400",
  superadmin: "bg-red-500/15 text-red-400",
  partner: "bg-emerald-500/15 text-emerald-400",
};

export function OwnerUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<OwnerRole | "">("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<OwnerUser | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<OwnerUser | null>(null);
  const toast = useToast();

  const { data, isLoading, error } = useAdminUsers({
    search: searchQuery || undefined,
    role: roleFilter || undefined,
  });

  const deleteUserMutation = useDeleteUser();
  const activateUserMutation = useActivateUser();

  const handleDeactivate = (user: OwnerUser) => {
    setConfirmTarget(user);
    setActiveMenu(null);
  };

  const confirmDeactivate = async () => {
    if (!confirmTarget) return;
    try {
      await deleteUserMutation.mutateAsync(confirmTarget.id);
      toast.success(`Пользователь ${confirmTarget.email} деактивирован`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка деактивации");
    }
    setConfirmTarget(null);
  };

  const handleActivate = async (user: OwnerUser) => {
    try {
      await activateUserMutation.mutateAsync(user.id);
      setActiveMenu(null);
      toast.success(`Пользователь ${user.email} активирован`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка активации");
    }
  };

  const handleEdit = (user: OwnerUser) => {
    setEditingUser(user);
    setActiveMenu(null);
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <AdminPageHeader
          title="Пользователи" helpText="Управление аккаунтами операторов и администраторов системы. Оператор — может смотреть данные. Админ — полный доступ. Суперадмин — управление другими админами."
          subtitle="Управление owner-пользователями системы"
          actionLabel="Добавить пользователя"
          actionIcon="solar:add-circle-linear"
          onAction={() => setShowCreateModal(true)}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <AdminSearchBar
          placeholder="Поиск по email или имени..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <AdminFilterBar>
          <FilterSelect
            label="Роль"
            value={roleFilter}
            onChange={(v) => setRoleFilter(v as OwnerRole | "")}
            options={[
              { value: "", label: "Все роли" },
              { value: "operator", label: "Операторы" },
              { value: "admin", label: "Администраторы" },
              { value: "superadmin", label: "Суперадмины" },
            ]}
            icon="solar:shield-linear"
          />
        </AdminFilterBar>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Icon icon="solar:refresh-linear" width={32} className="text-zinc-500 dark:text-zinc-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">
              {error instanceof Error ? error.message : "Ошибка загрузки"}
            </p>
          </div>
        ) : !data?.users?.length ? (
          <div className="text-center py-12">
            <Icon icon="solar:users-group-rounded-linear" width={48} className="text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400">Пользователи не найдены</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Станции / Локации
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {data.users.map((user) => {
                  const roleIconName = roleIcons[user.role];
                  return (
                    <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">
                            {user.name || "—"}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}
                        >
                          <Icon icon={roleIconName} width={14} />
                          {roleLabels[user.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <AdminStatusBadge
                          variant={user.is_active ? "online" : "offline"}
                          label={user.is_active ? "Активен" : "Неактивен"}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                        {user.stations_count} / {user.locations_count}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() =>
                              setActiveMenu(
                                activeMenu === user.id ? null : user.id,
                              )
                            }
                            className="p-2 text-zinc-500 dark:text-gray-400 hover:text-zinc-600 dark:hover:text-gray-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                          >
                            <Icon icon="solar:menu-dots-bold" width={20} />
                          </button>

                          {activeMenu === user.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActiveMenu(null)}
                              />
                              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-zinc-900 rounded-lg shadow-lg dark:shadow-black/40 border border-zinc-200 dark:border-zinc-800 py-1 z-20">
                                <button
                                  onClick={() => handleEdit(user)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"
                                >
                                  <Icon icon="solar:pen-linear" width={16} />
                                  Редактировать
                                </button>
                                {user.is_active ? (
                                  <button
                                    onClick={() => handleDeactivate(user)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-500/10"
                                  >
                                    <Icon icon="solar:user-cross-linear" width={16} />
                                    Деактивировать
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleActivate(user)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10"
                                  >
                                    <Icon icon="solar:user-check-linear" width={16} />
                                    Активировать
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination info */}
        {data && data.total > 0 && (
          <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-white/5 text-sm text-zinc-500 dark:text-zinc-400">
            Показано {data.users.length} из {data.total} пользователей
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
      />

      {/* Confirm Deactivate Dialog */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <Icon icon="solar:user-cross-linear" width={24} className="text-red-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white text-center mb-2">Деактивировать?</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6">
              Пользователь <span className="text-zinc-900 dark:text-white font-medium">{confirmTarget.email}</span> потеряет доступ к системе.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmTarget(null)}
                className="flex-1 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={confirmDeactivate}
                disabled={deleteUserMutation.isPending}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {deleteUserMutation.isPending ? "..." : "Деактивировать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
