import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePanelBase } from "@/shared/hooks/usePanelBase";
import { Icon } from "@iconify/react";
import { useCorporateGroups } from "@/features/owner/hooks/useAdminCorporate";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminSearchBar } from "@/features/admin/components/AdminSearchBar";
import { AdminStatCard } from "@/features/admin/components/AdminStatCard";
import { AdminStatusBadge } from "@/features/admin/components/AdminStatusBadge";

export function OwnerCorporateGroupsPage() {
  const navigate = useNavigate();
  const base = usePanelBase();
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const { data, isLoading, error } = useCorporateGroups(showInactive);
  const groups = data?.groups || [];

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter(
      (g) =>
        g.company_name.toLowerCase().includes(q) ||
        (g.inn && g.inn.toLowerCase().includes(q)) ||
        (g.contact_person && g.contact_person.toLowerCase().includes(q))
    );
  }, [groups, searchQuery]);

  const stats = useMemo(() => ({
    total: groups.length,
    active: groups.filter((g) => g.is_active).length,
    prepaid: groups.filter((g) => g.billing_type === "prepaid").length,
    postpaid: groups.filter((g) => g.billing_type === "postpaid").length,
  }), [groups]);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Icon icon="solar:refresh-linear" width={32} className="text-red-500 animate-spin mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Загрузка корпоративных клиентов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0 mt-0.5" width={18} />
          <p className="text-red-400 text-sm">{error instanceof Error ? error.message : "Не удалось загрузить корпоративных клиентов"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <AdminPageHeader
          title="Корпоративные" helpText="Корпоративные клиенты — компании, чьи сотрудники заряжают электромобили. У каждой группы свой баланс, лимиты и списки сотрудников. Оплата по счёту."
          subtitle="Управление корпоративными клиентами"
          actionLabel="Создать группу"
          actionIcon="solar:add-circle-linear"
          onAction={() => navigate(`${base}/corporate/create`)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <AdminStatCard label="Всего групп" value={stats.total} icon="solar:buildings-2-linear" />
        <AdminStatCard label="Активных" value={stats.active} icon="solar:check-circle-linear" />
        <AdminStatCard label="Prepaid" value={stats.prepaid} icon="solar:wallet-linear" />
        <AdminStatCard label="Postpaid" value={stats.postpaid} icon="solar:card-linear" />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <AdminSearchBar
          placeholder="Поиск по компании, ИНН, контакту..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <label className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-nowrap">Заблокированные</span>
        </label>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-[1fr_100px_120px_80px_80px_60px] gap-4 px-5 py-3 bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 font-medium uppercase tracking-wider">
            <span>Компания</span>
            <span>Тип</span>
            <span>Баланс / Лимит</span>
            <span>Сотр.</span>
            <span>Статус</span>
            <span />
          </div>
          {filtered.map((group) => (
            <div
              key={group.id}
              onClick={() => navigate(`${base}/corporate/${group.id}`)}
              className="flex flex-col md:grid md:grid-cols-[1fr_100px_120px_80px_80px_60px] gap-2 md:gap-4 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              {/* Company */}
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{group.company_name}</p>
                {group.inn && (
                  <p className="text-xs text-zinc-500 truncate">ИНН: {group.inn}</p>
                )}
              </div>

              {/* Billing type */}
              <div className="flex items-center">
                <span className="text-xs text-zinc-400 md:hidden mr-2">Тип:</span>
                <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${
                  group.billing_type === "postpaid"
                    ? "bg-purple-500/10 text-purple-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}>
                  {group.billing_type === "postpaid" ? "Postpaid" : "Prepaid"}
                </span>
              </div>

              {/* Balance */}
              <div className="flex items-center">
                <span className="text-xs text-zinc-400 md:hidden mr-2">Баланс:</span>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {group.billing_type === "postpaid"
                    ? `${(group.credit_limit || 0).toLocaleString()} KGS`
                    : `${(group.balance || 0).toLocaleString()} KGS`}
                </span>
              </div>

              {/* Employees */}
              <div className="flex items-center">
                <span className="text-xs text-zinc-400 md:hidden mr-2">Сотр.:</span>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{group.employees_count || 0}</span>
              </div>

              {/* Status */}
              <div className="flex items-center">
                <AdminStatusBadge
                  variant={group.is_active ? "online" : "error"}
                  label={group.is_active ? "Активен" : "Блок."}
                />
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-end">
                <Icon icon="solar:alt-arrow-right-linear" width={16} className="text-zinc-400" />
              </div>
            </div>
          ))}
        </div>
      ) : groups.length > 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
          <Icon icon="solar:magnifer-linear" width={32} className="text-zinc-400 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Ничего не найдено по запросу &ldquo;{searchQuery}&rdquo;</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <Icon icon="solar:buildings-2-linear" width={36} className="text-zinc-400 dark:text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Нет корпоративных клиентов</h3>
            <p className="text-sm text-zinc-500 max-w-sm mb-6">Создайте первую корпоративную группу для B2B клиентов</p>
            <button
              onClick={() => navigate(`${base}/corporate/create`)}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
            >
              <Icon icon="solar:add-circle-linear" width={18} />
              Создать группу
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerCorporateGroupsPage;
