import { Icon } from "@iconify/react";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminPartners } from "@/features/admin/hooks/useAdminPartners";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminDataTable, type Column } from "@/features/admin/components/AdminDataTable";
import { AdminSearchBar } from "@/features/admin/components/AdminSearchBar";
import { AdminFilterBar } from "@/features/admin/components/AdminFilterBar";
import { AdminPagination } from "@/features/admin/components/AdminPagination";
import { AdminStatCard } from "@/features/admin/components/AdminStatCard";
import { AdminStatusBadge } from "@/features/admin/components/AdminStatusBadge";
import { AdminEmptyState } from "@/features/admin/components/AdminEmptyState";
import { fetchJson } from "@/api/unifiedClient";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import type { Partner } from "@/features/admin/services/adminPartnersService";

const PAGE_SIZE = 20;
const SuccessSchema = z.object({ success: z.boolean() }).passthrough();

const inputCls =
  "w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors text-sm";

/* ------------------------------------------------------------------ */
/*  Overlay wrapper                                                    */
/* ------------------------------------------------------------------ */
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 rounded-t-2xl z-10">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
        <Icon icon="solar:close-circle-linear" width={22} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail Modal                                                       */
/* ------------------------------------------------------------------ */
function DetailModal({ partner, onClose, onEdit, onDelete, onViewDetails }: {
  partner: Partner; onClose: () => void; onEdit: () => void; onDelete: () => void; onViewDetails: () => void;
}) {
  const fields = [
    { label: "Имя", value: partner.name, icon: "solar:user-bold-duotone" },
    { label: "Компания", value: partner.company_name || "—", icon: "solar:buildings-bold-duotone" },
    { label: "Телефон", value: partner.phone || "—", icon: "solar:phone-bold-duotone" },
    { label: "Email", value: partner.email || "—", icon: "solar:letter-bold-duotone" },
    { label: "Станций", value: partner.station_count, icon: "solar:ev-station-bold-duotone" },
    { label: "Доход", value: `${partner.total_revenue.toLocaleString()} сом`, icon: "solar:wallet-bold-duotone" },
    { label: "Комиссия", value: `${partner.commission_rate}%`, icon: "solar:chart-square-bold-duotone" },
    { label: "Дата создания", value: partner.created_at ? new Date(partner.created_at).toLocaleDateString("ru") : "—", icon: "solar:calendar-bold-duotone" },
  ];

  return (
    <Overlay onClose={onClose}>
      <ModalHeader title={partner.name} subtitle={partner.company_name || undefined} onClose={onClose} />
      <div className="p-5">
        <div className="flex justify-center mb-4">
          <AdminStatusBadge variant={partner.is_active ? "online" : "offline"} label={partner.is_active ? "Активен" : "Неактивен"} />
        </div>
        <div className="space-y-0">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <div className="flex items-center gap-2">
                <Icon icon={f.icon} width={16} className="text-zinc-400" />
                <span className="text-xs text-zinc-500">{f.label}</span>
              </div>
              <span className="text-sm font-medium text-zinc-900 dark:text-white">{f.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
        <button onClick={onViewDetails} className="btn bg-blue-600 text-white hover:bg-blue-500 flex-1 gap-1.5 py-2.5 text-sm">
          <Icon icon="solar:arrow-right-linear" width={16} />
          Подробнее
        </button>
        <button onClick={onEdit} className="btn btn-primary flex-1 gap-1.5 py-2.5 text-sm">
          <Icon icon="solar:pen-bold-duotone" width={16} />
          Редактировать
        </button>
        <button onClick={onDelete} className="btn btn-outline shrink-0 py-2.5 px-3">
          <Icon icon="solar:trash-bin-trash-bold-duotone" width={16} />
        </button>
        <button onClick={onClose} className="btn btn-secondary shrink-0 py-2.5 px-4 text-sm">
          Закрыть
        </button>
      </div>
    </Overlay>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit / Create Modal                                                */
/* ------------------------------------------------------------------ */
function EditModal({ partner, onClose }: { partner: Partner | null; onClose: () => void }) {
  const qc = useQueryClient();
  const isCreate = !partner;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: partner?.name ?? "",
    email: partner?.email ?? "",
    phone: partner?.phone ?? "",
    company_name: partner?.company_name ?? "",
    commission_rate: String(partner?.commission_rate ?? 80),
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Укажите имя партнёра"); return; }
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: form.name.trim(),
        contact_name: form.name.trim(),
        email: form.email.trim() || null,
        contact_email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        contact_phone: form.phone.trim() || null,
        company_name: form.company_name.trim() || null,
        commission_rate: parseFloat(form.commission_rate) || 80,
      };
      if (isCreate) {
        await fetchJson("/api/v1/admin/partners", { method: "POST", body }, SuccessSchema);
      } else {
        await fetchJson(`/api/v1/admin/partners/${partner.id}`, { method: "PUT", body }, SuccessSchema);
      }
      qc.invalidateQueries({ queryKey: ["admin-partners"] });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <ModalHeader title={isCreate ? "Добавить партнёра" : "Редактировать партнёра"} onClose={onClose} />
      <div className="p-5 space-y-4">
        {error && <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Имя партнёра *</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="Азамат Бейшеналиев" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Компания</label>
          <input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} className={inputCls} placeholder="ЭкоДрайв Бишкек" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Телефон</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} placeholder="+996 555 000 000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="partner@mail.kg" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Комиссия (%)</label>
          <input type="number" value={form.commission_rate} onChange={(e) => set("commission_rate", e.target.value)} className={inputCls} min={0} max={100} />
        </div>
      </div>
      <div className="flex gap-3 p-5 border-t border-zinc-200 dark:border-zinc-800">
        <button onClick={onClose} className="btn btn-secondary flex-1 py-2.5 text-sm">
          Отмена
        </button>
        <button onClick={handleSubmit} disabled={saving} className="btn btn-primary flex-1 gap-1.5 py-2.5 text-sm disabled:opacity-50">
          <Icon icon={saving ? "solar:refresh-bold-duotone" : "solar:diskette-bold-duotone"} width={16} className={saving ? "animate-spin" : ""} />
          {saving ? "Сохранение..." : isCreate ? "Создать" : "Сохранить"}
        </button>
      </div>
    </Overlay>
  );
}

/* ------------------------------------------------------------------ */
/*  Delete Confirm Modal                                               */
/* ------------------------------------------------------------------ */
function DeleteModal({ partner, onClose }: { partner: Partner; onClose: () => void }) {
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetchJson(`/api/v1/admin/partners/${partner.id}`, { method: "DELETE" }, SuccessSchema);
      qc.invalidateQueries({ queryKey: ["admin-partners"] });
      onClose();
    } catch { /* ignore */ }
    setDeleting(false);
  };

  return (
    <Overlay onClose={onClose}>
      <div className="p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
          <Icon icon="solar:trash-bin-trash-bold-duotone" width={32} className="text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Удалить партнёра?</h2>
        <p className="text-sm text-zinc-500">
          <strong>{partner.name}</strong> {partner.company_name ? `(${partner.company_name})` : ""} будет удалён. Это действие необратимо.
        </p>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn btn-secondary flex-1 py-2.5 text-sm">
            Отмена
          </button>
          <button onClick={handleDelete} disabled={deleting} className="btn btn-primary flex-1 gap-1.5 py-2.5 text-sm disabled:opacity-50">
            <Icon icon={deleting ? "solar:refresh-bold-duotone" : "solar:trash-bin-trash-bold-duotone"} width={16} className={deleting ? "animate-spin" : ""} />
            {deleting ? "Удаление..." : "Удалить"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export function AdminPartnersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<
    | { type: "detail"; partner: Partner }
    | { type: "edit"; partner: Partner | null }
    | { type: "delete"; partner: Partner }
    | null
  >(null);

  const filters = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, search: search || undefined };
  const { data, isLoading, isError, error } = useAdminPartners(filters);

  const handleSearch = useCallback((value: string) => { setSearch(value); setPage(1); }, []);

  const partners = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const totalStations = partners.reduce((s, p) => s + p.station_count, 0);
  const totalRevenue = partners.reduce((s, p) => s + p.total_revenue, 0);

  const columns: Column<Partner>[] = [
    {
      key: "partner",
      header: "Партнёр",
      render: (row) => (
        <div>
          <p className="text-sm text-zinc-900 dark:text-white font-medium">{row.name}</p>
          {row.company_name && <p className="text-xs text-zinc-500">{row.company_name}</p>}
        </div>
      ),
    },
    { key: "phone" as keyof Partner, header: "Телефон", render: (row) => <span className="text-sm text-zinc-500">{row.phone || "—"}</span> },
    { key: "stations", header: "Станции", helpText: "Количество зарядных станций принадлежащих этому партнёру.", render: (row) => <span className="text-sm font-medium text-zinc-900 dark:text-white">{row.station_count}</span> },
    { key: "revenue", header: "Доход", helpText: "Сколько денег заработал партнёр со всех своих станций.", render: (row) => <span className="text-sm font-medium text-zinc-900 dark:text-white">{row.total_revenue.toLocaleString()} сом</span> },
    { key: "commission", header: "Комиссия", helpText: "Процент от каждой зарядки который получает партнёр. Остальное — комиссия Red Petroleum.", render: (row) => <span className="text-sm text-zinc-500">{row.commission_rate}%</span> },
    { key: "status", header: "Статус", render: (row) => <AdminStatusBadge variant={row.is_active ? "online" : "offline"} label={row.is_active ? "Активен" : "Неактивен"} /> },
    {
      key: "actions" as keyof Partner,
      header: "",
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setModal({ type: "edit", partner: row })} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-blue-500 transition-colors" title="Редактировать">
            <Icon icon="solar:pen-linear" width={16} />
          </button>
          <button onClick={() => setModal({ type: "delete", partner: row })} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors" title="Удалить">
            <Icon icon="solar:trash-bin-trash-linear" width={16} />
          </button>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <AdminPageHeader title="Партнёры" subtitle="Управление партнёрами" helpText="Партнёры — это компании или ИП, которые устанавливают зарядные станции. Они получают процент от выручки. Здесь можно добавлять, редактировать и удалять партнёров." />
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center">
          <Icon icon="solar:danger-triangle-linear" width={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-sm text-zinc-500">{error instanceof Error ? error.message : "Ошибка загрузки"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <AdminPageHeader title="Партнёры" subtitle="Управление партнёрами" helpText="Партнёры — это компании или ИП, которые устанавливают зарядные станции. Они получают процент от выручки. Здесь можно добавлять, редактировать и удалять партнёров." actionLabel="Добавить партнёра" actionIcon="solar:add-circle-linear" onAction={() => setModal({ type: "edit", partner: null })} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminStatCard label="Партнёров" helpText="Количество зарегистрированных партнёров-владельцев станций" value={total} icon="solar:buildings-linear" />
        <AdminStatCard label="Станций" helpText="Суммарное количество станций всех партнёров" value={totalStations} icon="solar:ev-station-linear" />
        <AdminStatCard label="Доход" helpText="Суммарный доход всех партнёров от зарядных сессий" value={`${totalRevenue.toLocaleString()} сом`} icon="solar:wallet-linear" />
        <AdminStatCard label="Средняя комиссия" helpText="Средний процент который партнёры получают от каждой зарядки. Остальное — комиссия Red Petroleum" value={`${partners.length ? (partners.reduce((s, p) => s + p.commission_rate, 0) / partners.length).toFixed(0) : 0}%`} icon="solar:chart-square-linear" />
      </div>

      <AdminFilterBar>
        <AdminSearchBar placeholder="Поиск по имени или компании..." value={search} onChange={handleSearch} />
      </AdminFilterBar>

      {!isLoading && partners.length === 0 && !search ? (
        <AdminEmptyState icon="solar:buildings-linear" title="Нет партнёров" description="Добавьте первого партнёра" actionLabel="Добавить" onAction={() => setModal({ type: "edit", partner: null })} />
      ) : (
        <AdminDataTable<Partner> columns={columns} data={partners} keyExtractor={(r) => r.id} loading={isLoading} onRowClick={(r) => setModal({ type: "detail", partner: r })} emptyMessage="Партнёры не найдены" />
      )}

      {total > PAGE_SIZE && <AdminPagination page={page} totalPages={totalPages} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />}

      {/* Modals */}
      {modal?.type === "detail" && (
        <DetailModal
          partner={modal.partner}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: "edit", partner: modal.partner })}
          onDelete={() => setModal({ type: "delete", partner: modal.partner })}
          onViewDetails={() => {
            navigate(`/admin/partners/${modal.partner.id}`);
            setModal(null);
          }}
        />
      )}
      {modal?.type === "edit" && <EditModal partner={modal.partner} onClose={() => setModal(null)} />}
      {modal?.type === "delete" && <DeleteModal partner={modal.partner} onClose={() => setModal(null)} />}
    </div>
  );
}
