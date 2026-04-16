import { memo, useMemo } from "react";

/**
 * Статусы коннекторов для отображения
 */
export type ConnectorStatusType =
  | "available"
  | "charging"
  | "occupied"
  | "offline"
  | "faulted";

interface ConnectorStatusDotsProps {
  /** Количество свободных коннекторов */
  available?: number;
  /** Количество коннекторов в процессе зарядки */
  charging?: number;
  /** Количество занятых коннекторов (ожидание) */
  occupied?: number;
  /** Количество офлайн коннекторов */
  offline?: number;
  /** Количество коннекторов с ошибкой */
  faulted?: number;
  /** Общее количество (если не указаны отдельные статусы) */
  total?: number;
  /** Размер точек: sm (6px), md (8px), lg (10px) */
  size?: "sm" | "md" | "lg";
  /** Максимальное количество точек для отображения (остальные показываются как +N) */
  maxDots?: number;
  /** Дополнительные CSS классы */
  className?: string;
}

/**
 * Цвета статусов - синхронизированы с theme.css
 */
const STATUS_COLORS: Record<ConnectorStatusType, string> = {
  available: "bg-ev-status-available", // #10B981 - зелёный
  charging: "bg-ev-status-charging", // #3B82F6 - синий
  occupied: "bg-ev-status-occupied", // #F59E0B - жёлтый
  offline: "bg-ev-status-offline", // #9CA3AF - серый
  faulted: "bg-ev-status-faulted", // #EF4444 - красный
};

/**
 * Размеры точек
 */
const DOT_SIZES = {
  sm: "w-1.5 h-1.5", // 6px
  md: "w-2 h-2", // 8px
  lg: "w-2.5 h-2.5", // 10px
};

/**
 * ConnectorStatusDots - компактное отображение статусов коннекторов
 *
 * Показывает цветные точки для каждого коннектора:
 * - 🟢 Зелёный = Available (свободен)
 * - 🔵 Синий = Charging (идёт зарядка)
 * - 🟡 Жёлтый = Occupied (занят, ожидает)
 * - ⚫ Серый = Offline (недоступен)
 * - 🔴 Красный = Faulted (ошибка)
 *
 * @example
 * // 3 свободных, 1 занятый
 * <ConnectorStatusDots available={3} occupied={1} />
 *
 * @example
 * // С ограничением количества точек
 * <ConnectorStatusDots available={5} occupied={3} maxDots={6} />
 */
export const ConnectorStatusDots = memo(function ConnectorStatusDots({
  available = 0,
  charging = 0,
  occupied = 0,
  offline = 0,
  faulted = 0,
  total,
  size = "md",
  maxDots = 8,
  className = "",
}: ConnectorStatusDotsProps) {
  // Генерируем массив точек с их статусами и уникальными ID
  const dots = useMemo(() => {
    const result: Array<{ id: string; status: ConnectorStatusType }> = [];

    // Порядок: available → charging → occupied → offline → faulted
    // (сначала "хорошие" статусы, потом "плохие")
    for (let i = 0; i < available; i++)
      result.push({ id: `available-${i}`, status: "available" });
    for (let i = 0; i < charging; i++)
      result.push({ id: `charging-${i}`, status: "charging" });
    for (let i = 0; i < occupied; i++)
      result.push({ id: `occupied-${i}`, status: "occupied" });
    for (let i = 0; i < offline; i++)
      result.push({ id: `offline-${i}`, status: "offline" });
    for (let i = 0; i < faulted; i++)
      result.push({ id: `faulted-${i}`, status: "faulted" });

    // Если указан total и он больше суммы, добавляем offline
    if (total && total > result.length) {
      const remaining = total - result.length;
      for (let i = 0; i < remaining; i++)
        result.push({ id: `offline-extra-${i}`, status: "offline" });
    }

    return result;
  }, [available, charging, occupied, offline, faulted, total]);

  // Если нет точек, не рендерим
  if (dots.length === 0) {
    return null;
  }

  // Определяем сколько точек показывать и есть ли overflow
  const visibleDots = dots.slice(0, maxDots);
  const overflowCount = dots.length - maxDots;
  const hasOverflow = overflowCount > 0;

  const dotSizeClass = DOT_SIZES[size];
  const gapClass = size === "sm" ? "gap-0.5" : "gap-1";

  return (
    <div
      className={`inline-flex items-center ${gapClass} ${className}`}
      role="status"
      aria-label={`Коннекторы: ${available} свободно, ${charging + occupied} занято, ${offline} офлайн, ${faulted} с ошибкой`}
    >
      {visibleDots.map((dot) => (
        <span
          key={dot.id}
          className={`${dotSizeClass} rounded-full ${STATUS_COLORS[dot.status]} flex-shrink-0`}
          title={getStatusTitle(dot.status)}
        />
      ))}
      {hasOverflow && (
        <span className="text-2xs text-gray-400 font-medium ml-0.5">
          +{overflowCount}
        </span>
      )}
    </div>
  );
});

/**
 * Получает человекочитаемое название статуса
 */
function getStatusTitle(status: ConnectorStatusType): string {
  const titles: Record<ConnectorStatusType, string> = {
    available: "Свободен",
    charging: "Идёт зарядка",
    occupied: "Занят",
    offline: "Недоступен",
    faulted: "Ошибка",
  };
  return titles[status];
}

/**
 * Хелпер для подсчёта статусов из массива коннекторов
 */
export function countConnectorStatuses(
  connectors: Array<{ status: string }>,
): Pick<
  ConnectorStatusDotsProps,
  "available" | "charging" | "occupied" | "offline" | "faulted"
> {
  const counts = {
    available: 0,
    charging: 0,
    occupied: 0,
    offline: 0,
    faulted: 0,
  };

  connectors.forEach((connector) => {
    const status = connector.status.toLowerCase();

    if (status === "available") {
      counts.available++;
    } else if (
      status === "charging" ||
      status === "preparing" ||
      status === "finishing"
    ) {
      counts.charging++;
    } else if (
      status === "occupied" ||
      status === "suspendedev" ||
      status === "suspendedevse"
    ) {
      counts.occupied++;
    } else if (status === "faulted") {
      counts.faulted++;
    } else {
      // unavailable, reserved, offline и другие
      counts.offline++;
    }
  });

  return counts;
}

/**
 * Хелпер для создания статусов из summary данных локации/станции
 */
export function getStatusFromSummary(summary: {
  available?: number;
  occupied?: number;
  faulted?: number;
  total?: number;
}): Pick<
  ConnectorStatusDotsProps,
  "available" | "occupied" | "faulted" | "offline"
> {
  const available = summary.available || 0;
  const occupied = summary.occupied || 0;
  const faulted = summary.faulted || 0;
  const total = summary.total || available + occupied + faulted;
  const offline = Math.max(0, total - available - occupied - faulted);

  return { available, occupied, faulted, offline };
}
