import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Icon } from "@iconify/react";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminStatusBadge } from "@/features/admin/components/AdminStatusBadge";
import { LocationPickerMap } from "@/shared/components/LocationPickerMap";
import { AnimatedError } from "@/shared/components/AnimatedError";
import { ImageUploader } from "@/features/admin/components/ImageUploader";
import { useToast } from "@/shared/hooks/useToast";
import {
  adminLocationsService,
  type LocationDetailResponse,
  type LocationStation,
  type UpdateLocationData,
} from "@/features/admin/services/adminLocationsService";
import { adminPartnersService } from "@/features/admin/services/adminPartnersService";
import { adminStationsService } from "@/features/admin/services/adminStationsService";

// --- Zod validation schema ---

const locationFormSchema = z.object({
  name: z.string().min(3, "Минимум 3 символа").max(100, "Максимум 100 символов"),
  address: z.string().min(5, "Минимум 5 символов").max(200, "Максимум 200 символов"),
  city: z.string().max(50, "Максимум 50 символов").optional().or(z.literal("")),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  status: z.enum(["active", "inactive", "maintenance"]),
  partner_id: z.string().nullable(),
  image_url: z.string().nullable(),
});

type LocationFormData = z.infer<typeof locationFormSchema>;

// --- Helper: DetailRow ---

function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <span className="text-sm text-zinc-400 shrink-0">{label}</span>
      <span className={`text-sm text-zinc-900 dark:text-white text-right ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}

// --- Status options ---

const STATUS_OPTIONS = [
  { value: "active", label: "Активна" },
  { value: "inactive", label: "Неактивна" },
  { value: "maintenance", label: "Обслуживание" },
] as const;

// --- Sync status helpers ---

const SYNC_STATUS_MAP: { [key: string]: { variant: "online" | "offline" | "warning" | "error" | "info"; label: string } } = {
  synced: { variant: "online", label: "Синхр." },
  syncing: { variant: "info", label: "Синхр..." },
  pending: { variant: "warning", label: "Ожидание" },
  error: { variant: "error", label: "Ошибка" },
  not_configured: { variant: "offline", label: "Не настр." },
};

const DEFAULT_SYNC_STATUS = { variant: "offline" as const, label: "Не настр." };

// --- Main component ---

export function AdminLocationDetailPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  // --- State ---
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<LocationFormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [galleryUrl, setGalleryUrl] = useState("");

  // --- Queries ---
  const { data, isLoading, error } = useQuery<LocationDetailResponse>({
    queryKey: ["admin", "location", locationId],
    queryFn: () => adminLocationsService.getLocation(locationId!),
    enabled: !!locationId,
  });

  const { data: partnersData } = useQuery({
    queryKey: ["admin", "partners", "select"],
    queryFn: () => adminPartnersService.selectPartners(),
    enabled: isEditing,
  });

  // --- Mutations ---
  const updateMutation = useMutation({
    mutationFn: (payload: UpdateLocationData) =>
      adminLocationsService.updateLocation(locationId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "location", locationId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "locations"] });
      toast.success("Локация обновлена");
      setIsEditing(false);
      setFormData(null);
      setErrors({});
    },
    onError: () => {
      toast.error("Ошибка при обновлении локации");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminLocationsService.deleteLocation(locationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "locations"] });
      toast.success("Локация удалена");
      navigate("/admin/locations");
    },
    onError: (err: any) => {
      const detail = err?.detail || err?.message || "";
      const msg = detail.includes("409") || detail.includes("Нельзя удалить")
        ? detail.replace(/^.*?:\s*/, "").replace(/^409\s*/, "") || "Невозможно удалить: есть привязанные станции"
        : detail || "Ошибка при удалении локации";
      toast.error(msg);
      setShowDeleteConfirm(false);
    },
  });

  const addImageMutation = useMutation({
    mutationFn: (imageData: { url: string; caption?: string }) =>
      adminLocationsService.addLocationImage(locationId!, imageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "location", locationId] });
      toast.success("Фото добавлено в галерею");
      setGalleryUrl("");
    },
    onError: () => toast.error("Ошибка добавления фото"),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) =>
      adminLocationsService.deleteLocationImage(locationId!, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "location", locationId] });
      toast.success("Фото удалено");
    },
    onError: () => toast.error("Ошибка удаления фото"),
  });

  const togglePlatformMutation = useMutation({
    mutationFn: ({ platform, enabled }: { platform: string; enabled: boolean }) =>
      adminLocationsService.toggleLocationPlatform(locationId!, platform, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "location", locationId] });
    },
    onError: () => toast.error("Ошибка обновления платформы"),
  });

  const syncPlatformMutation = useMutation({
    mutationFn: (platform: string) =>
      adminLocationsService.syncLocationPlatform(locationId!, platform),
    onSuccess: (_, platform) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "location", locationId] });
      toast.success(`Синхронизация с ${platform} выполнена`);
    },
    onError: () => toast.error("Ошибка синхронизации"),
  });

  // --- Handlers ---
  const enterEditMode = useCallback(() => {
    if (!data?.location) return;
    const loc = data.location;
    setFormData({
      name: loc.name,
      address: loc.address,
      city: loc.city || "",
      lat: loc.lat,
      lng: loc.lng,
      status: loc.status as "active" | "inactive" | "maintenance",
      partner_id: loc.partner_id ?? null,
      image_url: loc.image_url ?? null,
    });
    setErrors({});
    setIsEditing(true);
  }, [data]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setFormData(null);
    setErrors({});
  }, []);

  const handleFieldChange = useCallback((field: keyof LocationFormData, value: any) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : prev);
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!formData || !data?.location) return;

    const result = locationFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        const key = e.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Diff with original — only send changed fields
    const loc = data.location;
    const patch: UpdateLocationData = {};
    if (formData.name !== loc.name) patch.name = formData.name;
    if (formData.address !== loc.address) patch.address = formData.address;
    if ((formData.city || "") !== (loc.city || "")) patch.city = formData.city || "";
    if (formData.lat !== loc.lat) patch.lat = formData.lat ?? undefined;
    if (formData.lng !== loc.lng) patch.lng = formData.lng ?? undefined;
    if (formData.status !== loc.status) patch.status = formData.status;
    if (formData.partner_id !== (loc.partner_id ?? null)) patch.partner_id = formData.partner_id;
    if ((formData.image_url || null) !== (loc.image_url || null)) patch.image_url = formData.image_url;

    if (Object.keys(patch).length === 0) {
      toast.info("Нет изменений");
      setIsEditing(false);
      setFormData(null);
      return;
    }

    updateMutation.mutate(patch);
  }, [formData, data, updateMutation, toast]);

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
          <div className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (error || !data?.location) {
    return (
      <div className="p-6 text-center">
        <Icon icon="solar:danger-triangle-bold-duotone" width={48} className="text-red-500 mx-auto mb-3" />
        <p className="text-zinc-600 dark:text-zinc-400">Локация не найдена</p>
        <button
          onClick={() => navigate("/admin/locations")}
          className="mt-4 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm"
        >
          Назад к списку
        </button>
      </div>
    );
  }

  const { location, stations, revenue } = data;
  const images = data.images ?? [];
  const syncPlatforms = data.sync_platforms ?? [];
  const isPartner = !!location.partner_id;
  const partnerShare = location.revenue_share_percent ?? 0;
  const platformShare = 100 - partnerShare;
  const hasCoords = location.lat != null && location.lng != null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <AdminPageHeader
        title={isEditing ? "Настройка локации" : location.name}
        subtitle={
          isEditing
            ? `Редактирование — ${location.name}`
            : `${location.address}${location.city ? `, ${location.city}` : ""}`
        }
        actionLabel={isEditing ? "Сохранить" : "Редактировать"}
        actionIcon={isEditing ? "solar:check-read-bold" : "solar:pen-bold"}
        onAction={isEditing ? handleSave : enterEditMode}
        secondaryActionLabel={isEditing ? "Отмена" : "Назад"}
        secondaryActionIcon={isEditing ? "solar:close-circle-linear" : "solar:arrow-left-linear"}
        onSecondaryAction={isEditing ? cancelEdit : () => navigate("/admin/locations")}
      >
        {isEditing && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Icon icon="solar:trash-bin-trash-bold" width={18} />
            Удалить
          </button>
        )}
      </AdminPageHeader>

      {/* Hero image (view mode) */}
      {!isEditing && location.image_url && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <img
            src={location.image_url}
            alt={location.name}
            className="w-full h-48 md:h-64 object-cover"
          />
        </div>
      )}

      {/* Gallery thumbnails (view mode) */}
      {!isEditing && images.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {images.map((img) => (
            <div key={img.id} className="shrink-0 relative group">
              <img
                src={img.url}
                alt={img.caption || ""}
                className="w-24 h-24 md:w-32 md:h-32 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800"
              />
              {img.caption && (
                <p className="text-[10px] text-zinc-400 mt-1 truncate max-w-[6rem] md:max-w-[8rem]">{img.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Map Section — always visible */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        {isEditing ? (
          <LocationPickerMap
            key="edit-map"
            value={
              formData?.lat != null && formData?.lng != null
                ? { lat: formData.lat, lng: formData.lng }
                : undefined
            }
            onChange={(coords) => {
              handleFieldChange("lat", coords.lat);
              handleFieldChange("lng", coords.lng);
            }}
            className="h-56 md:h-72"
          />
        ) : (
          <LocationPickerMap
            key="view-map"
            readOnly
            value={hasCoords ? { lat: location.lat!, lng: location.lng! } : undefined}
            className="h-56 md:h-72"
          />
        )}
        {/* Coordinate readout or "no coords" hint */}
        {(() => {
          const lat = isEditing ? formData?.lat : location.lat;
          const lng = isEditing ? formData?.lng : location.lng;
          if (lat != null && lng != null) {
            return (
              <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-6 text-sm">
                <div>
                  <span className="text-xs uppercase tracking-wider text-zinc-400 mr-2">Latitude</span>
                  <span className="font-mono text-zinc-900 dark:text-white">{lat.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-zinc-400 mr-2">Longitude</span>
                  <span className="font-mono text-zinc-900 dark:text-white">{lng.toFixed(6)}</span>
                </div>
                {isEditing && (
                  <button
                    onClick={() => { handleFieldChange("lat", null); handleFieldChange("lng", null); }}
                    className="ml-auto text-xs text-red-500 hover:text-red-600 transition-colors"
                  >
                    Сбросить
                  </button>
                )}
              </div>
            );
          }
          return (
            <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-sm text-zinc-400">
              <Icon icon="solar:map-point-linear" width={16} />
              <span>Координаты не заданы{isEditing ? " — кликните по карте" : ""}</span>
            </div>
          );
        })()}
      </div>

      {/* Info/Edit + Stats grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info or Edit form */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          {isEditing && formData ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">Основные данные</h3>

              {/* Name */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Название *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  placeholder="Название локации"
                />
                <AnimatedError error={errors["name"]} />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Адрес *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  placeholder="Адрес"
                />
                <AnimatedError error={errors["address"]} />
              </div>

              {/* City */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Город</label>
                <input
                  type="text"
                  value={formData.city || ""}
                  onChange={(e) => handleFieldChange("city", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  placeholder="Город"
                />
                <AnimatedError error={errors["city"]} />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Статус</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleFieldChange("status", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Partner */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Партнёр</label>
                <select
                  value={formData.partner_id || ""}
                  onChange={(e) => handleFieldChange("partner_id", e.target.value || null)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                >
                  <option value="">Red Petroleum (без партнёра)</option>
                  {partnersData?.partners?.map((p) => (
                    <option key={p.id} value={p.user_id}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Main image upload */}
              <ImageUploader
                value={formData.image_url || ""}
                onChange={(url) => handleFieldChange("image_url", url || null)}
                folder="locations"
                label="Главное фото"
              />

              {/* Gallery management */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Галерея</h4>
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {images.map((img) => (
                      <div key={img.id} className="relative group">
                        <img src={img.url} alt={img.caption || ""} className="w-20 h-20 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700" />
                        <button
                          onClick={() => deleteImageMutation.mutate(img.id)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Icon icon="solar:close-circle-bold" width={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <ImageUploader
                    value={galleryUrl}
                    onChange={(url) => {
                      if (url) {
                        addImageMutation.mutate({ url });
                      }
                      setGalleryUrl("");
                    }}
                    folder="locations"
                    label="Добавить фото в галерею"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">Информация</h3>
              <DetailRow label="Название" value={location.name} />
              <DetailRow label="Адрес" value={location.address} />
              <DetailRow label="Город" value={location.city} />
              <DetailRow label="Статус" value={
                <AdminStatusBadge
                  variant={location.status === "active" ? "online" : location.status === "maintenance" ? "warning" : "offline"}
                  label={location.status === "active" ? "Активна" : location.status === "maintenance" ? "Обслуживание" : "Неактивна"}
                />
              } />
              <DetailRow
                label="Координаты"
                value={hasCoords ? `${location.lat!.toFixed(6)}, ${location.lng!.toFixed(6)}` : null}
                mono
              />
              {location.created_at && (
                <DetailRow
                  label="Создана"
                  value={new Date(location.created_at).toLocaleDateString("ru-RU")}
                />
              )}
            </div>
          )}
        </div>

        {/* Right: Stats cards */}
        <div className="grid grid-cols-2 gap-4 auto-rows-min">
          {/* Status */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
            <p className="text-xs text-zinc-400 mb-2">Статус</p>
            <AdminStatusBadge
              variant={location.status === "active" ? "online" : location.status === "maintenance" ? "warning" : "offline"}
              label={location.status === "active" ? "Активна" : location.status === "maintenance" ? "Обслуживание" : "Неактивна"}
            />
          </div>

          {/* Owner */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
            <p className="text-xs text-zinc-400 mb-2">Владелец</p>
            {isPartner ? (
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                  {location.partner_name}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
                  {partnerShare}%
                </span>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-500">Red Petroleum</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">
                  100%
                </span>
              </div>
            )}
          </div>

          {/* Station count */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
            <p className="text-xs text-zinc-400 mb-2">Станции</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stations.length}</p>
            <p className="text-xs text-zinc-400 mt-1">
              {stations.filter((s) => s.is_online).length} онлайн
            </p>
          </div>

          {/* Monthly revenue */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
            <p className="text-xs text-zinc-400 mb-2">Выручка/мес</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">
              {(revenue?.total_revenue ?? 0).toLocaleString("ru-RU")}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              {revenue?.session_count ?? 0} сессий
            </p>
          </div>
        </div>
      </div>

      {/* Revenue breakdown (if partner) */}
      {isPartner && revenue && revenue.total_revenue > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Распределение выручки</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-zinc-400">Общая выручка</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">
                {revenue.total_revenue.toLocaleString("ru-RU")} KGS
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Доля партнёра ({partnerShare}%)</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {revenue.partner_share.toLocaleString("ru-RU")} KGS
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Доля RP ({platformShare}%)</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-500">
                {revenue.platform_share.toLocaleString("ru-RU")} KGS
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
            <div
              className="h-full bg-amber-500 rounded-l-full"
              style={{ width: `${partnerShare}%` }}
            />
            <div
              className="h-full bg-red-500 rounded-r-full"
              style={{ width: `${platformShare}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-zinc-400">
            <span>{location.partner_name} — {partnerShare}%</span>
            <span>Red Petroleum — {platformShare}%</span>
          </div>
        </div>
      )}

      {/* Map sync statuses */}
      {syncPlatforms.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Синхронизация с картами</h3>
            <button
              onClick={() => navigate("/admin/integrations/maps")}
              className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
            >
              Все интеграции
            </button>
          </div>
          <div className="space-y-3">
            {syncPlatforms.map((sp) => {
              const statusInfo = SYNC_STATUS_MAP[sp.sync_status] ?? DEFAULT_SYNC_STATUS;
              return (
                <div key={sp.platform} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <Icon icon={sp.icon || "solar:earth-bold-duotone"} width={20} className="text-zinc-500" />
                    <div>
                      <p className="text-sm text-zinc-900 dark:text-white">{sp.display_name}</p>
                      {sp.external_url && (
                        <a href={sp.external_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-500 hover:underline">
                          {sp.external_id || "Открыть"}
                        </a>
                      )}
                      {sp.sync_error && (
                        <p className="text-[11px] text-red-500 truncate max-w-xs">{sp.sync_error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AdminStatusBadge variant={statusInfo.variant} label={statusInfo.label} />
                    {isEditing ? (
                      <button
                        onClick={() => togglePlatformMutation.mutate({ platform: sp.platform, enabled: !sp.is_enabled })}
                        className={`relative w-9 h-5 rounded-full transition-colors ${sp.is_enabled ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${sp.is_enabled ? "translate-x-4" : ""}`} />
                      </button>
                    ) : sp.sync_status === "error" || sp.sync_status === "pending" ? (
                      <button
                        onClick={() => syncPlatformMutation.mutate(sp.platform)}
                        disabled={syncPlatformMutation.isPending}
                        className="px-2.5 py-1 text-[11px] bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors"
                      >
                        {sp.sync_status === "error" ? "Повторить" : "Обновить"}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stations table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Станции ({stations.length})
          </h3>
        </div>

        {stations.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">
            Нет станций на этой локации
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                  <th className="text-left px-5 py-3">ID / Модель</th>
                  <th className="text-left px-5 py-3">Мощность</th>
                  <th className="text-left px-5 py-3">Статус</th>
                  <th className="text-left px-5 py-3">Партнёр</th>
                  <th className="text-right px-5 py-3">Выручка/мес</th>
                </tr>
              </thead>
              <tbody>
                {stations.map((s) => (
                  <ExpandableStationRow
                    key={s.id}
                    station={s}
                    isPartner={isPartner}
                    navigate={navigate}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Icon icon="solar:trash-bin-trash-bold" width={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Удалить локацию?</h3>
                <p className="text-sm text-zinc-400">Это действие нельзя отменить</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
              Вы уверены, что хотите удалить локацию <strong className="text-zinc-900 dark:text-white">{location.name}</strong>?
            </p>

            {stations.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                <Icon icon="solar:danger-triangle-bold-duotone" width={18} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Привязано {stations.length} станций. Сначала перенесите или удалите все станции.
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <Icon icon="solar:refresh-linear" width={16} className="animate-spin" />
                ) : (
                  <Icon icon="solar:trash-bin-trash-bold" width={16} />
                )}
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Expandable Station Row with connectors ---

function ExpandableStationRow({
  station: s,
  isPartner,
  navigate,
}: {
  station: LocationStation;
  isPartner: boolean;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [expanded, setExpanded] = useState(false);

  const { data: stationDetail, isLoading } = useQuery({
    queryKey: ["location-station-connectors", s.id],
    queryFn: () => adminStationsService.getStation(s.id),
    enabled: expanded,
  });

  const connectors = stationDetail?.connectors ?? [];

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors group"
      >
        <td className="px-5 py-3">
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:alt-arrow-right-linear"
              width={16}
              className={`transition-transform text-zinc-400 ${expanded ? "rotate-90" : ""}`}
            />
            <div>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/admin/stations/${s.id}`); }}
                className="font-medium text-zinc-900 dark:text-white hover:text-red-500 transition-colors text-left"
              >
                {s.model}
              </button>
              <p className="text-xs text-zinc-400 flex items-center gap-1">
                {s.vendor && <span>{s.vendor}</span>}
                {s.evse_id ? (
                  <span className="font-mono text-blue-500">{s.evse_id}</span>
                ) : (
                  <span className="font-mono">{s.id.slice(0, 12)}</span>
                )}
              </p>
            </div>
          </div>
        </td>
        <td className="px-5 py-3">
          {s.max_power ? `${s.max_power} kW` : "—"}
          {s.connector_count ? (
            <span className="text-xs text-zinc-400 ml-1">
              ({s.connector_count} порт.)
            </span>
          ) : null}
        </td>
        <td className="px-5 py-3">
          <AdminStatusBadge
            variant={s.status !== "active" ? "warning" : s.is_online ? "online" : "offline"}
            label={s.status !== "active" ? "Неактивна" : s.is_online ? "Онлайн" : "Оффлайн"}
          />
        </td>
        <td className="px-5 py-3">
          {s.partner_name ? (
            <div>
              <span className="text-xs">{s.partner_name}</span>
              {s.partner_inherited === false && (
                <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                  override
                </span>
              )}
            </div>
          ) : isPartner ? (
            <span className="text-xs text-zinc-400">наследует</span>
          ) : (
            <span className="text-xs text-zinc-400">RP</span>
          )}
        </td>
        <td className="px-5 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="font-medium">{(s.month_revenue ?? 0).toLocaleString("ru-RU")} KGS</span>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/admin/stations/${s.id}`); }}
              className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
              title="Открыть станцию"
            >
              <Icon icon="solar:arrow-right-up-linear" width={16} />
            </button>
          </div>
        </td>
      </tr>

      {/* Connector rows */}
      {expanded && isLoading && (
        <tr>
          <td colSpan={5} className="py-3 text-center text-xs text-zinc-500">
            <Icon icon="solar:refresh-linear" width={16} className="animate-spin inline mr-1.5" />
            Загрузка портов...
          </td>
        </tr>
      )}

      {expanded && !isLoading && connectors.length === 0 && (
        <tr>
          <td colSpan={5} className="py-3 text-center text-xs text-zinc-500">
            Нет портов у этой станции
          </td>
        </tr>
      )}

      {expanded && connectors.map((conn: any) => (
        <tr
          key={conn.connector_number}
          onClick={() => navigate(`/admin/stations/${s.id}/connector/${conn.connector_number}`)}
          className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors border-b border-zinc-50 dark:border-zinc-800/30"
        >
          <td className="px-5 py-2.5 pl-12">
            <div className="flex items-center gap-2">
              <Icon icon="solar:plug-circle-linear" width={16} className="text-zinc-400" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Порт {conn.connector_number}
              </span>
              <span className="text-xs text-zinc-400">({conn.connector_type})</span>
            </div>
          </td>
          <td className="px-5 py-2.5 text-xs text-zinc-500">
            {conn.max_power ? `${conn.max_power} kW` : "—"}
          </td>
          <td className="px-5 py-2.5">
            <AdminStatusBadge
              variant={
                conn.status === "Available" ? "online"
                : conn.status === "Charging" || conn.status === "Occupied" ? "info"
                : conn.status === "Faulted" ? "error"
                : "offline"
              }
              label={
                conn.status === "Available" ? "Доступен"
                : conn.status === "Charging" || conn.status === "Occupied" ? "Зарядка"
                : conn.status === "Faulted" ? "Ошибка"
                : conn.status
              }
            />
          </td>
          <td className="px-5 py-2.5" />
          <td className="px-5 py-2.5 text-right">
            <span className="text-xs text-zinc-400 hover:text-red-500 transition-colors inline-flex items-center gap-1">
              Подробнее <Icon icon="solar:arrow-right-up-linear" width={12} />
            </span>
          </td>
        </tr>
      ))}
    </>
  );
}
