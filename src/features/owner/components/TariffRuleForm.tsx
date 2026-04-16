import { useState } from "react";
import { Icon } from "@iconify/react";
import type { CreateRuleBody } from "../services/adminTariffsService";

const TARIFF_TYPES = [
  { value: "per_kwh", label: "За кВтч" },
  { value: "per_minute", label: "За минуту" },
  { value: "session_fee", label: "За сессию" },
  { value: "parking_fee", label: "Парковка" },
];

const CONNECTOR_TYPES = [
  { value: "ALL", label: "Все" },
  { value: "Type2", label: "Type 2" },
  { value: "CCS2", label: "CCS2" },
  { value: "CHAdeMO", label: "CHAdeMO" },
  { value: "GBT", label: "GB/T" },
];

interface Props {
  onSubmit: (rule: CreateRuleBody) => void;
  onCancel: () => void;
  initial?: Partial<CreateRuleBody>;
  isLoading?: boolean;
}

export function TariffRuleForm({ onSubmit, onCancel, initial, isLoading }: Props) {
  const [name, setName] = useState(initial?.name || "");
  const [tariffType, setTariffType] = useState(initial?.tariff_type || "per_kwh");
  const [connectorType, setConnectorType] = useState(initial?.connector_type || "ALL");
  const [price, setPrice] = useState(initial?.price?.toString() || "");
  const [currency] = useState(initial?.currency || "KGS");
  const [timeStart, setTimeStart] = useState(initial?.time_start || "");
  const [timeEnd, setTimeEnd] = useState(initial?.time_end || "");
  const [priority, setPriority] = useState(initial?.priority?.toString() || "10");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    if (!name.trim()) { setError("Укажите название правила"); return; }
    const p = parseFloat(price);
    if (isNaN(p) || p < 0) { setError("Укажите корректную цену"); return; }

    onSubmit({
      name: name.trim(),
      tariff_type: tariffType,
      connector_type: connectorType,
      price: p,
      currency,
      time_start: timeStart || null,
      time_end: timeEnd || null,
      priority: parseInt(priority) || 10,
    });
  };

  const inputCls = "w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-red-500/50 transition-colors";
  const labelCls = "block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1";

  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 space-y-3">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Название</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Базовый тариф" />
        </div>
        <div>
          <label className={labelCls}>Тип тарифа</label>
          <select value={tariffType} onChange={(e) => setTariffType(e.target.value)} className={inputCls}>
            {TARIFF_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Коннектор</label>
          <select value={connectorType} onChange={(e) => setConnectorType(e.target.value)} className={inputCls}>
            {CONNECTOR_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Цена ({currency})</label>
          <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} placeholder="8.50" />
        </div>
        <div>
          <label className={labelCls}>Время начала</label>
          <input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Время окончания</label>
          <input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Приоритет</label>
          <input type="number" min="1" max="100" value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls} placeholder="10" />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
        >
          Отмена
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading && <Icon icon="solar:refresh-linear" width={14} className="animate-spin" />}
          {initial ? "Сохранить" : "Добавить"}
        </button>
      </div>
    </div>
  );
}
