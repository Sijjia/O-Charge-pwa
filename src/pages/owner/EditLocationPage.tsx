/**
 * Edit Location Page
 * Form for editing an existing charging location
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePanelBase } from '@/shared/hooks/usePanelBase';
import { Icon } from '@iconify/react';
import {
  useOwnerLocation,
  useUpdateLocation,
  useDeleteLocation,
} from '@/features/owner/hooks/useOwnerLocations';
import { RequireRole } from '@/shared/components/RequireRole';
import { LocationPickerMap } from '@/shared/components/LocationPickerMap';
import { AnimatedError } from '@/shared/components/AnimatedError';
import { ImageUploader } from '@/features/admin/components/ImageUploader';
import type { UserRole } from '@/features/auth/types/unified.types';
import { z } from 'zod';

// Validation schema
const locationSchema = z.object({
  name: z
    .string()
    .min(3, 'Название должно быть минимум 3 символа')
    .max(100, 'Название не должно превышать 100 символов'),
  address: z
    .string()
    .min(5, 'Адрес должен быть минимум 5 символов')
    .max(200, 'Адрес не должен превышать 200 символов'),
  city: z
    .string()
    .min(2, 'Город должен быть минимум 2 символа')
    .max(50, 'Город не должен превышать 50 символов')
    .optional(),
  country: z.string().optional(),
  latitude: z
    .number()
    .min(-90, 'Широта должна быть между -90 и 90')
    .max(90, 'Широта должна быть между -90 и 90')
    .optional(),
  longitude: z
    .number()
    .min(-180, 'Долгота должна быть между -180 и 180')
    .max(180, 'Долгота должна быть между -180 и 180')
    .optional(),
  status: z.enum(['active', 'inactive', 'maintenance']),
  region_code: z.string().optional(),
  image_url: z.string().optional(),
});

type LocationFormData = z.infer<typeof locationSchema>;

export function EditLocationPage() {
  const navigate = useNavigate();
  const base = usePanelBase();
  const { locationId } = useParams<{ locationId: string }>();

  const { data: location, isLoading } = useOwnerLocation(locationId);
  const updateLocation = useUpdateLocation(locationId!);
  const deleteLocation = useDeleteLocation(locationId!);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    address: '',
    city: '',
    country: 'Kyrgyzstan',
    latitude: undefined,
    longitude: undefined,
    status: 'active',
    region_code: undefined,
    image_url: undefined,
  });

  // Load location data when available
  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        address: location.address,
        city: location.city || '',
        country: location.country || 'Kyrgyzstan',
        latitude: location.latitude,
        longitude: location.longitude,
        status: location.status,
        region_code: location.region_code,
        image_url: location.image_url || undefined,
      });
    }
  }, [location]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Clear error for this field
    if (errors && errors[name as keyof typeof errors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof typeof errors];
        return newErrors;
      });
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'latitude' || name === 'longitude'
          ? value === '' ? undefined : parseFloat(value)
          : value,
    }));
  };

  const validateForm = (): boolean => {
    try {
      locationSchema.parse(formData);
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

    if (!locationId) {
      setSubmitError('Ошибка: ID локации не указан');
      return;
    }

    try {
      await updateLocation.mutateAsync({
        name: formData.name,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        latitude: formData.latitude,
        longitude: formData.longitude,
        status: formData.status,
        region_code: formData.region_code,
        image_url: formData.image_url,
      });

      // Success - navigate back
      navigate(`${base}/stations`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Не удалось обновить локацию'
      );
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLocation.mutateAsync();
      // Success - navigate back
      navigate(`${base}/stations`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Не удалось удалить локацию'
      );
      setShowDeleteConfirm(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 dark:text-gray-400">Загрузка локации...</p>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">Локация не найдена</p>
          <button
            onClick={handleCancel}
            className="mt-3 text-sm text-red-600 hover:text-red-400"
          >
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white mb-4"
        >
          <Icon icon="solar:arrow-left-linear" width={16} />
          Назад
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-zinc-900 dark:text-white">
              Редактировать локацию
            </h1>
            <p className="text-zinc-500 dark:text-gray-400 mt-1 font-mono text-xs uppercase tracking-wider">
              {location.name}
            </p>
          </div>
          <RequireRole allowed={['admin', 'superadmin'] as ReadonlyArray<UserRole>}>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-500/10 rounded-lg hover:bg-red-500/15 transition-colors"
            >
              <Icon icon="solar:trash-bin-trash-linear" width={16} />
              Удалить
            </button>
          </RequireRole>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Удалить локацию?
            </h3>
            <p className="text-zinc-500 dark:text-gray-400 mb-6">
              Вы уверены что хотите удалить локацию &ldquo;{location.name}&rdquo;? Это
              действие нельзя отменить.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-zinc-600 dark:text-gray-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLocation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {deleteLocation.isPending ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm dark:shadow-none p-6">
        {/* Submit Error */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <Icon icon="solar:danger-circle-linear" width={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Ошибка</p>
              <p className="text-sm text-red-400 mt-1">{submitError}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Icon icon="solar:map-point-linear" width={20} className="text-red-500" />
              Основная информация
            </h3>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-1">
                Название локации <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border transition-colors rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors['name'] ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'
                  }`}
              />
              <AnimatedError error={errors['name']} />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-1">
                Адрес <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border transition-colors rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors['address'] ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'
                  }`}
              />
              <AnimatedError error={errors['address']} />
            </div>

            {/* City & Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-1">
                  Город
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border transition-colors rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors['city'] ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                />
                <AnimatedError error={errors['city']} />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-1">
                  Страна
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Location Image */}
            <ImageUploader
              value={formData.image_url || ''}
              onChange={(url) => setFormData(prev => ({ ...prev, image_url: url || undefined }))}
              folder="locations"
              label="Фото локации"
            />
          </div>

          {/* Coordinates (Map Picker) */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Icon icon="solar:map-linear" width={20} className="text-red-500" />
              Координаты на карте
            </h3>
            <p className="text-sm text-zinc-500 dark:text-gray-400">
              Вы можете переместить маркер, чтобы обновить положение локации на карте станций
            </p>

            <div className="h-72 w-full rounded-2xl overflow-hidden shadow-inner border border-zinc-200 dark:border-zinc-800">
              <LocationPickerMap
                value={
                  formData.latitude !== undefined && formData.longitude !== undefined
                    ? { lat: formData.latitude, lng: formData.longitude }
                    : undefined
                }
                onChange={(coords) => {
                  setFormData(prev => ({
                    ...prev,
                    latitude: coords.lat,
                    longitude: coords.lng
                  }));
                  setErrors(prev => {
                    const copy = { ...prev };
                    delete copy['latitude'];
                    delete copy['longitude'];
                    return copy;
                  });
                }}
                className="h-full w-full"
              />
            </div>

            {/* Display coordinated dynamically in Tech style */}
            <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex-1">
                <label className="block text-xs uppercase tracking-wider font-mono text-zinc-500 dark:text-zinc-400 mb-1">LATITUDE</label>
                <div className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {formData.latitude?.toFixed(6) || '—'}
                </div>
              </div>
              <div className="w-px h-8 bg-zinc-300 dark:bg-zinc-700" />
              <div className="flex-1">
                <label className="block text-xs uppercase tracking-wider font-mono text-zinc-500 dark:text-zinc-400 mb-1">LONGITUDE</label>
                <div className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {formData.longitude?.toFixed(6) || '—'}
                </div>
              </div>
            </div>
            <AnimatedError error={(errors['latitude'] || errors['longitude']) ? 'Пожалуйста, укажите координаты на карте' : undefined} />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-1">
              Статус <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="active">Активна</option>
              <option value="inactive">Неактивна</option>
              <option value="maintenance">На обслуживании</option>
            </select>
          </div>

          {/* Stations count info */}
          {location.stations_count !== undefined && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-400">
                <strong>Станций в локации:</strong> {location.stations_count}
              </p>
              {location.connectors_count !== undefined && (
                <p className="text-sm text-blue-400 mt-1">
                  <strong>Всего разъёмов:</strong> {location.connectors_count}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-zinc-600 dark:text-gray-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={updateLocation.isPending}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {updateLocation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Icon icon="solar:diskette-linear" width={16} />
                Сохранить изменения
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
