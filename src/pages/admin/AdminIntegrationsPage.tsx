import { useState } from "react";
import { Icon } from "@iconify/react";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import {
  useMapIntegrations,
  useMapIntegrationsOverview,
  useUpdateMapIntegration,
  useTestMapIntegration,
} from "@/features/admin/hooks/useAdminIntegrations";
import type { MapIntegration } from "@/features/admin/services/adminIntegrationsService";

function IntegrationCard({ integration }: { integration: MapIntegration }) {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [editingKey, setEditingKey] = useState(false);

  const updateMutation = useUpdateMapIntegration();
  const testMutation = useTestMapIntegration();

  const handleToggle = () => {
    updateMutation.mutate({
      platform: integration.platform,
      data: { is_enabled: !integration.is_enabled },
    });
  };

  const handleSaveKey = () => {
    if (!apiKeyInput.trim()) return;
    updateMutation.mutate({
      platform: integration.platform,
      data: { api_key: apiKeyInput.trim() },
    });
    setEditingKey(false);
    setApiKeyInput("");
  };

  const handleTest = () => {
    testMutation.mutate(integration.platform);
  };

  const syncTime = integration.last_global_sync_at
    ? new Date(integration.last_global_sync_at).toLocaleString("ru-RU")
    : null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Icon icon={integration.icon || "solar:earth-bold-duotone"} width={22} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {integration.display_name}
            </h3>
            <p className="text-xs text-zinc-400">{integration.platform}</p>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={handleToggle}
          disabled={updateMutation.isPending}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            integration.is_enabled ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              integration.is_enabled ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>

      {/* API Key */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">API Key</span>
          {!editingKey ? (
            <button
              onClick={() => setEditingKey(true)}
              className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
            >
              Изменить
            </button>
          ) : (
            <button
              onClick={() => setEditingKey(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Отмена
            </button>
          )}
        </div>
        {editingKey ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Введите API key..."
              className="flex-1 px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <button
              onClick={handleSaveKey}
              className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
            >
              Сохранить
            </button>
          </div>
        ) : (
          <p className="text-sm font-mono text-zinc-600 dark:text-zinc-300">
            {integration.api_key_masked || "Не настроен"}
          </p>
        )}
      </div>

      {/* Interval */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-zinc-400">Интервал синхр.</span>
        <span className="text-xs text-zinc-600 dark:text-zinc-300">{integration.sync_interval_minutes} мин</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            Синхр: {integration.locations_synced}
          </span>
        </div>
        {integration.locations_error > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs text-red-500">
              Ошибки: {integration.locations_error}
            </span>
          </div>
        )}
      </div>

      {syncTime && (
        <p className="text-[11px] text-zinc-400 mb-4">Последняя синхр: {syncTime}</p>
      )}

      {/* Test button */}
      <button
        onClick={handleTest}
        disabled={testMutation.isPending}
        className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
      >
        {testMutation.isPending ? (
          <Icon icon="solar:refresh-linear" width={14} className="animate-spin" />
        ) : (
          <Icon icon="solar:tuning-2-linear" width={14} />
        )}
        Тест связи
      </button>
    </div>
  );
}

export function AdminIntegrationsPage() {
  const { data, isLoading } = useMapIntegrations();
  const { data: overview } = useMapIntegrationsOverview();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const integrations = data?.integrations ?? [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <AdminPageHeader
        title="Интеграции с картами"
        subtitle="Управление синхронизацией локаций с картографическими платформами"
      />

      {/* Overview stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
            <p className="text-xs text-zinc-400">Активных локаций</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{overview.total_locations}</p>
          </div>
          {overview.platforms.map((p) => (
            <div key={p.platform} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
              <p className="text-xs text-zinc-400">{p.display_name}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">{p.synced}</span>
                {p.errors > 0 && (
                  <span className="text-xs text-red-500">+{p.errors} ош.</span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {p.is_enabled ? "Включена" : "Выключена"} / {p.enabled_locations} лок.
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Platform cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>

      {integrations.length === 0 && (
        <div className="text-center py-12 text-zinc-400">
          <Icon icon="solar:earth-bold-duotone" width={48} className="mx-auto mb-3 opacity-50" />
          <p>Нет настроенных интеграций</p>
          <p className="text-xs mt-1">Выполните SQL миграцию 020_map_integrations.sql</p>
        </div>
      )}
    </div>
  );
}
