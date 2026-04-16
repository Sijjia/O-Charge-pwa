/**
 * Create Station Page
 * Form for adding a new charging station
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePanelBase } from '@/shared/hooks/usePanelBase';
import { Icon } from '@iconify/react';
import { z } from 'zod';
import { useOwnerAuth } from '@/features/owner/hooks/useOwnerAuth';
import { useCreateStation } from '@/features/owner/hooks/useOwnerStations';
import { useOwnerLocations } from '@/features/owner/hooks/useOwnerLocations';
import { usePartnersSelect } from '@/features/admin/hooks/useAdminPartners';
import { useEquipmentManufacturers, useEquipmentModels } from '@/features/admin/hooks/useAdminEquipment';
import { RequireRole } from '@/shared/components/RequireRole';
import type { UserRole } from '@/features/auth/types/unified.types';
import type { EquipmentModel, Manufacturer } from '@/features/admin/services/adminEquipmentService';

// Validation schema
const stationSchema = z.object({
  serial_number: z
    .string()
    .min(3, 'Серийный номер должен быть минимум 3 символа')
    .max(50, 'Серийный номер не должен превышать 50 символов'),
  model: z
    .string()
    .min(2, 'Модель должна быть минимум 2 символа')
    .max(50, 'Модель не должна превышать 50 символов'),
  manufacturer: z
    .string()
    .min(2, 'Производитель должен быть минимум 2 символа')
    .max(50, 'Производитель не должен превышать 50 символов'),
  power_capacity: z
    .number()
    .min(1, 'Мощность должна быть больше 0')
    .max(500, 'Мощность не должна превышать 500 кВт'),
  location_id: z.string().min(1, 'Выберите локацию'),
  connectors_count: z
    .number()
    .min(1, 'Должен быть минимум 1 разъём')
    .max(10, 'Максимум 10 разъёмов'),
  status: z.enum(['active', 'inactive', 'maintenance']),
});

type StationFormData = z.infer<typeof stationSchema>;

const inputBaseClass = "w-full px-4 py-3 bg-white dark:bg-zinc-900 border rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm transition-all";

export function CreateStationPage() {
  const navigate = useNavigate();
  const base = usePanelBase();
  const { user } = useOwnerAuth();
  const createStation = useCreateStation();
  const { data: locations = [], isLoading: locationsLoading } = useOwnerLocations(user?.id);
  const { data: partnersData, isLoading: partnersLoading } = usePartnersSelect();
  const partners = partnersData?.partners ?? [];

  // Equipment catalog
  const [selectedMfrId, setSelectedMfrId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [manualMode, setManualMode] = useState(false);
  const { data: mfrData } = useEquipmentManufacturers();
  const catalogManufacturers = mfrData?.data ?? [];
  const { data: modelData } = useEquipmentModels(
    selectedMfrId ? { manufacturer_id: selectedMfrId } : undefined
  );
  const catalogModels = modelData?.data ?? [];
  const selectedEquipModel = catalogModels.find((m) => m.id === selectedModelId);

  const handleEquipModelSelect = (modelId: string) => {
    setSelectedModelId(modelId);
    const model = catalogModels.find((m) => m.id === modelId);
    if (model) {
      setFormData((prev) => ({
        ...prev,
        model: model.name,
        manufacturer: catalogManufacturers.find((m) => m.id === model.manufacturer_id)?.name ?? prev.manufacturer,
        power_capacity: model.power_kw ?? prev.power_capacity,
        connectors_count: model.num_connectors ?? prev.connectors_count,
      }));
    }
  };

  const [partnerUserId, setPartnerUserId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  const [formData, setFormData] = useState<StationFormData>({
    serial_number: '',
    model: '',
    manufacturer: '',
    power_capacity: 50,
    location_id: '',
    connectors_count: 1,
    status: 'active',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Clear error for this field
    if (errors && errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'power_capacity' || name === 'connectors_count'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const validateForm = (): boolean => {
    try {
      stationSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    try {
      await createStation.mutateAsync({
        ...formData,
        user_id: partnerUserId || undefined,
        equipment_model_id: (!manualMode && selectedModelId) ? selectedModelId : undefined,
      } as typeof formData & { user_id?: string; equipment_model_id?: string });

      // Navigate to stations list on success
      navigate(`${base}/stations`);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Не удалось создать станцию. Попробуйте снова.'
      );
    }
  };

  const getInputClass = (fieldName: string) =>
    `${inputBaseClass} ${errors[fieldName] ? 'border-red-400 dark:border-red-500/50' : 'border-zinc-200 dark:border-zinc-800'}`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`${base}/stations`)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Icon icon="solar:arrow-left-linear" width={20} className="text-zinc-500 dark:text-zinc-400" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">Добавить станцию</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Создание новой зарядной станции</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 p-6">
          {/* Submit Error */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <Icon icon="solar:danger-circle-linear" width={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Serial Number */}
            <div>
              <label htmlFor="serial_number" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Серийный номер <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="serial_number"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleInputChange}
                className={getInputClass('serial_number')}
                placeholder="Например: EVP-001"
              />
              {errors['serial_number'] && (
                <p className="mt-1.5 text-sm text-red-500">{errors['serial_number']}</p>
              )}
            </div>

            {/* Equipment Selection Mode */}
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={manualMode}
                  onChange={(e) => {
                    setManualMode(e.target.checked);
                    if (!e.target.checked) {
                      setSelectedMfrId('');
                      setSelectedModelId('');
                    }
                  }}
                  className="rounded border-zinc-300 dark:border-zinc-600 text-red-600 focus:ring-red-500"
                />
                <span className="text-zinc-600 dark:text-zinc-300">Ввести вручную (без справочника)</span>
              </label>
            </div>

            {!manualMode ? (
              <>
                {/* Manufacturer from catalog */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Производитель <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedMfrId}
                    onChange={(e) => { setSelectedMfrId(e.target.value); setSelectedModelId(''); }}
                    className={`${inputBaseClass} border-zinc-200 dark:border-zinc-800`}
                  >
                    <option value="">Выберите производителя</option>
                    {catalogManufacturers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}{m.name_cn ? ` (${m.name_cn})` : ''} — {m.country}
                      </option>
                    ))}
                  </select>
                  {/* Manufacturer logo preview */}
                  {selectedMfrId && !selectedModelId && (() => {
                    const mfr = catalogManufacturers.find((m) => m.id === selectedMfrId);
                    return mfr ? (
                      <div className="mt-2 flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        {mfr.logo_url ? (
                          <img src={mfr.logo_url} alt={mfr.name} className="w-10 h-10 rounded-lg object-contain bg-white dark:bg-zinc-700 p-1" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                            <Icon icon="solar:box-bold-duotone" width={16} className="text-zinc-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">{mfr.name}</p>
                          <p className="text-xs text-zinc-500">{mfr.country}{mfr.website ? ` · ${mfr.website.replace(/^https?:\/\/(www\.)?/, '')}` : ''}</p>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Model from catalog */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Модель <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedModelId}
                    onChange={(e) => handleEquipModelSelect(e.target.value)}
                    disabled={!selectedMfrId}
                    className={`${inputBaseClass} border-zinc-200 dark:border-zinc-800 ${!selectedMfrId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">{selectedMfrId ? 'Выберите модель' : 'Сначала выберите производителя'}</option>
                    {catalogModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.type} {m.power_kw ? `${m.power_kw} kW` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Equipment Preview Card */}
                {selectedEquipModel && (
                  <EquipmentPreviewCard
                    model={selectedEquipModel}
                    manufacturer={catalogManufacturers.find((m) => m.id === selectedMfrId)}
                  />
                )}
              </>
            ) : (
              <>
                {/* Manual Model */}
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Модель <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className={getInputClass('model')}
                    placeholder="Например: DC Fast Charger 50kW"
                  />
                  {errors['model'] && <p className="mt-1.5 text-sm text-red-500">{errors['model']}</p>}
                </div>

                {/* Manual Manufacturer */}
                <div>
                  <label htmlFor="manufacturer" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Производитель <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="manufacturer"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    className={getInputClass('manufacturer')}
                    placeholder="Например: ABB, Schneider Electric"
                  />
                  {errors['manufacturer'] && (
                    <p className="mt-1.5 text-sm text-red-500">{errors['manufacturer']}</p>
                  )}
                </div>
              </>
            )}

            {/* Power Capacity */}
            <div>
              <label htmlFor="power_capacity" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Мощность (кВт) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="power_capacity"
                name="power_capacity"
                value={formData.power_capacity}
                onChange={handleInputChange}
                min="1"
                max="500"
                step="0.1"
                className={getInputClass('power_capacity')}
              />
              {errors['power_capacity'] && (
                <p className="mt-1.5 text-sm text-red-500">{errors['power_capacity']}</p>
              )}
            </div>

            {/* Connectors Count */}
            <div>
              <label htmlFor="connectors_count" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Количество разъёмов <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="connectors_count"
                name="connectors_count"
                value={formData.connectors_count}
                onChange={handleInputChange}
                min="1"
                max="10"
                step="1"
                className={getInputClass('connectors_count')}
              />
              {errors['connectors_count'] && (
                <p className="mt-1.5 text-sm text-red-500">{errors['connectors_count']}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location_id" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Локация <span className="text-red-500">*</span>
              </label>
              <select
                id="location_id"
                name="location_id"
                value={formData.location_id}
                onChange={handleInputChange}
                disabled={locationsLoading}
                className={`${getInputClass('location_id')} ${locationsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="">
                  {locationsLoading ? 'Загрузка локаций...' : 'Выберите локацию'}
                </option>
                {locations
                  .filter((loc) => loc.status === 'active')
                  .map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} - {location.city || location.address}
                    </option>
                  ))}
              </select>
              {errors['location_id'] && (
                <p className="mt-1.5 text-sm text-red-500">{errors['location_id']}</p>
              )}
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                Если нужной локации нет,{' '}
                <button
                  type="button"
                  onClick={() => navigate(`${base}/locations/create`)}
                  className="text-red-500 hover:text-red-400 underline"
                >
                  создайте новую
                </button>
              </p>
            </div>

            {/* Partner */}
            <div>
              <label htmlFor="partner_user_id" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Партнёр
              </label>
              <select
                id="partner_user_id"
                name="partner_user_id"
                value={partnerUserId}
                onChange={(e) => setPartnerUserId(e.target.value)}
                disabled={partnersLoading}
                className={`${inputBaseClass} border-zinc-200 dark:border-zinc-800 ${partnersLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="">
                  {partnersLoading ? 'Загрузка партнёров...' : 'Своя станция (без партнёра)'}
                </option>
                {partners.map((p) => (
                  <option key={p.id} value={p.user_id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                Привяжите станцию к партнёру или оставьте как свою
              </p>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Статус
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={`${inputBaseClass} border-zinc-200 dark:border-zinc-800`}
              >
                <option value="active">Активна</option>
                <option value="maintenance">На обслуживании</option>
                <option value="inactive">Неактивна</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex items-center gap-4">
            <RequireRole allowed={['operator','admin','superadmin'] as ReadonlyArray<UserRole>}>
              <button
                type="submit"
                disabled={createStation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createStation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                    <span>Создание...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="solar:diskette-linear" width={20} />
                    <span>Создать станцию</span>
                  </>
                )}
              </button>
            </RequireRole>
            <button
              type="button"
              onClick={() => navigate(`${base}/stations`)}
              disabled={createStation.isPending}
              className="px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Equipment Preview Card ───────────────────────────────────────── */

function EquipmentPreviewCard({ model: m, manufacturer }: { model: EquipmentModel; manufacturer?: Manufacturer }) {
  const specs = [
    { label: "Тип", value: m.type },
    { label: "Мощность", value: m.power_kw ? `${m.power_kw} kW` : null },
    { label: "Разъёмы", value: m.connector_types?.join(", ") },
    { label: "Кол-во", value: m.num_connectors },
    { label: "Напряжение", value: m.voltage_range },
    { label: "IP", value: m.ip_rating },
    { label: "OCPP", value: m.ocpp_versions?.join(", ") },
    { label: "Температура", value: m.operating_temp },
    { label: "Габариты", value: m.dimensions },
    { label: "Вес", value: m.weight_kg ? `${m.weight_kg} кг` : null },
  ].filter((s) => s.value);

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
      {/* Model image */}
      {m.image_url && (
        <div className="relative h-44 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />
          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold ${
            m.type === "DC" ? "bg-blue-600 text-white" : "bg-green-600 text-white"
          }`}>
            {m.type}
          </span>
        </div>
      )}

      <div className="p-4 space-y-3 bg-zinc-50 dark:bg-zinc-800/50">
        {/* Manufacturer + model name */}
        <div className="flex items-center gap-3">
          {manufacturer?.logo_url ? (
            <img src={manufacturer.logo_url} alt={manufacturer.name} className="w-8 h-8 rounded-lg object-contain bg-white dark:bg-zinc-700 p-0.5 flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
              <Icon icon="solar:box-bold-duotone" width={16} className="text-zinc-400" />
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{m.name}</h4>
            <p className="text-xs text-zinc-500">{manufacturer?.name || m.manufacturer_name}</p>
          </div>
        </div>

        {/* Power + price */}
        <div className="flex items-center gap-2">
          {!m.image_url && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              m.type === "DC"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
            }`}>
              {m.type}
            </span>
          )}
          {m.power_kw && <span className="text-sm font-bold text-zinc-900 dark:text-white">{m.power_kw} kW</span>}
          {m.price_min_usd && m.price_max_usd && (
            <span className="text-xs text-zinc-500 ml-auto">
              ${m.price_min_usd.toLocaleString()} — ${m.price_max_usd.toLocaleString()}
            </span>
          )}
        </div>

        {/* Specs grid */}
        <div className="grid grid-cols-2 gap-2">
          {specs.map((s) => (
            <div key={s.label} className="text-xs">
              <span className="text-zinc-500">{s.label}: </span>
              <span className="font-medium text-zinc-900 dark:text-white">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
