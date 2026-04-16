/**
 * Operators Page
 * Управление операторами (для admin/superadmin)
 */

import { useState } from "react";
import { Icon } from "@iconify/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";
import { useToast } from "@/shared/hooks/useToast";

// Schemas
const OperatorSchema = z.object({
  id: z.string(),
  phone: z.string(),
  name: z.string().nullable().optional(),
  is_active: z.boolean(),
});

const OperatorsListSchema = z.object({
  success: z.boolean(),
  operators: z.array(OperatorSchema),
});

const MessageSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

type Operator = z.infer<typeof OperatorSchema>;

// API Functions
async function fetchOperators(): Promise<z.infer<typeof OperatorsListSchema>> {
  return fetchJson("/api/v1/admin/operators", { method: "GET" }, OperatorsListSchema);
}

async function createOperator(data: {
  phone: string;
  name?: string;
}): Promise<Operator> {
  return fetchJson("/api/v1/admin/operators", { method: "POST", body: data }, OperatorSchema);
}

async function deactivateOperator(id: string): Promise<void> {
  await fetchJson(`/api/v1/admin/operators/${id}`, { method: "DELETE" }, MessageSchema);
}

async function activateOperator(id: string): Promise<void> {
  await fetchJson(`/api/v1/admin/operators/${id}/activate`, { method: "POST" }, MessageSchema);
}

export function OperatorsPage() {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState("+996");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Operator | null>(null);
  const toast = useToast();

  const {
    data,
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey: ["operators"],
    queryFn: fetchOperators,
  });

  const createMutation = useMutation({
    mutationFn: createOperator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operators"] });
      setPhone("+996");
      setName("");
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateOperator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operators"] });
      toast.success("Оператор деактивирован");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const activateMutation = useMutation({
    mutationFn: activateOperator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operators"] });
      toast.success("Оператор активирован");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^\d+]/g, "");
    if (!value.startsWith("+")) {
      value = "+" + value.replace(/\+/g, "");
    }
    setPhone(value);
    setError(null);
  };

  const handleCreate = () => {
    if (phone.length < 10) {
      setError("Введите корректный номер телефона");
      return;
    }
    createMutation.mutate({ phone, name: name || undefined });
  };

  const handleDeactivate = (op: Operator) => {
    setConfirmTarget(op);
  };

  const confirmDeactivate = () => {
    if (!confirmTarget) return;
    deactivateMutation.mutate(confirmTarget.id);
    setConfirmTarget(null);
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Icon icon="solar:users-group-rounded-linear" width={28} className="text-zinc-500 dark:text-gray-400" />
          Операторы
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Управление операторами вашей сети станций
        </p>
      </div>

      {/* Create Form */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-black/20 border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <Icon icon="solar:user-plus-linear" width={20} className="text-red-500" />
          Добавить оператора
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-1">
              Номер телефона
            </label>
            <div className="relative">
              <Icon icon="solar:phone-linear" width={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-gray-400" />
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+996 XXX XXX XXX"
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-1">
              Имя (необязательно)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя оператора"
              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={createMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createMutation.isPending ? (
            <Icon icon="solar:refresh-linear" width={20} className="animate-spin" />
          ) : (
            <Icon icon="solar:user-plus-linear" width={20} />
          )}
          {createMutation.isPending ? "Создание..." : "Добавить оператора"}
        </button>

        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3">
          Оператор сможет войти через SMS-код по указанному номеру
        </p>
      </div>

      {/* Operators List */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-black/20 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Мои операторы</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Icon icon="solar:refresh-linear" width={32} className="text-zinc-500 dark:text-gray-400 animate-spin" />
          </div>
        ) : loadError ? (
          <div className="text-center py-12">
            <p className="text-red-600">
              {loadError instanceof Error
                ? loadError.message
                : "Ошибка загрузки"}
            </p>
          </div>
        ) : !data?.operators?.length ? (
          <div className="text-center py-12">
            <Icon icon="solar:users-group-rounded-linear" width={48} className="text-zinc-600 dark:text-gray-300 mx-auto mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400">Нет операторов</p>
            <p className="text-zinc-500 dark:text-gray-400 text-sm mt-1">
              Добавьте оператора по номеру телефона
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {data.operators.map((op) => (
              <div
                key={op.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-zinc-100 dark:hover:bg-zinc-900/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/15 rounded-full flex items-center justify-center">
                    <Icon icon="solar:users-group-rounded-linear" width={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {op.name || "Без имени"}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{op.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {op.is_active ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                        <span className="w-2 h-2 bg-green-500/100 rounded-full" />
                        Активен
                      </span>
                      <button
                        onClick={() => handleDeactivate(op)}
                        disabled={deactivateMutation.isPending}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Деактивировать"
                      >
                        <Icon icon="solar:trash-bin-2-linear" width={20} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-gray-500 text-sm">
                        <span className="w-2 h-2 bg-gray-400 rounded-full" />
                        Неактивен
                      </span>
                      <button
                        onClick={() => activateMutation.mutate(op.id)}
                        disabled={activateMutation.isPending}
                        className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                        title="Активировать"
                      >
                        <Icon icon="solar:user-check-linear" width={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {data && data.operators.length > 0 && (
          <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-sm text-zinc-500 dark:text-zinc-400">
            Всего операторов: {data.operators.length}
          </div>
        )}
      </div>

      {/* Confirm Deactivate Dialog */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <Icon icon="solar:trash-bin-2-linear" width={24} className="text-red-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white text-center mb-2">Деактивировать оператора?</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6">
              Оператор <span className="text-zinc-900 dark:text-white font-medium">{confirmTarget.phone}</span> потеряет доступ к системе.
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
                disabled={deactivateMutation.isPending}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {deactivateMutation.isPending ? "..." : "Деактивировать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OperatorsPage;
