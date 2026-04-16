/**
 * ConnectorForm Component
 * Form for adding/editing station connectors
 */

import { useState } from 'react';
import { Icon } from '@iconify/react';

export interface Connector {
  id?: string;
  connector_type: string;
  power_kw: number;
  status?: 'available' | 'occupied' | 'faulted' | 'unavailable';
}

export interface ConnectorFormProps {
  connectors: Connector[];
  onChange: (connectors: Connector[]) => void;
  maxConnectors?: number;
  disabled?: boolean;
}

const CONNECTOR_TYPES = [
  { value: 'CCS2', label: 'CCS2 (Combined Charging System)' },
  { value: 'CHAdeMO', label: 'CHAdeMO' },
  { value: 'Type2', label: 'Type 2 (Mennekes)' },
  { value: 'Type1', label: 'Type 1 (J1772)' },
  { value: 'GB/T', label: 'GB/T' },
  { value: 'Tesla', label: 'Tesla Supercharger' },
];

export function ConnectorForm({
  connectors,
  onChange,
  maxConnectors = 10,
  disabled = false,
}: ConnectorFormProps) {
  const [errors, setErrors] = useState<Record<number, string>>({});

  const handleAddConnector = () => {
    if (connectors.length >= maxConnectors) {
      return;
    }

    const newConnector: Connector = {
      connector_type: 'CCS2',
      power_kw: 50,
      status: 'available',
    };

    onChange([...connectors, newConnector]);
  };

  const handleRemoveConnector = (index: number) => {
    const updated = connectors.filter((_, i) => i !== index);
    onChange(updated);

    // Clear error for this connector
    if (errors[index]) {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const handleConnectorChange = (
    index: number,
    field: keyof Connector,
    value: string | number
  ) => {
    const updated = [...connectors];
    updated[index] = {
      ...updated[index],
      [field]: value,
    } as Connector;

    onChange(updated);

    // Clear error for this connector
    if (errors[index]) {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const validateConnector = (connector: Connector, index: number): boolean => {
    if (!connector.connector_type) {
      setErrors((prev) => ({ ...prev, [index]: 'Выберите тип разъёма' }));
      return false;
    }

    if (connector.power_kw <= 0) {
      setErrors((prev) => ({ ...prev, [index]: 'Мощность должна быть больше 0' }));
      return false;
    }

    if (connector.power_kw > 500) {
      setErrors((prev) => ({ ...prev, [index]: 'Мощность не должна превышать 500 кВт' }));
      return false;
    }

    return true;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Разъёмы</h3>
          <p className="text-sm text-zinc-500 dark:text-gray-400 mt-1">
            Добавьте разъёмы для зарядки ({connectors.length}/{maxConnectors})
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddConnector}
          disabled={disabled || connectors.length >= maxConnectors}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
        >
          <Icon icon="solar:add-circle-linear" width={16} />
          Добавить разъём
        </button>
      </div>

      {/* Connectors List */}
      {connectors.length === 0 ? (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-8 text-center">
          <p className="text-zinc-500 dark:text-gray-400 mb-2">Нет разъёмов</p>
          <p className="text-sm text-zinc-400 dark:text-gray-500">
            Добавьте хотя бы один разъём для зарядки
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {connectors.map((connector, index) => (
            <div
              key={connector.id || `connector-${index}`}
              className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
            >
              <div className="flex items-start gap-4">
                {/* Connector Number */}
                <div className="flex-shrink-0 w-10 h-10 bg-green-500/15 rounded-lg flex items-center justify-center">
                  <span className="text-green-400 font-semibold">{index + 1}</span>
                </div>

                {/* Form Fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Connector Type */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-1">
                      Тип разъёма
                    </label>
                    <select
                      value={connector.connector_type}
                      onChange={(e) =>
                        handleConnectorChange(index, 'connector_type', e.target.value)
                      }
                      disabled={disabled}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                    >
                      {CONNECTOR_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Power */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-1">
                      Мощность (кВт)
                    </label>
                    <input
                      type="number"
                      value={connector.power_kw}
                      onChange={(e) =>
                        handleConnectorChange(
                          index,
                          'power_kw',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      onBlur={() => validateConnector(connector, index)}
                      disabled={disabled}
                      min="0"
                      max="500"
                      step="0.1"
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                      placeholder="50"
                    />
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveConnector(index)}
                  disabled={disabled}
                  className="flex-shrink-0 p-2 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Удалить разъём"
                >
                  <Icon icon="solar:trash-bin-trash-linear" width={20} />
                </button>
              </div>

              {/* Error Message */}
              {errors[index] && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                  <Icon icon="solar:danger-circle-linear" width={16} />
                  {errors[index]}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Message */}
      {connectors.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-blue-400">
            <strong>Совет:</strong> Укажите реальную мощность каждого разъёма. Это
            поможет клиентам выбрать подходящую станцию.
          </p>
        </div>
      )}
    </div>
  );
}
