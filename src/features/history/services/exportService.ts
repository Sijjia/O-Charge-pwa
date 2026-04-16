/**
 * Сервис для экспорта истории в различные форматы
 */

// Динамические импорты для снижения размера бандла
let jsPDFLazy: typeof import("jspdf") | null = null;
let autoTableLazy: typeof import("jspdf-autotable") | null = null;
let papaLazy: typeof import("papaparse") | null = null;
import type { ChargingHistoryItem, TransactionHistoryItem } from "../types";

// Расширяем интерфейс jsPDF для автотаблицы
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: {
      startY?: number;
      head?: unknown[][];
      body?: unknown[][];
      theme?: string;
      styles?: Record<string, unknown>;
      headStyles?: Record<string, unknown>;
      columnStyles?: Record<string | number, Record<string, unknown>>;
    }) => void;
    lastAutoTable?: {
      finalY?: number;
    };
  }
}

interface ExportOptions {
  filename?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeStats?: boolean;
}

export class ExportService {
  /**
   * Экспортирует историю зарядок в PDF
   */
  static async exportChargingHistoryToPDF(
    data: ChargingHistoryItem[],
    options: ExportOptions = {},
  ): Promise<void> {
    const {
      filename = `charging_history_${new Date().toISOString().split("T")[0]}.pdf`,
      includeStats = true,
    } = options;

    // Создаем новый PDF документ
    const jsPDF = (jsPDFLazy ??= await import("jspdf"));
    // Загружаем autotable для side effects (расширяет jsPDF.prototype)
    autoTableLazy ??= await import("jspdf-autotable");
    const doc = new jsPDF.jsPDF();

    // Добавляем заголовок
    doc.setFontSize(20);
    doc.text("История зарядок Red Petroleum", 14, 20);

    // Добавляем дату генерации
    doc.setFontSize(10);
    doc.text(
      `Дата создания: ${new Date().toLocaleDateString("ru-RU")}`,
      14,
      30,
    );

    // Если есть фильтр по датам
    if (options.dateRange) {
      doc.text(
        `Период: ${options.dateRange.start.toLocaleDateString("ru-RU")} - ${options.dateRange.end.toLocaleDateString("ru-RU")}`,
        14,
        36,
      );
    }

    // Подготавливаем данные для таблицы
    const tableData = data.map((item) => [
      new Date(item.startTime).toLocaleDateString("ru-RU"),
      new Date(item.startTime).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      item.stationName,
      item.connectorType,
      `${Math.floor(item.duration / 60)} мин`,
      `${item.energyConsumed.toFixed(2)} кВт⋅ч`,
      `${item.totalCost.toFixed(2)} сом`,
    ]);

    // Создаем таблицу - используем метод из doc, расширенный через декларацию
    doc.autoTable({
      startY: 45,
      head: [
        [
          "Дата",
          "Время",
          "Станция",
          "Тип",
          "Длительность",
          "Энергия",
          "Стоимость",
        ],
      ],
      body: tableData,
      theme: "striped",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [33, 150, 243], // Material Blue
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Дата
        1: { cellWidth: 20 }, // Время
        2: { cellWidth: 55 }, // Станция
        3: { cellWidth: 25 }, // Тип
        4: { cellWidth: 25 }, // Длительность
        5: { cellWidth: 25 }, // Энергия
        6: { cellWidth: 25, halign: "right" }, // Стоимость
      },
    });

    // Добавляем статистику, если нужно
    if (includeStats && data.length > 0) {
      const finalY = doc.lastAutoTable?.finalY || 45;

      const totalEnergy = data.reduce(
        (sum, item) => sum + item.energyConsumed,
        0,
      );
      const totalCost = data.reduce((sum, item) => sum + item.totalCost, 0);
      const totalDuration = data.reduce((sum, item) => sum + item.duration, 0);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Итого:", 14, finalY + 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Всего сессий: ${data.length}`, 14, finalY + 22);
      doc.text(
        `Общая энергия: ${totalEnergy.toFixed(2)} кВт⋅ч`,
        14,
        finalY + 28,
      );
      doc.text(
        `Общее время: ${Math.floor(totalDuration / 60)} мин`,
        14,
        finalY + 34,
      );
      doc.text(`Общая стоимость: ${totalCost.toFixed(2)} сом`, 14, finalY + 40);
    }

    // Сохраняем PDF
    doc.save(filename);
  }

  /**
   * Экспортирует историю зарядок в CSV
   */
  static async exportChargingHistoryToCSV(
    data: ChargingHistoryItem[],
    options: ExportOptions = {},
  ): Promise<void> {
    const {
      filename = `charging_history_${new Date().toISOString().split("T")[0]}.csv`,
    } = options;

    // Подготавливаем данные для CSV
    const csvData = data.map((item) => ({
      Дата: new Date(item.startTime).toLocaleDateString("ru-RU"),
      "Время начала": new Date(item.startTime).toLocaleTimeString("ru-RU"),
      "Время окончания": item.endTime
        ? new Date(item.endTime).toLocaleTimeString("ru-RU")
        : "",
      Станция: item.stationName,
      Адрес: item.stationAddress,
      Коннектор: item.connectorType,
      "ID коннектора": item.connectorId,
      "Длительность (мин)": Math.floor(item.duration / 60),
      "Энергия (кВт⋅ч)": item.energyConsumed,
      "Стоимость (сом)": item.totalCost,
      "Средняя мощность (кВт)": item.averagePower,
      "Максимальная мощность (кВт)": item.maxPower,
      Статус: item.status === "completed" ? "Завершено" : item.status,
    }));

    // Конвертируем в CSV (динамический импорт)
    const Papa = papaLazy ??= await import("papaparse");
    const csv = Papa.unparse(csvData, {
      delimiter: ",",
      header: true,
      newline: "\r\n",
      skipEmptyLines: true,
    });

    // Добавляем BOM для корректного отображения кириллицы в Excel
    const bom = "\uFEFF";
    const csvWithBom = bom + csv;

    // Создаем и скачиваем файл
    const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /**
   * Экспортирует историю транзакций в PDF
   */
  static async exportTransactionHistoryToPDF(
    data: TransactionHistoryItem[],
    options: ExportOptions = {},
  ): Promise<void> {
    const {
      filename = `transactions_${new Date().toISOString().split("T")[0]}.pdf`,
    } = options;

    const jsPDF = (jsPDFLazy ??= await import("jspdf"));
    // Загружаем autotable для side effects (расширяет jsPDF.prototype)
    autoTableLazy ??= await import("jspdf-autotable");
    const doc = new jsPDF.jsPDF();

    // Заголовок
    doc.setFontSize(20);
    doc.text("История транзакций Red Petroleum", 14, 20);

    // Дата генерации
    doc.setFontSize(10);
    doc.text(
      `Дата создания: ${new Date().toLocaleDateString("ru-RU")}`,
      14,
      30,
    );

    // Подготавливаем данные для таблицы
    const tableData = data.map((item) => {
      const typeLabel =
        item.type === "topup"
          ? "Пополнение"
          : item.type === "charge"
            ? "Зарядка"
            : item.type === "refund"
              ? "Возврат"
              : item.type;

      const statusLabel =
        item.status === "success"
          ? "Успешно"
          : item.status === "pending"
            ? "В обработке"
            : item.status === "failed"
              ? "Ошибка"
              : item.status;

      return [
        new Date(item.timestamp).toLocaleDateString("ru-RU"),
        new Date(item.timestamp).toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        typeLabel,
        item.description,
        item.amount > 0 ? `+${item.amount.toFixed(2)}` : item.amount.toFixed(2),
        item.balance_after.toFixed(2),
        statusLabel,
      ];
    });

    // Создаем таблицу - используем метод из doc, расширенный через декларацию
    doc.autoTable({
      startY: 40,
      head: [
        ["Дата", "Время", "Тип", "Описание", "Сумма (сом)", "Баланс", "Статус"],
      ],
      body: tableData,
      theme: "striped",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [76, 175, 80], // Material Green
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 55 },
        4: { cellWidth: 25, halign: "right" },
        5: { cellWidth: 25, halign: "right" },
        6: { cellWidth: 20 },
      },
    });

    // Добавляем итоговую информацию
    const finalY = doc.lastAutoTable?.finalY || 40;

    const totalTopup = data
      .filter((t) => t.type === "topup" && t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCharge = data
      .filter((t) => t.type === "charge" && t.status === "success")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Итого:", 14, finalY + 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Всего транзакций: ${data.length}`, 14, finalY + 22);
    doc.text(`Пополнения: +${totalTopup.toFixed(2)} сом`, 14, finalY + 28);
    doc.text(`Списания: -${totalCharge.toFixed(2)} сом`, 14, finalY + 34);

    doc.save(filename);
  }

  /**
   * Экспортирует историю транзакций в CSV
   */
  static async exportTransactionHistoryToCSV(
    data: TransactionHistoryItem[],
    options: ExportOptions = {},
  ): Promise<void> {
    const {
      filename = `transactions_${new Date().toISOString().split("T")[0]}.csv`,
    } = options;

    // Подготавливаем данные для CSV
    const csvData = data.map((item) => ({
      Дата: new Date(item.timestamp).toLocaleDateString("ru-RU"),
      Время: new Date(item.timestamp).toLocaleTimeString("ru-RU"),
      Тип:
        item.type === "topup"
          ? "Пополнение"
          : item.type === "charge"
            ? "Зарядка"
            : item.type === "refund"
              ? "Возврат"
              : item.type,
      Описание: item.description,
      "Сумма (сом)": item.amount,
      "Баланс до": item.balance_before,
      "Баланс после": item.balance_after,
      Статус:
        item.status === "success"
          ? "Успешно"
          : item.status === "pending"
            ? "В обработке"
            : item.status === "failed"
              ? "Ошибка"
              : item.status,
      "ID сессии": item.sessionId || "",
      "Способ оплаты": item.paymentMethod || "",
    }));

    // Конвертируем в CSV (динамический импорт)
    const Papa = papaLazy ??= await import("papaparse");
    const csv = Papa.unparse(csvData, {
      delimiter: ",",
      header: true,
      newline: "\r\n",
    });

    // Добавляем BOM для корректного отображения кириллицы
    const bom = "\uFEFF";
    const csvWithBom = bom + csv;

    // Создаем и скачиваем файл
    const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /**
   * Экспортирует доходы owner в CSV
   */
  static async exportRevenueToCSV(
    stations: Array<{
      id: string;
      serial_number: string;
      location?: { name: string };
      total_revenue?: number;
      total_energy?: number;
      active_sessions?: number;
      power_capacity: number;
    }>,
    options: ExportOptions & { period?: string } = {},
  ): Promise<void> {
    const {
      filename = `revenue_${new Date().toISOString().split("T")[0]}.csv`,
      period = 'all',
    } = options;

    // Подготавливаем данные для CSV
    const csvData: Array<Record<string, string | number>> = stations.map((station) => ({
      "Серийный номер": station.serial_number,
      "Локация": station.location?.name || 'Без локации',
      "Доход (сом)": station.total_revenue || 0,
      "Энергия (кВт⋅ч)": parseFloat((station.total_energy || 0).toFixed(2)),
      "Активных сессий": station.active_sessions || 0,
      "Мощность (кВт)": station.power_capacity,
      "Средняя доходность (сом/кВт⋅ч)": station.total_energy && station.total_energy > 0
        ? parseFloat(((station.total_revenue || 0) / station.total_energy).toFixed(2))
        : 0,
    }));

    // Добавляем итоговую строку
    const totalRevenue = stations.reduce((sum, s) => sum + (s.total_revenue || 0), 0);
    const totalEnergy = stations.reduce((sum, s) => sum + (s.total_energy || 0), 0);
    const totalSessions = stations.reduce((sum, s) => sum + (s.active_sessions || 0), 0);

    csvData.push({
      "Серийный номер": '---',
      "Локация": '---',
      "Доход (сом)": 0,
      "Энергия (кВт⋅ч)": 0,
      "Активных сессий": 0,
      "Мощность (кВт)": 0,
      "Средняя доходность (сом/кВт⋅ч)": 0,
    });

    csvData.push({
      "Серийный номер": 'ИТОГО',
      "Локация": `${stations.length} станций`,
      "Доход (сом)": parseFloat(totalRevenue.toFixed(2)),
      "Энергия (кВт⋅ч)": parseFloat(totalEnergy.toFixed(2)),
      "Активных сессий": totalSessions,
      "Мощность (кВт)": 0,
      "Средняя доходность (сом/кВт⋅ч)": totalEnergy > 0 ? parseFloat((totalRevenue / totalEnergy).toFixed(2)) : 0,
    });

    // Добавляем метаданные в начало
    const metadata = [
      ['Отчет о доходах', ''],
      ['Дата создания', new Date().toLocaleString('ru-RU')],
      ['Период', period === 'today' ? 'Сегодня' : period === 'week' ? 'Неделя' : period === 'month' ? 'Месяц' : period === 'custom' ? 'Выбранный период' : 'Всё время'],
      ['Всего станций', stations.length.toString()],
      ['', ''], // Пустая строка для разделения
    ];

    // Объединяем метаданные и данные
    const fullData = [
      ...metadata,
      ...csvData,
    ];

    // Конвертируем в CSV (динамический импорт)
    const Papa = papaLazy ??= await import("papaparse");
    const csv = Papa.unparse(fullData, {
      delimiter: ",",
      header: false,
      newline: "\r\n",
      skipEmptyLines: false,
    });

    // Добавляем BOM для корректного отображения кириллицы в Excel
    const bom = "\uFEFF";
    const csvWithBom = bom + csv;

    // Создаем и скачиваем файл
    const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /**
   * Определяет поддерживаемые форматы экспорта
   */
  static getSupportedFormats(): string[] {
    return ["PDF", "CSV"];
  }

  /**
   * Проверяет, поддерживается ли формат
   */
  static isFormatSupported(format: string): boolean {
    return ["pdf", "csv"].includes(format.toLowerCase());
  }
}
