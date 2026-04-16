/**
 * Edit Station Page
 * Form for editing an existing charging station
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePanelBase } from '@/shared/hooks/usePanelBase';
import { Icon } from '@iconify/react';
import { z } from 'zod';
import { useOwnerAuth } from '@/features/owner/hooks/useOwnerAuth';
import { useOwnerStation, useUpdateStation, useDeleteStation } from '@/features/owner/hooks/useOwnerStations';
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

export function EditStationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const base = usePanelBase();
  const { user } = useOwnerAuth();
  const { data: station, isLoading: isLoadingStation, error: loadError } = useOwnerStation(id);
  const { data: locations = [], isLoading: locationsLoading } = useOwnerLocations(user?.id);
  const { data: partnersData, isLoading: partnersLoading } = usePartnersSelect();
  const partners = partnersData?.partners ?? [];
  const updateStation = useUpdateStation(id || '');
  const deleteStation = useDeleteStation();

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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  // Load station data when available
  useEffect(() => {
    if (station) {
      setFormData({
        serial_number: station.serial_number,
        model: station.model,
        manufacturer: station.manufacturer,
        power_capacity: station.power_capacity,
        location_id: station.location_id,
        connectors_count: station.connectors_count,
        status: station.status,
      });
      setPartnerUserId(station.user_id || '');
      // If station has equipment_model_id, pre-select from catalog
      if (station.equipment_model_id) {
        setSelectedModelId(station.equipment_model_id);
        // Find manufacturer from the model's manufacturer_name if available
        const mfr = catalogManufacturers.find(
          (m) => m.name === station.equipment_manufacturer_name
        );
        if (mfr) setSelectedMfrId(mfr.id);
      } else {
        setManualMode(true);
      }
    }
  }, [station, catalogManufacturers.length]);

  // Auto-fill from selected equipment model
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

    if (!id) {
      setSubmitError('Недостаточно данных для обновления');
      return;
    }

    try {
      await updateStation.mutateAsync({
        ...formData,
        user_id: partnerUserId || undefined,
        equipment_model_id: (!manualMode && selectedModelId) ? selectedModelId : undefined,
      } as typeof formData & { user_id?: string; equipment_model_id?: string });

      // Navigate to station details on success
      navigate(`${base}/stations/${id}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Не удалось обновить станцию. Попробуйте снова.'
      );
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteStation.mutateAsync(id);

      // Navigate to stations list on success
      navigate(`${base}/stations`);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Не удалось удалить станцию. Попробуйте снова.'
      );
      setShowDeleteConfirm(false);
    }
  };

  // Loading state
  if (isLoadingStation) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-gray-400">Загрузка данных станции...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError || !station) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md">
          <div className="flex items-start gap-3">
            <Icon icon="solar:danger-circle-linear" width={24} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-700 dark:text-red-400 mb-1">Ошибка загрузки</h3>
              <p className="text-sm text-red-400">
                Не удалось загрузить данные станции. Станция не найдена или у вас нет доступа.
              </p>
              <button
                onClick={() => navigate(`${base}/stations`)}
                className="mt-4 text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline"
              >
                Вернуться к списку станций
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`${base}/stations/${id}`)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Icon icon="solar:arrow-left-linear" width={20} className="text-zinc-500 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Редактировать станцию</h1>
              <p className="text-zinc-500 dark:text-gray-400 mt-1">{station.serial_number}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-black/20 border border-zinc-200 dark:border-zinc-800 p-6">
          {/* Submit Error */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Icon icon="solar:danger-circle-linear" width={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{submitError}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Serial Number */}
            <div>
              <label htmlFor="serial_number" className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-2">
                Серийный номер <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="serial_number"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  errors['serial_number'] ? 'border-red-300' : 'border-zinc-300 dark:border-zinc-700'
                }`}
                placeholder="Например: EVP-001"
              />
              {errors['serial_number'] && (
                <p className="mt-1 text-sm text-red-600">{errors['serial_number']}</p>
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
                <span className="text-zinc-600 dark:text-gray-300">Ввести вручную (без справочника)</span>
              </label>
            </div>

            {!manualMode ? (
              <>
                {/* Manufacturer from catalog */}
                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-2">
                    Производитель <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedMfrId}
                    onChange={(e) => { setSelectedMfrId(e.target.value); setSelectedModelId(''); }}
                    className={`w-full px-4 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 border-zinc-300 dark:border-zinc-700`}
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
                            <Icon icon="solar:box-bold-duotone" width={20} className="text-zinc-400" />
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
                  <label className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-2">
                    Модель <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedModelId}
                    onChange={(e) => handleEquipModelSelect(e.target.value)}
                    disabled={!selectedMfrId}
                    className={`w-full px-4 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 border-zinc-300 dark:border-zinc-700 ${!selectedMfrId ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  <label htmlFor="model" className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-2">
                    Модель <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      errors['model'] ? 'border-red-300' : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                    placeholder="Например: DC Fast Charger 50kW"
                  />
                  {errors['model'] && <p className="mt-1 text-sm text-red-600">{errors['model']}</p>}
                </div>

                {/* Manual Manufacturer */}
                <div>
                  <label htmlFor="manufacturer" className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-2">
                    Производитель <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="manufacturer"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      errors['manufacturer'] ? 'border-red-300' : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                    placeholder="Например: ABB, Schneider Electric"
                  />
                  {errors['manufacturer'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['manufacturer']}</p>
                  )}
                </div>
              </>
            )}

            {/* Power Capacity */}
            <div>
              <label htmlFor="power_capacity" className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-2">
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
                className={`w-full px-4 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  errors['power_capacity'] ? 'border-red-300' : 'border-zinc-300 dark:border-zinc-700'
                }`}
              />
              {errors['power_capacity'] && (
                <p className="mt-1 text-sm text-red-600">{errors['power_capacity']}</p>
              )}
            </div>

            {/* Connectors Count */}
            <div>
              <label htmlFor="connectors_count" className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-2">
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
                className={`w-full px-4 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  errors['connectors_count'] ? 'border-red-300' : 'border-zinc-300 dark:border-zinc-700'
                }`}
              />
              {errors['connectors_count'] && (
                <p className="mt-1 text-sm text-red-600">{errors['connectors_count']}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location_id" className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-2">
                Локация <span className="text-red-500">*</span>
              </label>
              <select
                id="location_id"
                name="location_id"
                value={formData.location_id}
                onChange={handleInputChange}
                disabled={locationsLoading}
                className={`w-full px-4 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  errors['location_id'] ? 'border-red-300' : 'border-zinc-300 dark:border-zinc-700'
                } ${locationsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                <p className="mt-1 text-sm text-red-600">{errors['location_id']}</p>
              )}
            </div>

            {/* Partner */}
            <div>
              <label htmlFor="partner_user_id" className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-2">
                Партнёр
              </label>
              <select
                id="partner_user_id"
                name="partner_user_id"
                value={partnerUserId}
                onChange={(e) => setPartnerUserId(e.target.value)}
                disabled={partnersLoading}
                className={`w-full px-4 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${partnersLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              <label htmlFor="status" className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-2">
                Статус
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="active">Активна</option>
                <option value="maintenance">На обслуживании</option>
                <option value="inactive">Неактивна</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <RequireRole allowed={['operator','admin','superadmin'] as ReadonlyArray<UserRole>}>
                <button
                  type="submit"
                  disabled={updateStation.isPending}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateStation.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Сохранение...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:diskette-linear" width={20} />
                      <span>Сохранить изменения</span>
                    </>
                  )}
                </button>
              </RequireRole>
              <button
                type="button"
                onClick={() => navigate(`${base}/stations/${id}`)}
                disabled={updateStation.isPending}
                className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
            </div>

            {/* Delete Button */}
            <RequireRole allowed={['admin','superadmin'] as ReadonlyArray<UserRole>}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={updateStation.isPending || deleteStation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/15 text-red-400 rounded-lg transition-colors disabled:opacity-50"
              >
                <Icon icon="solar:trash-bin-trash-linear" width={20} />
                <span>Удалить</span>
              </button>
            </RequireRole>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-500/15 rounded-full">
                <Icon icon="solar:danger-circle-linear" width={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                  Удалить станцию?
                </h3>
                <p className="text-sm text-zinc-500 dark:text-gray-400">
                  Вы уверены, что хотите удалить станцию{' '}
                  <span className="font-semibold">{station.serial_number}</span>?
                  Это действие нельзя отменить.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                disabled={deleteStation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteStation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Удаление...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="solar:trash-bin-trash-linear" width={20} />
                    <span>Удалить</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteStation.isPending}
                className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
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
