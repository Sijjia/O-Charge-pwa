import { Icon } from "@iconify/react";
import { useState, useMemo } from "react";
import {
  useEquipmentManufacturers,
  useEquipmentModels,
  useCreateManufacturer,
  useUpdateManufacturer,
  useCreateModel,
  useUpdateModel,
  useDeleteModel,
} from "@/features/admin/hooks/useAdminEquipment";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminSearchBar } from "@/features/admin/components/AdminSearchBar";
import { AdminStatCard } from "@/features/admin/components/AdminStatCard";
import { AdminEmptyState } from "@/features/admin/components/AdminEmptyState";
import type { Manufacturer, EquipmentModel } from "@/features/admin/services/adminEquipmentService";
import { ImageUploader } from "@/features/admin/components/ImageUploader";

const inputCls =
  "w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors text-sm";

const selectCls =
  "px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white";

const CONNECTOR_OPTIONS = ["CCS2", "Type2", "CHAdeMO", "GBT"] as const;

/* ── Overlay / Modal helpers ──────────────────────────────────────── */

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

/* ── Main Page ────────────────────────────────────────────────────── */

export function AdminEquipmentPage() {
  const [search, setSearch] = useState("");

  // Fetch all manufacturers + models
  const { data: mfrData, isLoading: mfrLoading } = useEquipmentManufacturers({ search: undefined });
  const manufacturers = mfrData?.data ?? [];

  const [modelMfrFilter, setModelMfrFilter] = useState("");
  const [modelTypeFilter, setModelTypeFilter] = useState<"" | "AC" | "DC">("");
  const [connectorFilter, setConnectorFilter] = useState("");
  const [powerMin, setPowerMin] = useState("");
  const [powerMax, setPowerMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const { data: modelData, isLoading: modelLoading } = useEquipmentModels({
    search: undefined,
    manufacturer_id: undefined,
    type: undefined,
  });
  const allModels = modelData?.data ?? [];

  // Client-side filtering
  const filteredModels = useMemo(() => {
    let result = allModels;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.manufacturer_name && m.manufacturer_name.toLowerCase().includes(q))
      );
    }
    if (modelMfrFilter) result = result.filter((m) => m.manufacturer_id === modelMfrFilter);
    if (modelTypeFilter) result = result.filter((m) => m.type === modelTypeFilter);
    if (connectorFilter) result = result.filter((m) => m.connector_types?.includes(connectorFilter));
    if (powerMin) result = result.filter((m) => m.power_kw && m.power_kw >= Number(powerMin));
    if (powerMax) result = result.filter((m) => m.power_kw && m.power_kw <= Number(powerMax));
    if (priceMin) result = result.filter((m) => m.price_min_usd && m.price_min_usd >= Number(priceMin));
    if (priceMax) result = result.filter((m) => m.price_max_usd && m.price_max_usd <= Number(priceMax));
    return result;
  }, [allModels, search, modelMfrFilter, modelTypeFilter, connectorFilter, powerMin, powerMax, priceMin, priceMax]);

  // Group models by manufacturer
  const grouped = useMemo(() => {
    const map = new Map<string, { manufacturer: Manufacturer | null; models: EquipmentModel[] }>();
    for (const model of filteredModels) {
      const mfrId = model.manufacturer_id || "unknown";
      if (!map.has(mfrId)) {
        const mfr = manufacturers.find((m) => m.id === mfrId) || null;
        map.set(mfrId, { manufacturer: mfr, models: [] });
      }
      map.get(mfrId)!.models.push(model);
    }
    // Sort: manufacturers with more models first
    return Array.from(map.entries()).sort((a, b) => b[1].models.length - a[1].models.length);
  }, [filteredModels, manufacturers]);

  // Collapsed sections state
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Modals
  const [mfrModal, setMfrModal] = useState<{ mode: "create" | "edit"; item?: Manufacturer } | null>(null);
  const [modelModal, setModelModal] = useState<{ mode: "create" | "edit"; item?: EquipmentModel } | null>(null);
  const [detailModal, setDetailModal] = useState<EquipmentModel | null>(null);

  // Stats
  const totalMfrs = manufacturers.length;
  const totalModels = allModels.length;
  const dcModels = allModels.filter((m) => m.type === "DC").length;
  const acModels = allModels.filter((m) => m.type === "AC").length;

  const loading = mfrLoading || modelLoading;

  const hasActiveFilters = !!(modelMfrFilter || modelTypeFilter || connectorFilter || powerMin || powerMax || priceMin || priceMax);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
      <div className="p-4 md:p-6 space-y-6">
        <AdminPageHeader
          title="Справочник оборудования"
          subtitle="Производители и модели зарядных станций"
          actionLabel="Добавить модель"
          actionIcon="solar:add-circle-bold"
          onAction={() => setModelModal({ mode: "create" })}
          secondaryActionLabel="Добавить производителя"
          secondaryActionIcon="solar:add-circle-linear"
          onSecondaryAction={() => setMfrModal({ mode: "create" })}
        />

        {/* Unified Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <AdminStatCard label="Производителей" value={totalMfrs} icon="solar:box-bold-duotone" />
          <AdminStatCard label="Моделей" value={totalModels} icon="solar:charging-socket-bold" />
          <AdminStatCard label="DC" value={dcModels} icon="solar:bolt-circle-bold-duotone" />
          <AdminStatCard label="AC" value={acModels} icon="solar:plug-circle-bold-duotone" />
        </div>

        {/* Search + Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px] max-w-md">
            <AdminSearchBar value={search} onChange={setSearch} placeholder="Поиск по названию..." />
          </div>
          <select value={modelMfrFilter} onChange={(e) => setModelMfrFilter(e.target.value)} className={selectCls}>
            <option value="">Все производители</option>
            {manufacturers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select value={modelTypeFilter} onChange={(e) => setModelTypeFilter(e.target.value as "" | "AC" | "DC")} className={selectCls}>
            <option value="">AC + DC</option>
            <option value="DC">DC</option>
            <option value="AC">AC</option>
          </select>
          <select value={connectorFilter} onChange={(e) => setConnectorFilter(e.target.value)} className={selectCls}>
            <option value="">Все разъёмы</option>
            {CONNECTOR_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="кВт от"
              value={powerMin}
              onChange={(e) => setPowerMin(e.target.value)}
              className="w-20 px-2 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
            />
            <span className="text-zinc-400 text-xs">—</span>
            <input
              type="number"
              placeholder="кВт до"
              value={powerMax}
              onChange={(e) => setPowerMax(e.target.value)}
              className="w-20 px-2 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="$ от"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-20 px-2 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
            />
            <span className="text-zinc-400 text-xs">—</span>
            <input
              type="number"
              placeholder="$ до"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-20 px-2 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setModelMfrFilter("");
                setModelTypeFilter("");
                setConnectorFilter("");
                setPowerMin("");
                setPowerMax("");
                setPriceMin("");
                setPriceMax("");
              }}
              className="px-3 py-2 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Сбросить
            </button>
          )}
        </div>

        {/* Content: Grouped by manufacturer */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredModels.length === 0 ? (
          <AdminEmptyState
            icon="solar:box-linear"
            title={hasActiveFilters || search ? "Ничего не найдено" : "Нет моделей"}
            description={hasActiveFilters || search ? "Попробуйте изменить фильтры" : "Добавьте первую модель оборудования"}
          />
        ) : (
          <div className="space-y-4">
            {grouped.map(([mfrId, { manufacturer, models }]) => {
              const isCollapsed = collapsed.has(mfrId);
              return (
                <div key={mfrId} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  {/* Manufacturer header */}
                  <button
                    onClick={() => toggleCollapse(mfrId)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    {manufacturer?.logo_url ? (
                      <img src={manufacturer.logo_url} alt={manufacturer.name} className="w-8 h-8 rounded-lg object-contain bg-zinc-100 dark:bg-zinc-800 p-1 flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <Icon icon="solar:box-bold-duotone" width={18} className="text-zinc-400" />
                      </div>
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <span className="font-semibold text-sm text-zinc-900 dark:text-white">
                        {manufacturer?.name || "Неизвестный"}
                      </span>
                      {manufacturer?.country && (
                        <span className="ml-2 text-xs text-zinc-400">{manufacturer.country}</span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400 mr-2">{models.length} мод.</span>
                    <Icon
                      icon="solar:alt-arrow-down-linear"
                      width={16}
                      className={`text-zinc-400 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                    />
                  </button>

                  {/* Models grid */}
                  {!isCollapsed && (
                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {models.map((m) => (
                          <ModelCard
                            key={m.id}
                            model={m}
                            onView={() => setDetailModal(m)}
                            onEdit={() => setModelModal({ mode: "edit", item: m })}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {mfrModal && (
        <ManufacturerFormModal
          mode={mfrModal.mode}
          item={mfrModal.item}
          onClose={() => setMfrModal(null)}
        />
      )}
      {modelModal && (
        <ModelFormModal
          mode={modelModal.mode}
          item={modelModal.item}
          manufacturers={manufacturers}
          onClose={() => setModelModal(null)}
        />
      )}
      {detailModal && (
        <ModelDetailModal model={detailModal} onClose={() => setDetailModal(null)} />
      )}
    </div>
  );
}

/* ── Model Card (compact) ──────────────────────────────────────────── */

function ModelCard({
  model: m,
  onView,
  onEdit,
}: {
  model: EquipmentModel;
  onView: () => void;
  onEdit: () => void;
}) {
  const deleteModel = useDeleteModel();

  return (
    <div
      className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors cursor-pointer group"
      onClick={onView}
    >
      {/* Image */}
      <div className="relative h-32 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
        {m.image_url ? (
          <img src={m.image_url} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <Icon icon="solar:charging-socket-bold" width={36} className="text-zinc-300 dark:text-zinc-600" />
        )}
        {/* Type badge */}
        <span className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
          m.type === "DC" ? "bg-blue-600 text-white" : "bg-green-600 text-white"
        }`}>
          {m.type}
        </span>
        {/* Actions */}
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button onClick={onEdit} className="p-1 rounded-md bg-white/90 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shadow-sm">
            <Icon icon="solar:pen-2-linear" width={12} />
          </button>
          <button onClick={() => deleteModel.mutate(m.id)} className="p-1 rounded-md bg-white/90 dark:bg-zinc-900/90 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-600 dark:text-zinc-400 hover:text-red-500 shadow-sm">
            <Icon icon="solar:trash-bin-trash-linear" width={12} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-zinc-900 dark:text-white text-xs leading-tight truncate">{m.name}</h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          {m.power_kw && (
            <span className="text-xs font-bold text-zinc-900 dark:text-white">{m.power_kw} kW</span>
          )}
          {m.connector_types?.length > 0 && (
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{m.connector_types.join(", ")}</span>
          )}
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
          <span>{m.ocpp_versions?.join(", ") || "\u2014"}</span>
          {m.price_min_usd && m.price_max_usd ? (
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              ${(m.price_min_usd / 1000).toFixed(0)}k\u2013${(m.price_max_usd / 1000).toFixed(0)}k
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ── Model Detail Modal ───────────────────────────────────────────── */

function ModelDetailModal({ model: m, onClose }: { model: EquipmentModel; onClose: () => void }) {
  const specs = [
    { label: "\u0422\u0438\u043f", value: m.type, icon: "solar:bolt-circle-linear" },
    { label: "\u041c\u043e\u0449\u043d\u043e\u0441\u0442\u044c", value: m.power_kw ? `${m.power_kw} kW` : null, icon: "solar:flash-linear" },
    { label: "\u0420\u0430\u0437\u044a\u0451\u043c\u044b", value: m.connector_types?.join(", "), icon: "solar:plug-circle-linear" },
    { label: "\u041a\u043e\u043b-\u0432\u043e \u0440\u0430\u0437\u044a\u0451\u043c\u043e\u0432", value: m.num_connectors, icon: "solar:sort-by-time-linear" },
    { label: "\u041d\u0430\u043f\u0440\u044f\u0436\u0435\u043d\u0438\u0435", value: m.voltage_range, icon: "solar:danger-circle-linear" },
    { label: "IP \u0440\u0435\u0439\u0442\u0438\u043d\u0433", value: m.ip_rating, icon: "solar:shield-check-linear" },
    { label: "OCPP", value: m.ocpp_versions?.join(", "), icon: "solar:code-linear" },
    { label: "\u0422\u0435\u043c\u043f\u0435\u0440\u0430\u0442\u0443\u0440\u0430", value: m.operating_temp, icon: "solar:temperature-linear" },
    { label: "\u0413\u0430\u0431\u0430\u0440\u0438\u0442\u044b", value: m.dimensions, icon: "solar:ruler-linear" },
    { label: "\u0412\u0435\u0441", value: m.weight_kg ? `${m.weight_kg} \u043a\u0433` : null, icon: "solar:scale-linear" },
    { label: "\u041a\u041f\u0414", value: m.efficiency_percent ? `${m.efficiency_percent}%` : null, icon: "solar:chart-linear" },
    { label: "\u0414\u0438\u0441\u043f\u043b\u0435\u0439", value: m.display_size, icon: "solar:monitor-linear" },
  ];

  return (
    <Overlay onClose={onClose}>
      <ModalHeader title={m.name} subtitle={m.manufacturer_name ?? undefined} onClose={onClose} />
      <div className="p-5 space-y-4">
        {m.image_url && (
          <div className="flex justify-center">
            <img src={m.image_url} alt={m.name} className="max-h-48 rounded-xl object-contain" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            m.type === "DC"
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
              : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
          }`}>
            {m.type}
          </span>
          {m.power_kw && (
            <span className="text-lg font-bold text-zinc-900 dark:text-white">{m.power_kw} kW</span>
          )}
        </div>

        {m.price_min_usd && m.price_max_usd && (
          <p className="text-sm text-zinc-500">
            Цена: <span className="font-medium text-zinc-900 dark:text-white">
              ${m.price_min_usd.toLocaleString()} — ${m.price_max_usd.toLocaleString()}
            </span>
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {specs.map((s) =>
            s.value ? (
              <div key={s.label} className="flex items-start gap-2 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <Icon icon={s.icon} width={16} className="text-zinc-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-zinc-500">{s.label}</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{s.value}</p>
                </div>
              </div>
            ) : null,
          )}
        </div>
      </div>
    </Overlay>
  );
}

/* ── Manufacturer Form Modal ──────────────────────────────────────── */

function ManufacturerFormModal({
  mode,
  item,
  onClose,
}: {
  mode: "create" | "edit";
  item?: Manufacturer;
  onClose: () => void;
}) {
  const createMfr = useCreateManufacturer();
  const updateMfr = useUpdateManufacturer();

  const [form, setForm] = useState({
    name: item?.name ?? "",
    name_cn: item?.name_cn ?? "",
    country: item?.country ?? "",
    website: item?.website ?? "",
    logo_url: item?.logo_url ?? "",
    description: item?.description ?? "",
  });

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    if (mode === "create") {
      await createMfr.mutateAsync(form);
    } else if (item) {
      await updateMfr.mutateAsync({ id: item.id, data: form });
    }
    onClose();
  };

  const isPending = createMfr.isPending || updateMfr.isPending;

  return (
    <Overlay onClose={onClose}>
      <ModalHeader
        title={mode === "create" ? "Новый производитель" : "Редактировать производителя"}
        onClose={onClose}
      />
      <div className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Название *</label>
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ABB" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Название (CN)</label>
          <input className={inputCls} value={form.name_cn} onChange={(e) => setForm({ ...form, name_cn: e.target.value })} placeholder="华为" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Страна</label>
          <input className={inputCls} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Китай" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Website</label>
          <input className={inputCls} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
        </div>
        <ImageUploader
          value={form.logo_url}
          onChange={(url) => setForm({ ...form, logo_url: url })}
          folder="logos"
          label="Логотип"
          maxDimension={512}
          maxSizeMB={0.3}
        />
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Описание</label>
          <textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button
          onClick={handleSubmit}
          disabled={isPending || !form.name.trim()}
          className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {isPending ? "Сохранение..." : mode === "create" ? "Создать" : "Сохранить"}
        </button>
      </div>
    </Overlay>
  );
}

/* ── Model Form Modal ─────────────────────────────────────────────── */

function ModelFormModal({
  mode,
  item,
  manufacturers,
  onClose,
}: {
  mode: "create" | "edit";
  item?: EquipmentModel;
  manufacturers: Manufacturer[];
  onClose: () => void;
}) {
  const createModel = useCreateModel();
  const updateModel = useUpdateModel();

  const [form, setForm] = useState({
    manufacturer_id: item?.manufacturer_id ?? "",
    name: item?.name ?? "",
    type: item?.type ?? "DC",
    power_kw: item?.power_kw ?? "",
    connector_types: item?.connector_types?.join(", ") ?? "",
    num_connectors: item?.num_connectors ?? "",
    voltage_range: item?.voltage_range ?? "",
    image_url: item?.image_url ?? "",
    price_min_usd: item?.price_min_usd ?? "",
    price_max_usd: item?.price_max_usd ?? "",
    ocpp_versions: item?.ocpp_versions?.join(", ") ?? "1.6",
    ip_rating: item?.ip_rating ?? "",
    dimensions: item?.dimensions ?? "",
    weight_kg: item?.weight_kg ?? "",
    operating_temp: item?.operating_temp ?? "",
    efficiency_percent: item?.efficiency_percent ?? "",
    display_size: item?.display_size ?? "",
  });

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.manufacturer_id) return;
    const payload: Record<string, unknown> = {
      manufacturer_id: form.manufacturer_id,
      name: form.name,
      type: form.type,
      power_kw: form.power_kw ? Number(form.power_kw) : null,
      connector_types: form.connector_types ? form.connector_types.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      num_connectors: form.num_connectors ? Number(form.num_connectors) : null,
      voltage_range: form.voltage_range || null,
      image_url: form.image_url || null,
      price_min_usd: form.price_min_usd ? Number(form.price_min_usd) : null,
      price_max_usd: form.price_max_usd ? Number(form.price_max_usd) : null,
      ocpp_versions: form.ocpp_versions ? form.ocpp_versions.split(",").map((s: string) => s.trim()).filter(Boolean) : ["1.6"],
      ip_rating: form.ip_rating || null,
      dimensions: form.dimensions || null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      operating_temp: form.operating_temp || null,
      efficiency_percent: form.efficiency_percent ? Number(form.efficiency_percent) : null,
      display_size: form.display_size || null,
    };

    if (mode === "create") {
      await createModel.mutateAsync(payload as Partial<EquipmentModel>);
    } else if (item) {
      await updateModel.mutateAsync({ id: item.id, data: payload as Partial<EquipmentModel> });
    }
    onClose();
  };

  const isPending = createModel.isPending || updateModel.isPending;
  const set = (key: string, val: string | number) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <Overlay onClose={onClose}>
      <ModalHeader
        title={mode === "create" ? "Новая модель" : "Редактировать модель"}
        onClose={onClose}
      />
      <div className="p-5 space-y-3">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Производитель *</label>
          <select className={inputCls} value={form.manufacturer_id} onChange={(e) => set("manufacturer_id", e.target.value)}>
            <option value="">Выберите...</option>
            {manufacturers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Название модели *</label>
          <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Terra 360" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Тип</label>
            <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)}>
              <option value="DC">DC</option>
              <option value="AC">AC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Мощность (kW)</label>
            <input className={inputCls} type="number" value={form.power_kw} onChange={(e) => set("power_kw", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Разъёмы (через запятую)</label>
            <input className={inputCls} value={form.connector_types} onChange={(e) => set("connector_types", e.target.value)} placeholder="CCS2, CHAdeMO" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Кол-во разъёмов</label>
            <input className={inputCls} type="number" value={form.num_connectors} onChange={(e) => set("num_connectors", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Напряжение</label>
          <input className={inputCls} value={form.voltage_range} onChange={(e) => set("voltage_range", e.target.value)} placeholder="200-1000V" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Цена мин. USD</label>
            <input className={inputCls} type="number" value={form.price_min_usd} onChange={(e) => set("price_min_usd", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Цена макс. USD</label>
            <input className={inputCls} type="number" value={form.price_max_usd} onChange={(e) => set("price_max_usd", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">OCPP (через запятую)</label>
            <input className={inputCls} value={form.ocpp_versions} onChange={(e) => set("ocpp_versions", e.target.value)} placeholder="1.6, 2.0.1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">IP рейтинг</label>
            <input className={inputCls} value={form.ip_rating} onChange={(e) => set("ip_rating", e.target.value)} placeholder="IP55" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Раб. температура</label>
          <input className={inputCls} value={form.operating_temp} onChange={(e) => set("operating_temp", e.target.value)} placeholder="-30~55°C" />
        </div>
        <ImageUploader
          value={form.image_url as string}
          onChange={(url) => set("image_url", url)}
          folder="models"
          label="Фото станции"
          maxDimension={1200}
          maxSizeMB={0.5}
        />
        <button
          onClick={handleSubmit}
          disabled={isPending || !form.name.trim() || !form.manufacturer_id}
          className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {isPending ? "Сохранение..." : mode === "create" ? "Создать" : "Сохранить"}
        </button>
      </div>
    </Overlay>
  );
}
