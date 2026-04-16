/**
 * OCPP Error Code Dictionary — расшифровка всех ошибок зарядных станций
 * Поддержка: OCPP 1.6J + OCPP 2.0.1
 *
 * Цель: клиенты и операторы сами понимают проблему и не звонят в поддержку
 */

export interface OcppErrorInfo {
  /** Код ошибки (оригинал OCPP) */
  code: string;
  /** Краткое название на русском */
  title: string;
  /** Подробное описание для оператора */
  description: string;
  /** Что делать — пошаговая инструкция */
  action: string;
  /** Уровень серьёзности */
  severity: "info" | "warning" | "critical";
  /** Иконка */
  icon: string;
  /** Нужно ли звонить в поддержку Red Petroleum */
  callSupport: boolean;
}

/**
 * Полный справочник OCPP ошибок
 */
export const OCPP_ERRORS: Record<string, OcppErrorInfo> = {
  // ═══════════════════════════════════════════
  // OCPP 1.6J Error Codes
  // ═══════════════════════════════════════════

  NoError: {
    code: "NoError",
    title: "Нет ошибки",
    description: "Станция работает нормально. Ошибок не обнаружено.",
    action: "Действий не требуется.",
    severity: "info",
    icon: "solar:check-circle-bold-duotone",
    callSupport: false,
  },

  ConnectorLockFailure: {
    code: "ConnectorLockFailure",
    title: "Замок коннектора не закрылся",
    description: "Механизм блокировки коннектора не сработал. Кабель зарядки не зафиксирован в разъёме станции или автомобиля.",
    action: "1. Отключите кабель от автомобиля и станции\n2. Проверьте разъём на наличие грязи, льда или посторонних предметов\n3. Вставьте кабель заново до щелчка\n4. Попробуйте запустить зарядку снова\n5. Если не помогло — попробуйте другой коннектор",
    severity: "warning",
    icon: "solar:lock-keyhole-unlocked-bold-duotone",
    callSupport: false,
  },

  EVCommunicationError: {
    code: "EVCommunicationError",
    title: "Нет связи с автомобилем",
    description: "Станция не может установить связь с бортовым компьютером автомобиля. Автомобиль не отвечает на запросы станции.",
    action: "1. Проверьте что автомобиль разблокирован и готов к зарядке\n2. Отключите и снова подключите кабель зарядки\n3. Перезапустите систему зарядки в автомобиле (выключите/включите зажигание)\n4. Убедитесь что порт зарядки авто чистый и сухой\n5. Попробуйте другой коннектор или станцию",
    severity: "warning",
    icon: "solar:plug-circle-bold-duotone",
    callSupport: false,
  },

  GroundFailure: {
    code: "GroundFailure",
    title: "Нарушение заземления",
    description: "Обнаружена проблема с защитным заземлением станции. Это критическая проблема безопасности — станция автоматически остановила зарядку для вашей защиты.",
    action: "1. НЕ пытайтесь запустить зарядку повторно\n2. Отключите кабель от автомобиля\n3. Используйте другую станцию\n4. Сообщите оператору о проблеме",
    severity: "critical",
    icon: "solar:danger-triangle-bold-duotone",
    callSupport: true,
  },

  HighTemperature: {
    code: "HighTemperature",
    title: "Перегрев станции",
    description: "Температура внутри станции или кабеля превысила допустимый предел. Станция остановлена для предотвращения повреждений.",
    action: "1. Прекратите зарядку и отключите кабель\n2. Подождите 15–20 минут, пока станция остынет\n3. Попробуйте запустить зарядку снова\n4. Если ошибка повторяется — используйте другую станцию",
    severity: "critical",
    icon: "solar:temperature-bold-duotone",
    callSupport: false,
  },

  InternalError: {
    code: "InternalError",
    title: "Внутренняя ошибка станции",
    description: "Произошла программная ошибка в контроллере зарядной станции.",
    action: "1. Подождите 1–2 минуты — станция может перезагрузиться автоматически\n2. Если статус не изменился — попробуйте другой коннектор\n3. Используйте другую станцию",
    severity: "warning",
    icon: "solar:bug-bold-duotone",
    callSupport: false,
  },

  LocalListConflict: {
    code: "LocalListConflict",
    title: "Конфликт авторизации",
    description: "Ошибка в локальном списке авторизации станции. Ваша карта или аккаунт не распознаны.",
    action: "1. Попробуйте авторизоваться заново через приложение\n2. Перезапустите зарядку через QR-код на станции\n3. Если не помогло — используйте другую станцию",
    severity: "warning",
    icon: "solar:shield-warning-bold-duotone",
    callSupport: false,
  },

  OtherError: {
    code: "OtherError",
    title: "Неизвестная ошибка",
    description: "Станция сообщила об ошибке, которая не входит в стандартную классификацию OCPP.",
    action: "1. Отключите кабель и подождите 30 секунд\n2. Попробуйте запустить зарядку снова\n3. Если ошибка повторяется — используйте другую станцию",
    severity: "warning",
    icon: "solar:question-circle-bold-duotone",
    callSupport: false,
  },

  OverCurrentFailure: {
    code: "OverCurrentFailure",
    title: "Превышение тока",
    description: "Ток зарядки превысил безопасный предел. Станция автоматически остановила зарядку для защиты автомобиля и оборудования.",
    action: "1. Отключите кабель от автомобиля\n2. Подождите 2–3 минуты\n3. Попробуйте зарядку на меньшей мощности (если есть выбор)\n4. Если ошибка повторяется — используйте другую станцию",
    severity: "critical",
    icon: "solar:bolt-circle-bold-duotone",
    callSupport: true,
  },

  OverVoltage: {
    code: "OverVoltage",
    title: "Повышенное напряжение в сети",
    description: "Напряжение электросети выше нормы. Станция остановлена для защиты оборудования. Проблема на стороне электросети, а не станции.",
    action: "1. Проблема временная — подождите 10–15 минут\n2. Попробуйте запустить зарядку снова\n3. Если ошибка сохраняется — напряжение в сети нестабильно, попробуйте другую локацию",
    severity: "critical",
    icon: "solar:flash-circle-bold-duotone",
    callSupport: false,
  },

  PowerMeterFailure: {
    code: "PowerMeterFailure",
    title: "Ошибка счётчика энергии",
    description: "Встроенный счётчик электроэнергии станции неисправен. Станция не может корректно измерять потреблённую энергию.",
    action: "1. Попробуйте другой коннектор на этой станции\n2. Если не помогло — используйте другую станцию\n3. Сообщите оператору — требуется техобслуживание",
    severity: "warning",
    icon: "solar:calculator-bold-duotone",
    callSupport: true,
  },

  PowerSwitchFailure: {
    code: "PowerSwitchFailure",
    title: "Ошибка силового реле",
    description: "Силовое реле (контактор) станции не переключается. Станция не может подать или отключить питание для зарядки.",
    action: "1. НЕ пытайтесь запустить зарядку повторно\n2. Используйте другую станцию\n3. Сообщите оператору — требуется ремонт",
    severity: "critical",
    icon: "solar:power-bold-duotone",
    callSupport: true,
  },

  ReaderFailure: {
    code: "ReaderFailure",
    title: "Неисправность считывателя карт",
    description: "RFID-считыватель или считыватель карт на станции не работает.",
    action: "1. Используйте приложение для запуска зарядки вместо карты\n2. Отсканируйте QR-код на станции\n3. Если зарядка доступна только по карте — используйте другую станцию",
    severity: "warning",
    icon: "solar:card-bold-duotone",
    callSupport: false,
  },

  ResetFailure: {
    code: "ResetFailure",
    title: "Ошибка перезагрузки",
    description: "Станция не смогла корректно перезагрузиться. Контроллер завис.",
    action: "1. Подождите 5 минут — станция может восстановиться\n2. Если не помогло — используйте другую станцию\n3. Сообщите оператору",
    severity: "warning",
    icon: "solar:refresh-circle-bold-duotone",
    callSupport: true,
  },

  UnderVoltage: {
    code: "UnderVoltage",
    title: "Пониженное напряжение в сети",
    description: "Напряжение электросети ниже нормы. Станция не может обеспечить стабильную зарядку. Проблема на стороне электросети.",
    action: "1. Проблема временная — подождите 10–15 минут\n2. Попробуйте запустить зарядку снова\n3. Если ошибка сохраняется — возможно, перегрузка электросети в данной локации",
    severity: "warning",
    icon: "solar:flash-circle-bold-duotone",
    callSupport: false,
  },

  WeakSignal: {
    code: "WeakSignal",
    title: "Слабый сигнал связи",
    description: "Станция имеет слабое соединение с сервером (GSM/Wi-Fi). Зарядка может работать, но данные о сессии могут обновляться с задержкой.",
    action: "1. Зарядка скорее всего работает нормально\n2. Данные о сессии могут появиться в истории с задержкой\n3. Если зарядка не стартует — попробуйте другую станцию",
    severity: "info",
    icon: "solar:wifi-router-bold-duotone",
    callSupport: false,
  },

  // ═══════════════════════════════════════════
  // OCPP 2.0.1 Additional Error Codes
  // ═══════════════════════════════════════════

  ChargerConnectorLockFault: {
    code: "ChargerConnectorLockFault",
    title: "Замок коннектора неисправен",
    description: "Механизм блокировки коннектора станции не работает (OCPP 2.0.1).",
    action: "1. Отключите кабель и проверьте разъём\n2. Попробуйте другой коннектор\n3. Используйте другую станцию",
    severity: "warning",
    icon: "solar:lock-keyhole-unlocked-bold-duotone",
    callSupport: false,
  },

  EVConnectorLockFault: {
    code: "EVConnectorLockFault",
    title: "Замок разъёма автомобиля",
    description: "Проблема с блокировкой кабеля со стороны автомобиля.",
    action: "1. Проверьте порт зарядки автомобиля\n2. Отключите и подключите кабель заново\n3. Перезапустите систему зарядки в автомобиле",
    severity: "warning",
    icon: "solar:lock-keyhole-unlocked-bold-duotone",
    callSupport: false,
  },

  ContactorFault: {
    code: "ContactorFault",
    title: "Неисправность контактора",
    description: "Силовой контактор (реле) станции не переключается. DC зарядка невозможна.",
    action: "1. Не пытайтесь запустить зарядку повторно\n2. Используйте другую станцию\n3. Сообщите оператору",
    severity: "critical",
    icon: "solar:power-bold-duotone",
    callSupport: true,
  },

  IsolationFault: {
    code: "IsolationFault",
    title: "Нарушение изоляции",
    description: "Обнаружена утечка тока — нарушена электрическая изоляция. Критическая проблема безопасности.",
    action: "1. НЕМЕДЛЕННО прекратите зарядку\n2. Отключите кабель\n3. Не прикасайтесь к мокрым частям станции\n4. Используйте другую станцию",
    severity: "critical",
    icon: "solar:danger-triangle-bold-duotone",
    callSupport: true,
  },

  OverTemperature: {
    code: "OverTemperature",
    title: "Критический перегрев",
    description: "Температура критически высока. Аналог HighTemperature в OCPP 2.0.1.",
    action: "1. Немедленно отключите кабель\n2. Подождите 20–30 минут\n3. Используйте другую станцию",
    severity: "critical",
    icon: "solar:temperature-bold-duotone",
    callSupport: true,
  },

  MemoryFault: {
    code: "MemoryFault",
    title: "Ошибка памяти станции",
    description: "Внутренняя память контроллера станции повреждена.",
    action: "1. Станция может восстановиться после перезагрузки\n2. Подождите 5 минут\n3. Если ошибка сохраняется — используйте другую станцию",
    severity: "warning",
    icon: "solar:cpu-bolt-bold-duotone",
    callSupport: true,
  },

  FirmwareUpdateFault: {
    code: "FirmwareUpdateFault",
    title: "Ошибка обновления прошивки",
    description: "Станция не смогла обновить программное обеспечение. Может работать нестабильно.",
    action: "1. Зарядка может работать нормально\n2. Если возникают проблемы — используйте другую станцию\n3. Обновление будет повторено автоматически",
    severity: "info",
    icon: "solar:download-bold-duotone",
    callSupport: false,
  },

  // ═══════════════════════════════════════════
  // Station Statuses (не ошибки, но полезно)
  // ═══════════════════════════════════════════

  Available: {
    code: "Available",
    title: "Доступна",
    description: "Станция готова к зарядке.",
    action: "Подключите кабель и запустите зарядку через приложение.",
    severity: "info",
    icon: "solar:check-circle-bold-duotone",
    callSupport: false,
  },

  Preparing: {
    code: "Preparing",
    title: "Подготовка",
    description: "Кабель подключён, станция готовится к зарядке.",
    action: "Подождите — зарядка начнётся автоматически через несколько секунд.",
    severity: "info",
    icon: "solar:hourglass-bold-duotone",
    callSupport: false,
  },

  Charging: {
    code: "Charging",
    title: "Зарядка",
    description: "Идёт зарядка автомобиля.",
    action: "Зарядка в процессе. Следите за прогрессом в приложении.",
    severity: "info",
    icon: "solar:bolt-circle-bold-duotone",
    callSupport: false,
  },

  SuspendedEVSE: {
    code: "SuspendedEVSE",
    title: "Приостановлена станцией",
    description: "Станция временно приостановила зарядку (например, из-за управления нагрузкой).",
    action: "1. Зарядка возобновится автоматически\n2. Если не возобновилась через 5 минут — перезапустите зарядку",
    severity: "info",
    icon: "solar:pause-circle-bold-duotone",
    callSupport: false,
  },

  SuspendedEV: {
    code: "SuspendedEV",
    title: "Приостановлена автомобилем",
    description: "Автомобиль попросил станцию приостановить зарядку (батарея почти полная или управление зарядкой авто).",
    action: "1. Батарея может быть уже заряжена — проверьте уровень в авто\n2. Автомобиль может ограничивать зарядку по температуре\n3. Отключите кабель если зарядка завершена",
    severity: "info",
    icon: "solar:pause-circle-bold-duotone",
    callSupport: false,
  },

  Finishing: {
    code: "Finishing",
    title: "Завершение",
    description: "Зарядка завершается, станция отключает питание.",
    action: "Подождите несколько секунд, затем отключите кабель.",
    severity: "info",
    icon: "solar:check-circle-bold-duotone",
    callSupport: false,
  },

  Reserved: {
    code: "Reserved",
    title: "Зарезервирована",
    description: "Станция зарезервирована другим пользователем.",
    action: "Используйте другую станцию или дождитесь окончания бронирования.",
    severity: "info",
    icon: "solar:calendar-bold-duotone",
    callSupport: false,
  },

  Unavailable: {
    code: "Unavailable",
    title: "Недоступна",
    description: "Станция выведена из эксплуатации (техобслуживание или отключена оператором).",
    action: "Используйте другую станцию. Станция вернётся в работу после обслуживания.",
    severity: "warning",
    icon: "solar:close-circle-bold-duotone",
    callSupport: false,
  },

  Faulted: {
    code: "Faulted",
    title: "Неисправность",
    description: "Станция обнаружила неисправность и не может выполнять зарядку.",
    action: "1. Не пытайтесь использовать эту станцию\n2. Используйте другую станцию\n3. Ошибка уже отправлена оператору автоматически",
    severity: "critical",
    icon: "solar:danger-circle-bold-duotone",
    callSupport: false,
  },

  Offline: {
    code: "Offline",
    title: "Нет связи",
    description: "Станция не отвечает серверу. Возможно, проблема с интернет-соединением или питанием.",
    action: "1. Станция может быть временно недоступна\n2. Попробуйте через 10–15 минут\n3. Если станция не появляется — используйте другую",
    severity: "warning",
    icon: "solar:wifi-router-minimalistic-bold-duotone",
    callSupport: false,
  },
};

/**
 * Получить информацию об OCPP ошибке
 */
export function getOcppError(code: string | null | undefined): OcppErrorInfo {
  if (!code) return OCPP_ERRORS["NoError"]!;
  return OCPP_ERRORS[code] ?? {
    code: code,
    title: code,
    description: `Неизвестный код ошибки: ${code}`,
    action: "Попробуйте перезапустить зарядку или используйте другую станцию.",
    severity: "warning" as const,
    icon: "solar:question-circle-bold-duotone",
    callSupport: false,
  };
}

/**
 * Цвета по severity
 */
export function getSeverityColor(severity: OcppErrorInfo["severity"]) {
  switch (severity) {
    case "critical": return { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-600 dark:text-red-400", border: "border-red-200 dark:border-red-800", dot: "bg-red-500" };
    case "warning": return { bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-600 dark:text-yellow-400", border: "border-yellow-200 dark:border-yellow-800", dot: "bg-yellow-500" };
    case "info": return { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" };
  }
}
