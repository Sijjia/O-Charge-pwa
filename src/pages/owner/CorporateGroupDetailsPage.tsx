import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePanelBase } from "@/shared/hooks/usePanelBase";
import { Icon } from "@iconify/react";
import {
  useCorporateGroup,
  useUpdateCorporateGroup,
  useUpdateCorporateEmployee,
  useRemoveCorporateEmployee,
  useCorporateReport,
} from "@/features/owner/hooks/useAdminCorporate";
import { CorporateTopupModal } from "@/features/owner/components/CorporateTopupModal";
import { CorporateBlockModal } from "@/features/owner/components/CorporateBlockModal";
import { CorporateAddEmployeeModal } from "@/features/owner/components/CorporateAddEmployeeModal";
import type { CorporateEmployee } from "@/features/owner/services/adminCorporateService";

export function CorporateGroupDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const base = usePanelBase();
  const { data, isLoading, error } = useCorporateGroup(id);
  const group = data?.data;

  const [showTopup, setShowTopup] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState<{
    company_name: string; inn: string; legal_address: string;
    contact_person: string; contact_phone: string; contact_email: string;
  }>({ company_name: "", inn: "", legal_address: "", contact_person: "", contact_phone: "", contact_email: "" });
  const updateGroup = useUpdateCorporateGroup();

  // Employee inline edit
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [empEditFields, setEmpEditFields] = useState<{
    role: string; position: string; monthly_limit: string; daily_limit: string;
  }>({ role: "", position: "", monthly_limit: "", daily_limit: "" });
  const updateEmployee = useUpdateCorporateEmployee();
  const removeEmployee = useRemoveCorporateEmployee();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Report
  const [reportStart, setReportStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0] ?? "";
  });
  const [reportEnd, setReportEnd] = useState(() => new Date().toISOString().split("T")[0] ?? "");
  const [showReport, setShowReport] = useState(false);
  const groupId = id ?? "";
  const { data: reportData, isLoading: reportLoading } = useCorporateReport(
    groupId,
    showReport ? reportStart : "",
    showReport ? reportEnd : "",
  );

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Icon icon="solar:refresh-linear" width={32} className="text-red-500 animate-spin mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0 mt-0.5" width={18} />
          <p className="text-red-400 text-sm">{error instanceof Error ? error.message : "Группа не найдена"}</p>
        </div>
      </div>
    );
  }

  const startEdit = () => {
    setEditFields({
      company_name: group.company_name,
      inn: group.inn || "",
      legal_address: group.legal_address || "",
      contact_person: group.contact_person || "",
      contact_phone: group.contact_phone || "",
      contact_email: group.contact_email || "",
    });
    setIsEditing(true);
  };

  const saveEdit = async () => {
    try {
      await updateGroup.mutateAsync({
        id: group.id,
        body: {
          company_name: editFields.company_name || undefined,
          inn: editFields.inn || null,
          legal_address: editFields.legal_address || null,
          contact_person: editFields.contact_person || null,
          contact_phone: editFields.contact_phone || null,
          contact_email: editFields.contact_email || null,
        },
      });
      setIsEditing(false);
    } catch { /* error handled by mutation */ }
  };

  const startEmpEdit = (emp: CorporateEmployee) => {
    setEditingEmployee(emp.id);
    setEmpEditFields({
      role: emp.role,
      position: emp.position || "",
      monthly_limit: emp.monthly_limit?.toString() || "",
      daily_limit: emp.daily_limit?.toString() || "",
    });
  };

  const saveEmpEdit = async (empId: string) => {
    try {
      await updateEmployee.mutateAsync({
        groupId: group.id,
        employeeId: empId,
        body: {
          role: empEditFields.role || undefined,
          position: empEditFields.position || null,
          monthly_limit: empEditFields.monthly_limit ? parseFloat(empEditFields.monthly_limit) : null,
          daily_limit: empEditFields.daily_limit ? parseFloat(empEditFields.daily_limit) : null,
        },
      });
      setEditingEmployee(null);
    } catch { /* error handled by mutation */ }
  };

  const handleRemoveEmployee = async (empId: string) => {
    try {
      await removeEmployee.mutateAsync({ groupId: group.id, employeeId: empId });
      setConfirmDelete(null);
    } catch { /* error handled by mutation */ }
  };

  const inputCls = "w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-red-500/50 transition-colors";

  const employees = group.employees || [];
  const report = reportData?.data;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(`${base}/corporate`)}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <Icon icon="solar:alt-arrow-left-linear" width={20} className="text-zinc-500" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-display tracking-tight truncate">
              {group.company_name}
            </h1>
            <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${
              group.billing_type === "postpaid" ? "bg-purple-500/10 text-purple-400" : "bg-amber-500/10 text-amber-400"
            }`}>
              {group.billing_type}
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${
              group.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            }`}>
              {group.is_active ? "Активен" : "Заблокирован"}
            </span>
          </div>
          {group.blocked_reason && (
            <p className="text-xs text-red-400 mt-1">Причина: {group.blocked_reason}</p>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Информация</h2>
          {isEditing ? (
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                Отмена
              </button>
              <button
                onClick={saveEdit}
                disabled={updateGroup.isPending}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {updateGroup.isPending && <Icon icon="solar:refresh-linear" width={12} className="animate-spin" />}
                Сохранить
              </button>
            </div>
          ) : (
            <button onClick={startEdit} className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:bg-red-500/10 rounded-lg transition-colors">
              <Icon icon="solar:pen-linear" width={14} />
              Изменить
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: "company_name", label: "Компания" },
              { key: "inn", label: "ИНН" },
              { key: "legal_address", label: "Юр. адрес" },
              { key: "contact_person", label: "Контакт" },
              { key: "contact_phone", label: "Телефон" },
              { key: "contact_email", label: "Email" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs text-zinc-500 mb-1">{f.label}</label>
                <input
                  value={editFields[f.key as keyof typeof editFields] || ""}
                  onChange={(e) => setEditFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "ИНН", value: group.inn, icon: "solar:document-text-linear" },
              { label: "Юр. адрес", value: group.legal_address, icon: "solar:map-point-linear" },
              { label: "Контакт", value: group.contact_person, icon: "solar:user-linear" },
              { label: "Телефон", value: group.contact_phone, icon: "solar:phone-linear" },
              { label: "Email", value: group.contact_email, icon: "solar:letter-linear" },
              { label: "Договор", value: group.contract_number, icon: "solar:clipboard-text-linear" },
            ].map((f) => (
              <div key={f.label} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon={f.icon} width={14} className="text-zinc-400" />
                  <span className="text-xs text-zinc-500">{f.label}</span>
                </div>
                <p className="text-sm text-zinc-900 dark:text-white">{f.value || "—"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Finance + Actions */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Финансы</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-3">
            <p className="text-xs text-zinc-500 mb-1">
              {group.billing_type === "postpaid" ? "Кредитный лимит" : "Баланс"}
            </p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">
              {((group.billing_type === "postpaid" ? group.credit_limit : group.balance) || 0).toLocaleString()} KGS
            </p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-3">
            <p className="text-xs text-zinc-500 mb-1">Потрачено за месяц</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">{(group.current_month_spent || 0).toLocaleString()} KGS</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-3">
            <p className="text-xs text-zinc-500 mb-1">Месячный лимит</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">
              {group.monthly_limit != null ? `${group.monthly_limit.toLocaleString()} KGS` : "Без лимита"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowTopup(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
          >
            <Icon icon="solar:wallet-money-linear" width={18} />
            Пополнить
          </button>
          <button
            onClick={() => setShowBlock(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-[0.98] ${
              group.is_active
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            <Icon icon={group.is_active ? "solar:lock-linear" : "solar:lock-unlocked-linear"} width={18} />
            {group.is_active ? "Заблокировать" : "Разблокировать"}
          </button>
        </div>
      </div>

      {/* Employees */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Сотрудники ({employees.length})</h2>
          <button
            onClick={() => setShowAddEmployee(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Icon icon="solar:add-circle-linear" width={16} />
            Добавить
          </button>
        </div>

        {employees.length > 0 ? (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  {["Телефон", "Имя", "Роль", "Должность", "Лимит/мес", "Лимит/день", "Потрачено", "Статус", ""].map((h) => (
                    <th key={h} className="px-4 py-2 text-[10px] text-zinc-500 font-medium uppercase tracking-wider text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b border-zinc-200/50 dark:border-zinc-800/50 last:border-0">
                    {editingEmployee === emp.id ? (
                      <>
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{emp.phone}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{emp.name}</td>
                        <td className="px-4 py-3">
                          <select
                            value={empEditFields.role}
                            onChange={(e) => setEmpEditFields((p) => ({ ...p, role: e.target.value }))}
                            className="px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg"
                          >
                            <option value="employee">Сотрудник</option>
                            <option value="admin">Админ</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={empEditFields.position}
                            onChange={(e) => setEmpEditFields((p) => ({ ...p, position: e.target.value }))}
                            className="px-2 py-1 text-xs w-24 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={empEditFields.monthly_limit}
                            onChange={(e) => setEmpEditFields((p) => ({ ...p, monthly_limit: e.target.value }))}
                            className="px-2 py-1 text-xs w-20 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={empEditFields.daily_limit}
                            onChange={(e) => setEmpEditFields((p) => ({ ...p, daily_limit: e.target.value }))}
                            className="px-2 py-1 text-xs w-20 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{(emp.current_month_spent || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${
                            emp.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          }`}>{emp.is_active ? "Актив." : "Неакт."}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => saveEmpEdit(emp.id)}
                              disabled={updateEmployee.isPending}
                              className="p-1 hover:bg-emerald-500/10 rounded text-emerald-500"
                            >
                              <Icon icon="solar:check-circle-linear" width={16} />
                            </button>
                            <button onClick={() => setEditingEmployee(null)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400">
                              <Icon icon="solar:close-linear" width={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{emp.phone}</td>
                        <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white">{emp.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${
                            emp.role === "admin" ? "bg-blue-500/10 text-blue-400" : "bg-zinc-500/10 text-zinc-400"
                          }`}>{emp.role === "admin" ? "Админ" : "Сотр."}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-500">{emp.position || "—"}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{emp.monthly_limit != null ? emp.monthly_limit.toLocaleString() : "—"}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{emp.daily_limit != null ? emp.daily_limit.toLocaleString() : "—"}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{(emp.current_month_spent || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${
                            emp.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          }`}>{emp.is_active ? "Актив." : "Неакт."}</span>
                        </td>
                        <td className="px-4 py-3">
                          {confirmDelete === emp.id ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleRemoveEmployee(emp.id)}
                                disabled={removeEmployee.isPending}
                                className="p-1 hover:bg-red-500/10 rounded text-red-500 text-xs"
                              >
                                <Icon icon="solar:check-circle-linear" width={16} />
                              </button>
                              <button onClick={() => setConfirmDelete(null)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400">
                                <Icon icon="solar:close-linear" width={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <button onClick={() => startEmpEdit(emp as CorporateEmployee)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400">
                                <Icon icon="solar:pen-linear" width={14} />
                              </button>
                              <button onClick={() => setConfirmDelete(emp.id)} className="p-1 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400">
                                <Icon icon="solar:trash-bin-minimalistic-linear" width={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-zinc-500 text-center py-6">Нет сотрудников в группе</p>
        )}
      </div>

      {/* Report */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Отчёт</h2>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">С</label>
            <input type="date" value={reportStart} onChange={(e) => setReportStart(e.target.value)} className={`${inputCls} w-auto`} />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">По</label>
            <input type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} className={`${inputCls} w-auto`} />
          </div>
          <button
            onClick={() => setShowReport(true)}
            disabled={reportLoading}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg text-sm transition-colors"
          >
            {reportLoading ? (
              <Icon icon="solar:refresh-linear" width={16} className="animate-spin" />
            ) : (
              <Icon icon="solar:chart-2-linear" width={16} />
            )}
            Загрузить отчёт
          </button>
        </div>

        {report && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-3">
                <p className="text-xs text-zinc-500 mb-1">Всего сумма</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{report.summary.total_amount.toLocaleString()} KGS</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-3">
                <p className="text-xs text-zinc-500 mb-1">Сессий</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{report.summary.sessions_count}</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-3">
                <p className="text-xs text-zinc-500 mb-1">Сотрудников заряжалось</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{report.summary.employees_charged}</p>
              </div>
            </div>

            {report.by_employee.length > 0 && (
              <div className="overflow-x-auto -mx-6">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      {["Сотрудник", "Должность", "Сессий", "Сумма"].map((h) => (
                        <th key={h} className="px-4 py-2 text-[10px] text-zinc-500 font-medium uppercase tracking-wider text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.by_employee.map((row) => (
                      <tr key={row.employee_id} className="border-b border-zinc-200/50 dark:border-zinc-800/50 last:border-0">
                        <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white">{row.name}</td>
                        <td className="px-4 py-3 text-sm text-zinc-500">{row.position || "—"}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{row.sessions_count}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{row.amount.toLocaleString()} KGS</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showTopup && (
        <CorporateTopupModal
          groupId={group.id}
          companyName={group.company_name}
          currentBalance={group.balance || 0}
          onClose={() => setShowTopup(false)}
        />
      )}
      {showBlock && (
        <CorporateBlockModal
          groupId={group.id}
          companyName={group.company_name}
          isBlocked={!group.is_active}
          onClose={() => setShowBlock(false)}
        />
      )}
      {showAddEmployee && (
        <CorporateAddEmployeeModal
          groupId={group.id}
          onClose={() => setShowAddEmployee(false)}
        />
      )}
    </div>
  );
}

export default CorporateGroupDetailsPage;
