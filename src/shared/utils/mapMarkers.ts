/**
 * Утилита для генерации SVG маркеров карты с кольцом статусов коннекторов
 *
 * Маркер представляет собой круг с:
 * - Внешним кольцом из цветных сегментов (статусы коннекторов)
 * - Белым центром с иконкой молнии и числом станций
 */

/**
 * Цвета статусов - синхронизированы с theme.css
 *
 * Backend возвращает connectors_summary: { available, occupied, faulted }
 * - available = свободен (зелёный)
 * - occupied = занят/заряжается (жёлтый) — Backend не разделяет charging и occupied
 * - faulted = ошибка (красный)
 * - offline = недоступен (серый) — вычисляется как total - available - occupied - faulted
 */
export const STATUS_COLORS = {
  available: "#10B981", // Зелёный — свободен
  occupied: "#F59E0B", // Жёлтый — занят/заряжается
  offline: "#9CA3AF", // Серый — недоступен
  faulted: "#EF4444", // Красный — ошибка
} as const;

export type ConnectorStatus = keyof typeof STATUS_COLORS;

interface ConnectorSummary {
  available: number;
  occupied: number;
  faulted: number;
  offline?: number;
  total?: number;
}

interface MarkerOptions {
  /** Размер маркера в пикселях */
  size?: number;
  /** Толщина кольца в пикселях */
  ringWidth?: number;
  /** Количество станций для отображения в центре */
  stationsCount?: number;
  /** Показывать иконку молнии */
  showIcon?: boolean;
}

/**
 * Генерирует SVG маркер с кольцом статусов
 *
 * @param connectors - Объект с количеством коннекторов по статусам
 * @param options - Опции маркера
 * @returns Data URL для использования в качестве иконки маркера
 *
 * @example
 * const markerUrl = createLocationMarkerSVG(
 *   { available: 2, occupied: 1, faulted: 0 },
 *   { stationsCount: 2 }
 * );
 */
export function createLocationMarkerSVG(
  connectors: ConnectorSummary,
  options: MarkerOptions = {},
): string {
  const {
    size = 44,
    ringWidth = 4,
    stationsCount = 1,
    showIcon = true,
  } = options;

  const center = size / 2;
  const outerRadius = size / 2 - 1; // -1 для тени
  const innerRadius = outerRadius - ringWidth;

  // Собираем массив сегментов
  const segments: Array<{ status: ConnectorStatus; count: number }> = [];

  if (connectors.available > 0) {
    segments.push({ status: "available", count: connectors.available });
  }
  if (connectors.occupied > 0) {
    segments.push({ status: "occupied", count: connectors.occupied });
  }
  if (connectors.faulted > 0) {
    segments.push({ status: "faulted", count: connectors.faulted });
  }

  // Добавляем offline если есть total
  const totalDefined =
    connectors.total ||
    connectors.available + connectors.occupied + connectors.faulted;
  const offlineCount =
    connectors.offline ||
    Math.max(
      0,
      totalDefined -
        connectors.available -
        connectors.occupied -
        connectors.faulted,
    );

  if (offlineCount > 0) {
    segments.push({ status: "offline", count: offlineCount });
  }

  // Общее количество сегментов
  const totalConnectors = segments.reduce((sum, s) => sum + s.count, 0);

  // Если нет коннекторов, показываем серый маркер
  if (totalConnectors === 0) {
    return createSimpleMarkerSVG(STATUS_COLORS.offline, size, stationsCount);
  }

  // Генерируем SVG пути для сегментов кольца
  const ringPaths = generateRingSegments(
    segments,
    totalConnectors,
    center,
    outerRadius,
    innerRadius,
  );

  // Определяем основной цвет для тени (по первому сегменту)
  const firstSegment = segments[0];
  const primaryColor = firstSegment
    ? STATUS_COLORS[firstSegment.status]
    : STATUS_COLORS.offline;

  // Иконка молнии
  const iconSvg = showIcon
    ? `<path d="M${center - 4} ${center + 2}L${center} ${center - 5}L${center} ${center}L${center + 4} ${center - 2}L${center} ${center + 5}L${center} ${center}Z" fill="#6B7280" opacity="0.8"/>`
    : "";

  // Текст с количеством станций (только если > 1 или нет иконки)
  const showText = stationsCount > 1 || !showIcon;
  const textSvg = showText
    ? `<text x="${center}" y="${center + (showIcon ? 6 : 1)}" text-anchor="middle" dominant-baseline="middle" fill="#374151" font-family="Inter, system-ui, sans-serif" font-size="${showIcon ? 9 : 12}" font-weight="600">${stationsCount}</text>`
    : "";

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="${primaryColor}" flood-opacity="0.3"/>
        </filter>
      </defs>
      <circle cx="${center}" cy="${center}" r="${outerRadius}" fill="white" filter="url(#shadow)"/>
      ${ringPaths}
      <circle cx="${center}" cy="${center}" r="${innerRadius - 1}" fill="white"/>
      ${iconSvg}
      ${textSvg}
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

/**
 * Генерирует простой маркер без сегментов
 */
export function createSimpleMarkerSVG(
  color: string,
  size: number = 44,
  count: number = 1,
): string {
  const center = size / 2;
  const radius = size / 2 - 2;

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="${color}" flood-opacity="0.3"/>
        </filter>
      </defs>
      <circle cx="${center}" cy="${center}" r="${radius}" fill="${color}" filter="url(#shadow)"/>
      <circle cx="${center}" cy="${center}" r="${radius - 3}" fill="white" opacity="0.95"/>
      <text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="central" fill="${color}" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600">${count}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

/**
 * Генерирует SVG пути для сегментов кольца
 */
function generateRingSegments(
  segments: Array<{ status: ConnectorStatus; count: number }>,
  total: number,
  center: number,
  outerRadius: number,
  innerRadius: number,
): string {
  if (segments.length === 0) return "";

  // Если только один тип статуса, рисуем полное кольцо
  if (segments.length === 1) {
    const seg = segments[0]!;
    return `<circle cx="${center}" cy="${center}" r="${(outerRadius + innerRadius) / 2}" fill="none" stroke="${STATUS_COLORS[seg.status]}" stroke-width="${outerRadius - innerRadius}"/>`;
  }

  const paths: string[] = [];
  let currentAngle = -90; // Начинаем сверху
  const gap = 3; // Зазор между сегментами в градусах

  segments.forEach((segment) => {
    const segmentAngle = (segment.count / total) * 360 - gap;

    if (segmentAngle <= 0) return;

    const startAngle = currentAngle + gap / 2;
    const endAngle = startAngle + segmentAngle;

    const path = describeArc(
      center,
      center,
      outerRadius,
      innerRadius,
      startAngle,
      endAngle,
    );

    paths.push(`<path d="${path}" fill="${STATUS_COLORS[segment.status]}" />`);

    currentAngle += (segment.count / total) * 360;
  });

  return paths.join("\n");
}

/**
 * Создаёт SVG path для дуги (сегмента кольца)
 */
function describeArc(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const startOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
  const endOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
  const startInner = polarToCartesian(cx, cy, innerRadius, endAngle);
  const endInner = polarToCartesian(cx, cy, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    startOuter.x,
    startOuter.y,
    "A",
    outerRadius,
    outerRadius,
    0,
    largeArcFlag,
    0,
    endOuter.x,
    endOuter.y,
    "L",
    endInner.x,
    endInner.y,
    "A",
    innerRadius,
    innerRadius,
    0,
    largeArcFlag,
    1,
    startInner.x,
    startInner.y,
    "Z",
  ].join(" ");
}

/**
 * Конвертирует полярные координаты в декартовы
 */
function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number,
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

/**
 * Создаёт маркер местоположения пользователя
 */
export function createUserLocationMarkerSVG(size: number = 24): string {
  const center = size / 2;
  const outerRadius = size / 2 - 2;
  const innerRadius = outerRadius / 3;

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="${center}" cy="${center}" r="${outerRadius}" fill="#3B82F6" stroke="white" stroke-width="2" filter="url(#glow)"/>
      <circle cx="${center}" cy="${center}" r="${innerRadius}" fill="white"/>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

/**
 * Создаёт маркер для кластера
 *
 * Дизайн: белый круг с серым кольцом (нейтральный), БЕЗ молнии.
 * Число локаций отображается через HTML-стиль кластера поверх иконки.
 * Серый цвет потому что неизвестно какие станции внутри кластера.
 */
export function createClusterMarkerSVG(
  _count: number,
  size: number = 48,
): string {
  const center = size / 2;
  const outerRadius = size / 2 - 2;
  const ringWidth = 5;
  const innerRadius = outerRadius - ringWidth;

  // Серый цвет для нейтрального кластера
  const clusterColor = STATUS_COLORS.offline;

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="clusterShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="${clusterColor}" flood-opacity="0.3"/>
        </filter>
      </defs>
      <!-- Внешний белый круг с тенью -->
      <circle cx="${center}" cy="${center}" r="${outerRadius}" fill="white" filter="url(#clusterShadow)"/>
      <!-- Серое кольцо (нейтральный цвет) -->
      <circle cx="${center}" cy="${center}" r="${(outerRadius + innerRadius) / 2}" fill="none" stroke="${clusterColor}" stroke-width="${ringWidth}"/>
      <!-- Белый центр -->
      <circle cx="${center}" cy="${center}" r="${innerRadius - 1}" fill="white"/>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
