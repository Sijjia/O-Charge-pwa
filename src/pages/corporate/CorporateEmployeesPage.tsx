import { useState } from "react";
import { Icon } from "@iconify/react";
import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EmployeeAddModal } from "@/features/corporate/EmployeeAddModal";
import { EmployeeEditModal } from "@/features/corporate/EmployeeEditModal";
import { logger } from "@/shared/utils/logger";

const EmployeeSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  role: z.string(),
  position: z.string().nullable().optional(),
  monthly_limit: z.number().nullable().optional(),
  daily_limit: z.number().nullable().optional(),
  current_month_spent: z.number(),
  current_day_spent: z.number(),
  remaining: z.number().nullable().optional(),
  is_active: z.boolean(),
  phone: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
});

const EmployeesResponseSchema = z.object({
  success: z.boolean(),
  employees: z.array(EmployeeSchema),
}).passthrough();

type Employee = z.infer<typeof EmployeeSchema>;

const DeleteResponseSchema = z.object({ success: z.boolean() }).passthrough();

function corporateHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("corporateToken") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function CorporateEmployeesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["corporate-employees"],
    queryFn: () =>
      fetchJson(
        "/api/v1/corporate/employees",
        { method: "GET", headers: corporateHeaders() },
        EmployeesResponseSchema,
      ),
  });

  const employees = data?.employees || [];
  const filtered = employees.filter((emp) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (emp.name && emp.name.toLowerCase().includes(q)) ||
      (emp.phone && emp.phone.includes(q)) ||
      (emp.position && emp.position.toLowerCase().includes(q))
    );
  });

  const handleRemove = async (emp: Employee) => {
    if (removingId) return;
    setRemovingId(emp.id);
    try {
      await fetchJson(
        `/api/v1/corporate/employees/${emp.id}`,
        { method: "DELETE", headers: corporateHeaders() },
        DeleteResponseSchema,
      );
      queryClient.invalidateQueries({ queryKey: ["corporate-employees"] });
    } catch (err) {
      logger.error("[CorporateEmployees] Remove error:", err);
    } finally {
      setRemovingId(null);
    }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    queryClient.invalidateQueries({ queryKey: ["corporate-employees"] });
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Icon icon="solar:refresh-linear" width={32} className="text-red-500 animate-spin mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Загрузка сотрудников...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0 mt-0.5" width={18} />
          <p className="text-red-400 text-sm">
            {error instanceof Error ? error.message : "Не удалось загрузить сотрудников"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-display tracking-tight">
            Сотрудники
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {employees.length > 0
              ? `${employees.length} сотрудник${employees.length === 1 ? "" : employees.length < 5 ? "а" : "ов"}`
              : "Управление доступом сотрудников"}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
        >
          <Icon icon="solar:user-plus-linear" width={18} />
          <span className="hidden sm:inline">Добавить</span>
        </button>
      </div>

      {/* Search */}
      {employees.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Icon
              icon="solar:magnifer-linear"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              width={20}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени или телефону..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Employee List or Empty State */}
      {filtered.length > 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none transition-colors">
          {/* Desktop header */}
          <div className="hidden md:grid grid-cols-[1fr_120px_120px_100px_80px] gap-4 px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 font-medium uppercase tracking-wider">
            <span>Сотрудник</span>
            <span>Лимит/мес</span>
            <span>Расход</span>
            <span>Остаток</span>
            <span />
          </div>

          {filtered.map((emp) => (
            <div
              key={emp.id}
              className="flex flex-col md:grid md:grid-cols-[1fr_120px_120px_100px_80px] gap-2 md:gap-4 px-5 py-4 border-b border-zinc-200/50 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/20 transition-colors"
            >
              {/* Name + phone */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                  <Icon icon="solar:user-linear" width={18} className="text-zinc-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-zinc-900 dark:text-white font-medium truncate">
                    {emp.name || "Без имени"}
                  </p>
                  <p className="text-xs text-zinc-500 font-mono">{emp.phone || "—"}</p>
                </div>
                {emp.role === "admin" && (
                  <span className="ml-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 rounded-full">
                    admin
                  </span>
                )}
              </div>

              {/* Limit */}
              <div className="flex md:items-center">
                <span className="text-xs text-zinc-400 dark:text-zinc-600 md:hidden mr-2">Лимит:</span>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {emp.monthly_limit != null ? `${Math.round(emp.monthly_limit)} с` : "∞"}
                </span>
              </div>

              {/* Spent */}
              <div className="flex md:items-center">
                <span className="text-xs text-zinc-400 dark:text-zinc-600 md:hidden mr-2">Расход:</span>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {Math.round(emp.current_month_spent)} с
                </span>
              </div>

              {/* Remaining */}
              <div className="flex md:items-center">
                <span className="text-xs text-zinc-400 dark:text-zinc-600 md:hidden mr-2">Остаток:</span>
                <span className={`text-sm font-medium ${
                  emp.remaining != null && emp.remaining < 100
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}>
                  {emp.remaining != null ? `${Math.round(emp.remaining)} с` : "∞"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => setEditingEmployee(emp)}
                  className="w-8 h-8 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                  title="Редактировать"
                >
                  <Icon icon="solar:pen-2-linear" width={16} />
                </button>
                {emp.role !== "admin" && (
                  <button
                    onClick={() => handleRemove(emp)}
                    disabled={removingId === emp.id}
                    className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors"
                    title="Удалить"
                  >
                    {removingId === emp.id ? (
                      <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      <Icon icon="solar:trash-bin-minimalistic-linear" width={16} />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : employees.length > 0 ? (
        /* Search returned nothing */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center shadow-sm dark:shadow-none transition-colors">
          <Icon icon="solar:magnifer-linear" width={32} className="text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Ничего не найдено по запросу "{searchQuery}"</p>
        </div>
      ) : (
        /* No employees at all */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm dark:shadow-none transition-colors">
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <Icon
                icon="solar:users-group-rounded-linear"
                width={36}
                className="text-zinc-400 dark:text-zinc-600"
              />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Нет сотрудников
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm mb-6">
              Добавьте сотрудников, чтобы они могли заряжать электромобили за счёт
              компании
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
            >
              <Icon icon="solar:user-plus-linear" width={18} />
              Добавить сотрудника
            </button>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <EmployeeAddModal onClose={handleModalClose} />
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <EmployeeEditModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSuccess={() => {
            setEditingEmployee(null);
            queryClient.invalidateQueries({ queryKey: ["corporate-employees"] });
          }}
        />
      )}
    </div>
  );
}

export default CorporateEmployeesPage;
