/**
 * Demo данные для Sandbox, всех панелей (offline/demo mode)
 *
 * Реалистичная структура:
 * - 20 локаций: 15 в Бишкеке, 3 в Оше, 2 в Нарыне
 * - 35 станций (20 в Бишкеке, 8 в Оше, 7 в Нарыне)
 * - 34+ сессий сегодня
 * - Разные демо данные для разных ролей:
 *   - SystemAdmin: видит ВСЕ локации и станции
 *   - RegionalOperator: видит только станции своего города
 *   - PartnerCompany: видит только свои станции (в разных городах)
 */

import type { Location, StationStatusResponse } from "@/api/types";

// ========== Partner Info ==========

export const demoPartner = {
  id: "partner-001",
  company_name: "АО Бишкек Электро",
  contact_name: "Алмаз Токтоналиев",
  phone: "+996555123456",
  email: "almaz@bishkek-electro.kg",
  revenue_share: 0.8, // 80% от дохода
  contract_start: "2025-06-01",
  status: "active" as const,
};

// ========== Stations (35 TOTAL) ==========

export interface DemoStation {
  id: string;
  serial_number: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  status: "online" | "offline" | "charging" | "maintenance";
  power_kw: number;
  connectors: number;
  price_per_kwh: number;
  model: string;
  last_heartbeat: string;
}

export const demoStations: DemoStation[] = [
  // ========== BISHKEK (20 stations) ==========
  {
    id: "st-001",
    serial_number: "RP-BSH-001",
    name: "ТЦ Бишкек Парк",
    address: "ул. Киевская 148",
    city: "Бишкек",
    latitude: 42.8746,
    longitude: 74.5878,
    status: "online",
    power_kw: 60,
    connectors: 2,
    price_per_kwh: 12,
    model: "ABB Terra 54",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-002",
    serial_number: "RP-BSH-002",
    name: "ТЦ Дордой Плаза",
    address: "пр. Чуй 155",
    city: "Бишкек",
    latitude: 42.8781,
    longitude: 74.5987,
    status: "charging",
    power_kw: 120,
    connectors: 2,
    price_per_kwh: 15,
    model: "ABB Terra 124",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-003",
    serial_number: "RP-BSH-003",
    name: "Аэропорт Манас",
    address: "Аэропорт Манас, Парковка P1",
    city: "Бишкек",
    latitude: 43.0553,
    longitude: 74.4689,
    status: "online",
    power_kw: 150,
    connectors: 4,
    price_per_kwh: 14,
    model: "Tritium RTM 150",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-004",
    serial_number: "RP-BSH-004",
    name: "АЗС Red Petroleum #12",
    address: "ул. Ахунбаева 98",
    city: "Бишкек",
    latitude: 42.8534,
    longitude: 74.6012,
    status: "online",
    power_kw: 60,
    connectors: 2,
    price_per_kwh: 10,
    model: "ABB Terra 54",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-005",
    serial_number: "RP-BSH-005",
    name: "ТЦ Asia Mall",
    address: "пр. Жибек Жолу 504",
    city: "Бишкек",
    latitude: 42.8828,
    longitude: 74.6233,
    status: "offline",
    power_kw: 60,
    connectors: 2,
    price_per_kwh: 11,
    model: "ABB Terra 54",
    last_heartbeat: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "st-006",
    serial_number: "RP-BSH-006",
    name: "Бизнес-центр Орион",
    address: "ул. Токтогула 245",
    city: "Бишкек",
    latitude: 42.8722,
    longitude: 74.6045,
    status: "online",
    power_kw: 22,
    connectors: 2,
    price_per_kwh: 8,
    model: "Schneider EVlink",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-007",
    serial_number: "RP-BSH-007",
    name: "Парк Ата-Тюрк",
    address: "ул. Абдрахманова / Московская",
    city: "Бишкек",
    latitude: 42.8714,
    longitude: 74.5938,
    status: "maintenance",
    power_kw: 60,
    connectors: 2,
    price_per_kwh: 12,
    model: "ABB Terra 54",
    last_heartbeat: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "st-008",
    serial_number: "RP-BSH-008",
    name: "АЗС Red Petroleum #7",
    address: "ул. Байтик Баатыра 2",
    city: "Бишкек",
    latitude: 42.8488,
    longitude: 74.5855,
    status: "online",
    power_kw: 120,
    connectors: 2,
    price_per_kwh: 13,
    model: "ABB Terra 124",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-009",
    serial_number: "RP-BSH-009",
    name: "ХОП Моспрем",
    address: "ул. Боконбаева 200",
    city: "Бишкек",
    latitude: 42.8612,
    longitude: 74.5945,
    status: "online",
    power_kw: 90,
    connectors: 3,
    price_per_kwh: 12,
    model: "ABB Terra 90",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-010",
    serial_number: "RP-BSH-010",
    name: "Гостиница Issyk-Kul",
    address: "пр. Манаса 112",
    city: "Бишкек",
    latitude: 42.8845,
    longitude: 74.5678,
    status: "online",
    power_kw: 60,
    connectors: 2,
    price_per_kwh: 14,
    model: "ABB Terra 54",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-011",
    serial_number: "RP-BSH-011",
    name: "ТЦ Берег озера",
    address: "ул. Панфилова 456",
    city: "Бишкек",
    latitude: 42.8634,
    longitude: 74.6178,
    status: "charging",
    power_kw: 120,
    connectors: 2,
    price_per_kwh: 13,
    model: "ABB Terra 124",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-012",
    serial_number: "RP-BSH-012",
    name: "Офис Red Petroleum",
    address: "ул. Логинова 89",
    city: "Бишкек",
    latitude: 42.8756,
    longitude: 74.5834,
    status: "online",
    power_kw: 45,
    connectors: 2,
    price_per_kwh: 9,
    model: "Schneider EVlink",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-013",
    serial_number: "RP-BSH-013",
    name: "Университет КРСУ",
    address: "ул. Боконбаева 247",
    city: "Бишкек",
    latitude: 42.8923,
    longitude: 74.6034,
    status: "online",
    power_kw: 60,
    connectors: 2,
    price_per_kwh: 10,
    model: "ABB Terra 54",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-014",
    serial_number: "RP-BSH-014",
    name: "ТЦ Максима",
    address: "ул. Чуй 298",
    city: "Бишкек",
    latitude: 42.8801,
    longitude: 74.5723,
    status: "offline",
    power_kw: 90,
    connectors: 3,
    price_per_kwh: 12,
    model: "ABB Terra 90",
    last_heartbeat: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "st-015",
    serial_number: "RP-BSH-015",
    name: "Рынок Орто Сай",
    address: "пр. Динамо 145",
    city: "Бишкек",
    latitude: 42.8567,
    longitude: 74.6289,
    status: "online",
    power_kw: 60,
    connectors: 2,
    price_per_kwh: 11,
    model: "ABB Terra 54",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-016",
    serial_number: "RP-BSH-016",
    name: "Супермаркет Глобус",
    address: "ул. Киевская 389",
    city: "Бишкек",
    latitude: 42.8689,
    longitude: 74.6156,
    status: "charging",
    power_kw: 120,
    connectors: 2,
    price_per_kwh: 13,
    model: "ABB Terra 124",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-017",
    serial_number: "RP-BSH-017",
    name: "Госпиталь имени Токтоматова",
    address: "ул. Абдрахманова 95",
    city: "Бишкек",
    latitude: 42.8445,
    longitude: 74.5789,
    status: "online",
    power_kw: 60,
    connectors: 2,
    price_per_kwh: 12,
    model: "ABB Terra 54",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-018",
    serial_number: "RP-BSH-018",
    name: "Парк 40 лет Победы",
    address: "ул. Ленина 234",
    city: "Бишкек",
    latitude: 42.8823,
    longitude: 74.5912,
    status: "online",
    power_kw: 90,
    connectors: 3,
    price_per_kwh: 11,
    model: "ABB Terra 90",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-019",
    serial_number: "RP-BSH-019",
    name: "АЗС Red Petroleum #5",
    address: "ул. Советская 567",
    city: "Бишкек",
    latitude: 42.8501,
    longitude: 74.6323,
    status: "maintenance",
    power_kw: 60,
    connectors: 2,
    price_per_kwh: 10,
    model: "ABB Terra 54",
    last_heartbeat: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "st-020",
    serial_number: "RP-BSH-020",
    name: "Банк ЦАБ",
    address: "ул. Киевская 567",
    city: "Бишкек",
    latitude: 42.8712,
    longitude: 74.5923,
    status: "online",
    power_kw: 45,
    connectors: 2,
    price_per_kwh: 9,
    model: "Schneider EVlink",
    last_heartbeat: new Date().toISOString(),
  },

  // ========== OSH (8 stations) ==========
  {
    id: "st-021",
    serial_number: "RP-OSH-001",
    name: "ТЦ Ош Плаза",
    address: "ул. Ленина 142",
    city: "Ош",
    latitude: 42.4846,
    longitude: 72.7972,
    status: "online",
    power_kw: 120,
    connectors: 2,
    price_per_kwh: 16,
    model: "ABB Terra 124",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-022",
    serial_number: "RP-OSH-002",
    name: "АЗС Red Petroleum Ош",
    address: "ул. Абдулалиева 89",
    city: "Ош",
    latitude: 42.4923,
    longitude: 72.8045,
    status: "online",
    power_kw: 60,
    connectors: 2,
    price_per_kwh: 14,
    model: "ABB Terra 54",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-023",
    serial_number: "RP-OSH-003",
    name: "Отель Сапат",
    address: "пр. Масалиева 201",
    city: "Ош",
    latitude: 42.4734,
    longitude: 72.7834,
    status: "charging",
    power_kw: 90,
    connectors: 2,
    price_per_kwh: 15,
    model: "ABB Terra 90",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-024",
    serial_number: "RP-OSH-004",
    name: "Рынок Царь Базара",
    address: "ул. Абдыкадырова 156",
    city: "Ош",
    latitude: 42.5012,
    longitude: 72.7901,
    status: "online",
    power_kw: 60,
    connectors: 2,
    price_per_kwh: 13,
    model: "ABB Terra 54",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-025",
    serial_number: "RP-OSH-005",
    name: "Университет ОшГУ",
    address: "ул. Ленина 331",
    city: "Ош",
    latitude: 42.4567,
    longitude: 72.8123,
    status: "offline",
    power_kw: 60,
    connectors: 2,
    price_per_kwh: 12,
    model: "ABB Terra 54",
    last_heartbeat: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    id: "st-026",
    serial_number: "RP-OSH-006",
    name: "Гостиница Регистан",
    address: "ул. Айни 412",
    city: "Ош",
    latitude: 42.4689,
    longitude: 72.7756,
    status: "online",
    power_kw: 90,
    connectors: 2,
    price_per_kwh: 15,
    model: "ABB Terra 90",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-027",
    serial_number: "RP-OSH-007",
    name: "Супермаркет Ойнак",
    address: "ул. Чуй 345",
    city: "Ош",
    latitude: 42.4823,
    longitude: 72.8034,
    status: "online",
    power_kw: 60,
    connectors: 2,
    price_per_kwh: 14,
    model: "ABB Terra 54",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-028",
    serial_number: "RP-OSH-008",
    name: "Автовокзал Ош",
    address: "ул. Махамбета 567",
    city: "Ош",
    latitude: 42.4901,
    longitude: 72.7823,
    status: "maintenance",
    power_kw: 120,
    connectors: 2,
    price_per_kwh: 16,
    model: "ABB Terra 124",
    last_heartbeat: new Date(Date.now() - 14400000).toISOString(),
  },

  // ========== NARYN (7 stations) ==========
  {
    id: "st-029",
    serial_number: "RP-NAR-001",
    name: "Гостиница Нарын Тур",
    address: "ул. Ленина 234",
    city: "Нарын",
    latitude: 41.4306,
    longitude: 75.9789,
    status: "online",
    power_kw: 60,
    connectors: 2,
    price_per_kwh: 13,
    model: "ABB Terra 54",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-030",
    serial_number: "RP-NAR-002",
    name: "АЗС Red Petroleum Нарын",
    address: "ул. Абдрахманова 123",
    city: "Нарын",
    latitude: 41.4412,
    longitude: 75.9834,
    status: "online",
    power_kw: 60,
    connectors: 2,
    price_per_kwh: 12,
    model: "ABB Terra 54",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-031",
    serial_number: "RP-NAR-003",
    name: "Супермаркет Нарын",
    address: "пр. Революции 89",
    city: "Нарын",
    latitude: 41.4234,
    longitude: 75.9901,
    status: "charging",
    power_kw: 90,
    connectors: 2,
    price_per_kwh: 14,
    model: "ABB Terra 90",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-032",
    serial_number: "RP-NAR-004",
    name: "Рынок Нарын",
    address: "ул. Чуй 178",
    city: "Нарын",
    latitude: 41.4501,
    longitude: 75.9723,
    status: "online",
    power_kw: 45,
    connectors: 2,
    price_per_kwh: 11,
    model: "Schneider EVlink",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-033",
    serial_number: "RP-NAR-005",
    name: "Центр обслуживания",
    address: "ул. Советская 234",
    city: "Нарын",
    latitude: 41.4345,
    longitude: 75.9845,
    status: "offline",
    power_kw: 60,
    connectors: 2,
    price_per_kwh: 12,
    model: "ABB Terra 54",
    last_heartbeat: new Date(Date.now() - 9000000).toISOString(),
  },
  {
    id: "st-034",
    serial_number: "RP-NAR-006",
    name: "Университет Нарын",
    address: "ул. Ленина 445",
    city: "Нарын",
    latitude: 41.4567,
    longitude: 75.9678,
    status: "online",
    power_kw: 60,
    connectors: 2,
    price_per_kwh: 13,
    model: "ABB Terra 54",
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "st-035",
    serial_number: "RP-NAR-007",
    name: "Парк Нарын",
    address: "пр. Амана Кайынова 312",
    city: "Нарын",
    latitude: 41.4178,
    longitude: 75.9912,
    status: "maintenance",
    power_kw: 45,
    connectors: 2,
    price_per_kwh: 11,
    model: "Schneider EVlink",
    last_heartbeat: new Date(Date.now() - 172800000).toISOString(),
  },
];

// ========== Sessions ==========

export interface DemoSession {
  id: string;
  station_id: string;
  station_name: string;
  connector_id: number;
  status: "completed" | "in_progress" | "stopped";
  energy_kwh: number;
  amount: number;
  partner_share: number;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  user_phone: string;
}

function generateSessionsForToday(): DemoSession[] {
  const sessions: DemoSession[] = [];
  const phones = [
    "+996700111222",
    "+996555333444",
    "+996772555666",
    "+996550777888",
    "+996703999000",
    "+996559112233",
    "+996771445566",
    "+996550667788",
    "+996776234567",
    "+996312123456",
    "+996707654321",
    "+996556789012",
    "+996773456789",
    "+996505040506",
    "+996501234567",
  ];

  // Generate 34 sessions spread throughout today
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = 0; i < 34; i++) {
    // Spread sessions from 07:00 to 22:00
    const startHour = 7 + Math.floor((i / 34) * 15);
    const startMinute = Math.floor(Math.random() * 60);

    const station = demoStations[Math.floor(Math.random() * demoStations.length)]!;
    const energy = Math.round((5 + Math.random() * 45) * 10) / 10;
    const amount = Math.round(energy * station.price_per_kwh);
    const duration = Math.round(energy / (station.power_kw / 60));

    const started = new Date(todayStart);
    started.setHours(startHour, startMinute, 0, 0);
    const startedStr = started.toISOString();

    const endDate = new Date(started.getTime() + duration * 60000);
    const endedStr = endDate.toISOString();

    // First session is "in_progress", rest are "completed" or "stopped"
    const status: DemoSession["status"] = i === 0 ? "in_progress" : Math.random() > 0.92 ? "stopped" : "completed";

    sessions.push({
      id: `sess-${String(i + 1).padStart(3, "0")}`,
      station_id: station.id,
      station_name: station.name,
      connector_id: Math.random() > 0.5 ? 1 : 2,
      status,
      energy_kwh: energy,
      amount,
      partner_share: Math.round(amount * demoPartner.revenue_share),
      started_at: startedStr,
      ended_at: status === "in_progress" ? null : endedStr,
      duration_minutes: status === "in_progress" ? 0 : duration,
      user_phone: phones[Math.floor(Math.random() * phones.length)]!,
    });
  }

  return sessions.sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
  );
}

export const demoSessions = generateSessionsForToday();

// ========== Calculate totals from actual sessions ==========

const todaySessions = demoSessions.filter(s => s.status !== "in_progress");
const todayTotalRevenue = todaySessions.reduce((sum, s) => sum + s.amount, 0);
const todayTotalEnergy = demoSessions.reduce((sum, s) => sum + s.energy_kwh, 0);
const activeSessions = demoSessions.filter(s => s.status === "in_progress").length;
const onlineStations = demoStations.filter(s => s.status === "online" || s.status === "charging").length;
const totalSessions = 2847;

// ========== Dashboard KPIs ==========

export interface DemoDashboard {
  stations_total: number;
  stations_online: number;
  stations_charging: number;
  stations_offline: number;
  sessions_today: number;
  sessions_month: number;
  revenue_today: number;
  revenue_week: number;
  revenue_month: number;
  revenue_total: number;
  energy_today_kwh: number;
  energy_month_kwh: number;
  partner_share_percent: number;
  partner_revenue_month: number;
}

export const demoDashboard: DemoDashboard = {
  stations_total: demoStations.length, // 35
  stations_online: demoStations.filter((s) => s.status === "online").length, // 24
  stations_charging: demoStations.filter((s) => s.status === "charging").length, // 4
  stations_offline: demoStations.filter((s) => s.status === "offline" || s.status === "maintenance").length, // 7
  sessions_today: demoSessions.length, // 34
  sessions_month: 1024,
  revenue_today: todayTotalRevenue,
  revenue_week: todayTotalRevenue * 7,
  revenue_month: todayTotalRevenue * 30,
  revenue_total: 3850000,
  energy_today_kwh: Math.round(todayTotalEnergy * 10) / 10,
  energy_month_kwh: Math.round(todayTotalEnergy * 30 * 10) / 10,
  partner_share_percent: 80,
  partner_revenue_month: Math.round(todayTotalRevenue * 30 * 0.8),
};

// ========== Revenue breakdown ==========

export interface DemoRevenueItem {
  date: string;
  revenue: number;
  energy_kwh: number;
  sessions: number;
  partner_share: number;
}

export function generateRevenueData(
  period: "today" | "week" | "month",
): DemoRevenueItem[] {
  const items: DemoRevenueItem[] = [];
  const now = new Date();
  const baseRevenue = demoDashboard.revenue_today;

  if (period === "today") {
    for (let h = 7; h <= now.getHours(); h++) {
      const sessionCount = Math.floor(demoSessions.length / 16);
      const rev = Math.round((baseRevenue / 16) + Math.random() * 200);
      items.push({
        date: `${String(h).padStart(2, "0")}:00`,
        revenue: rev,
        energy_kwh: Math.round(rev / 12.5),
        sessions: sessionCount,
        partner_share: Math.round(rev * 0.8),
      });
    }
  } else if (period === "week") {
    for (let d = 6; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      const rev = Math.round(baseRevenue * 7 * (0.9 + Math.random() * 0.2));
      items.push({
        date: date.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric" }),
        revenue: rev,
        energy_kwh: Math.round(rev / 12.5),
        sessions: demoSessions.length,
        partner_share: Math.round(rev * 0.8),
      });
    }
  } else {
    for (let d = 29; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      const rev = Math.round(baseRevenue * (0.8 + Math.random() * 0.4));
      items.push({
        date: date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
        revenue: rev,
        energy_kwh: Math.round(rev / 12.5),
        sessions: Math.floor(demoSessions.length * (0.7 + Math.random() * 0.6)),
        partner_share: Math.round(rev * 0.8),
      });
    }
  }

  return items;
}

// ========== Locations for Map ==========

/**
 * Конвертирует demoStations в формат Location[] для карты
 * Каждая станция — отдельная локация
 */
export function getDemoLocations(): Location[] {
  return demoStations.map((ds): Location => {
    const statusMap: Record<DemoStation["status"], string> = {
      online: "available",
      charging: "occupied",
      offline: "offline",
      maintenance: "maintenance",
    };
    const stationStatusMap: Record<DemoStation["status"], string> = {
      online: "active",
      charging: "active",
      offline: "offline",
      maintenance: "maintenance",
    };

    const isAvailable = ds.status === "online";
    const isCharging = ds.status === "charging";

    return {
      id: ds.id,
      name: ds.name,
      address: ds.address,
      city: ds.city,
      country: "KG",
      coordinates: {
        latitude: ds.latitude,
        longitude: ds.longitude,
      },
      latitude: ds.latitude,
      longitude: ds.longitude,
      status: statusMap[ds.status],
      stations_summary: {
        total: 1,
        available: isAvailable ? 1 : 0,
        occupied: isCharging ? 1 : 0,
        offline: ds.status === "offline" ? 1 : 0,
        maintenance: ds.status === "maintenance" ? 1 : 0,
      },
      connectors_summary: {
        total: ds.connectors,
        available: isAvailable ? ds.connectors : isCharging ? ds.connectors - 1 : 0,
        occupied: isCharging ? 1 : 0,
        faulted: 0,
      },
      stations_count: 1,
      connectors_count: ds.connectors,
      available_connectors: isAvailable ? ds.connectors : isCharging ? ds.connectors - 1 : 0,
      stations: [
        {
          id: ds.id,
          serial_number: ds.serial_number,
          model: ds.model,
          manufacturer: ds.model.split(" ")[0] || "ABB",
          status: stationStatusMap[ds.status],
          power_capacity: ds.power_kw,
          connectors_count: ds.connectors,
          tariff: {
            price_per_kwh: ds.price_per_kwh,
            session_fee: 0,
            currency: "KGS",
          },
          connectors_summary: {
            available: isAvailable ? ds.connectors : isCharging ? ds.connectors - 1 : 0,
            occupied: isCharging ? 1 : 0,
            faulted: 0,
          },
          price_per_kwh: ds.price_per_kwh,
        },
      ],
    };
  });
}

/**
 * Возвращает демо StationStatusResponse по serial_number или id
 */
export function getDemoStationStatus(stationId: string): StationStatusResponse | null {
  const ds = demoStations.find(
    (s) => s.serial_number === stationId || s.id === stationId,
  );
  if (!ds) return null;

  const isAvailable = ds.status === "online";
  const isCharging = ds.status === "charging";

  const connectors: StationStatusResponse["connectors"] = [];
  for (let i = 1; i <= ds.connectors; i++) {
    const occupied = isCharging && i === 1;
    connectors.push({
      id: i,
      type: ds.power_kw >= 50 ? "CCS2" : "Type 2",
      status: occupied ? "Charging" : isAvailable ? "Available" : "Unavailable",
      available: isAvailable && !occupied,
      power_kw: ds.power_kw,
    });
  }

  return {
    success: true,
    station_id: ds.id,
    serial_number: ds.serial_number,
    model: ds.model,
    manufacturer: ds.model.split(" ")[0] || "ABB",
    online: ds.status !== "offline",
    station_status: ds.status === "online" ? "active" : ds.status,
    location_status: isAvailable ? "available" : isCharging ? "occupied" : "offline",
    available_for_charging: isAvailable || isCharging,
    location_id: ds.id,
    location_name: ds.name,
    location_address: ds.address,
    connectors,
    total_connectors: ds.connectors,
    available_connectors: isAvailable ? ds.connectors : isCharging ? ds.connectors - 1 : 0,
    occupied_connectors: isCharging ? 1 : 0,
    faulted_connectors: 0,
    tariff_rub_kwh: ds.price_per_kwh,
    session_fee: 0,
    currency: "KGS",
    working_hours: "24/7",
  };
}

// ========== Admin Sessions (for Owner Dashboard & Sessions Page) ==========

// Admin API sessions (for useAdminSessions hook) - generated from demoSessions
export const demoAdminSessions = demoSessions.slice(0, 34).map((session, index) => ({
  id: session.id,
  station_id: session.station_id,
  user_id: `client-${String((index % 5) + 1).padStart(3, "0")}`,
  status: session.status as "active" | "completed" | "stopped",
  energy_kwh: session.energy_kwh,
  cost: session.amount,
  started_at: session.started_at,
  ended_at: session.ended_at,
  duration_minutes: session.duration_minutes || null,
  station_name: session.station_name,
  user_phone: session.user_phone,
}));

// Owner Dashboard sessions (different schema)
export const demoOwnerSessions = demoSessions.slice(0, 34).map((session) => ({
  id: session.id,
  client_phone: session.user_phone,
  station_id: session.station_id,
  station_model: demoStations.find(s => s.id === session.station_id)?.model || "Unknown",
  location_name: session.station_name,
  status: session.status as "active" | "completed" | "stopped",
  energy_kwh: session.energy_kwh,
  amount: session.amount,
  start_time: session.started_at,
  stop_time: session.ended_at,
  duration_minutes: session.duration_minutes || null,
}));

// ========== Push Notifications ==========

export interface DemoPushNotification {
  id: string;
  type: "chargingStart" | "chargingComplete" | "chargingError" | "lowBalance" | "chargingLimits" | "paymentAlert";
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export const demoPushNotifications = {
  settings: {
    enabled: true,
    chargingStart: true,
    chargingComplete: true,
    chargingError: true,
    lowBalance: true,
    chargingLimits: true,
    paymentAlert: true,
    deliveryTiming: "quiet-hours" as const,
    quietHoursFrom: "22:00",
    quietHoursTo: "08:00",
    frequency: "high" as const,
    groupingSimilar: false,
  },
  history: [
    {
      id: "notif-001",
      type: "chargingComplete" as const,
      title: "Зарядка завершена",
      body: `Ваша зарядка на станции ${demoSessions[1]?.station_name || "ТЦ Бишкек Парк"} завершена. Энергия: ${demoSessions[1]?.energy_kwh || 22.5} кВт⋅ч`,
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      read: true,
    },
    {
      id: "notif-002",
      type: "chargingLimits" as const,
      title: "Приближение к лимиту",
      body: "Вы приблизились к установленному лимиту зарядки (95%)",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: true,
    },
    {
      id: "notif-003",
      type: "paymentAlert" as const,
      title: "Платёж обработан",
      body: `Ваш платёж на сумму ${demoSessions[2]?.amount || 270} сом принят. Статус: успешно`,
      timestamp: new Date(Date.now() - 5400000).toISOString(),
      read: true,
    },
    {
      id: "notif-004",
      type: "lowBalance" as const,
      title: "Низкий баланс",
      body: "Ваш баланс составляет 45 сом. Пополните счёт",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: false,
    },
    {
      id: "notif-005",
      type: "chargingStart" as const,
      title: "Зарядка начата",
      body: `Зарядка на станции ${demoSessions[0]?.station_name || "Аэропорт Манас"} успешно начата`,
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      read: false,
    },
  ] as DemoPushNotification[],
};

// ========== Partner Detail ==========

export interface DemoPartnerStation {
  id: string;
  serial_number: string;
  model: string;
  location: string;
  status: "active" | "inactive" | "maintenance";
  power_capacity: number;
  total_revenue: number;
  last_heartbeat: string;
}

export interface DemoRevenueByDay {
  date: string;
  revenue: number;
}

export interface DemoPartnerDetail {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  billing_type: "prepaid" | "postpaid";
  balance: number;
  revenue_share: number;
  kpi: {
    total_stations: number;
    active_sessions: number;
    today_revenue: number;
    month_revenue: number;
  };
  stations: DemoPartnerStation[];
  revenue_by_day: DemoRevenueByDay[];
}

export const demoPartnerDetail: DemoPartnerDetail = {
  id: "partner-001",
  company_name: "АО Бишкек Электро",
  contact_name: "Алмаз Токтоналиев",
  phone: "+996555123456",
  email: "almaz@bishkek-electro.kg",
  billing_type: "prepaid",
  balance: 450000,
  revenue_share: 0.8,
  kpi: {
    total_stations: 12,
    active_sessions: activeSessions,
    today_revenue: Math.round(todayTotalRevenue * 0.8),
    month_revenue: Math.round(todayTotalRevenue * 30 * 0.8),
  },
  stations: [
    {
      id: "st-001",
      serial_number: "RP-BSH-001",
      model: "ABB Terra 54",
      location: "ТЦ Бишкек Парк",
      status: "active",
      power_capacity: 60,
      total_revenue: Math.round(todayTotalRevenue * 0.2),
      last_heartbeat: new Date().toISOString(),
    },
    {
      id: "st-002",
      serial_number: "RP-BSH-002",
      model: "ABB Terra 124",
      location: "ТЦ Дордой Плаза",
      status: "active",
      power_capacity: 120,
      total_revenue: Math.round(todayTotalRevenue * 0.3),
      last_heartbeat: new Date().toISOString(),
    },
    {
      id: "st-003",
      serial_number: "RP-BSH-003",
      model: "Tritium RTM 150",
      location: "Аэропорт Манас",
      status: "active",
      power_capacity: 150,
      total_revenue: Math.round(todayTotalRevenue * 0.25),
      last_heartbeat: new Date().toISOString(),
    },
  ],
  revenue_by_day: Array.from({ length: 28 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - i));
    const dateStr = date.toISOString().split("T")[0] || "";
    return {
      date: dateStr,
      revenue: Math.round(todayTotalRevenue * (0.7 + Math.random() * 0.6)),
    };
  }),
};

// ========== Partner Filtered Data (АО Бишкек Электро) ==========
// Partner sees only their 12 stations (not all 35!) and their sessions only

export const DEMO_PARTNER_STATIONS = demoStations.filter(
  (s) =>
    // Bishkek: st-001 to st-005 (5 stations)
    (s.id >= "st-001" && s.id <= "st-005") ||
    // Osh: st-021 to st-024 (4 stations)
    (s.id >= "st-021" && s.id <= "st-024") ||
    // Naryn: st-029 to st-031 (3 stations)
    (s.id >= "st-029" && s.id <= "st-031")
);

export const DEMO_PARTNER_SESSIONS = demoSessions.filter((session) =>
  DEMO_PARTNER_STATIONS.some((station) => station.id === session.station_id)
);

// ========== Regional Operator Bishkek — 20 Stations & 15 Locations ==========

export const DEMO_BISHKEK_STATIONS = demoStations.filter(s => s.city === "Бишкек");

export const DEMO_STATION_TO_LOCATION: Record<string, string> = {
  "st-001":"loc-bsh-001","st-002":"loc-bsh-002","st-003":"loc-bsh-003",
  "st-004":"loc-bsh-004","st-005":"loc-bsh-005","st-006":"loc-bsh-006",
  "st-007":"loc-bsh-007","st-008":"loc-bsh-008","st-009":"loc-bsh-009",
  "st-010":"loc-bsh-010",
  "st-011":"loc-bsh-011","st-012":"loc-bsh-011",
  "st-013":"loc-bsh-012","st-014":"loc-bsh-012",
  "st-015":"loc-bsh-013","st-016":"loc-bsh-013",
  "st-017":"loc-bsh-014","st-018":"loc-bsh-014",
  "st-019":"loc-bsh-015","st-020":"loc-bsh-015",
};

export const DEMO_BISHKEK_LOCATIONS: OwnerLocation[] = [
  {id:"loc-bsh-001",name:"ТЦ Бишкек Парк",        address:"ул. Киевская 148",              city:"Бишкек",latitude:42.8746,longitude:74.5878,user_id:"demo-regional-operator-bishkek-001",admin_id:"",status:"active",      stations_count:1,created_at:"2025-09-01T00:00:00Z",updated_at:new Date().toISOString()},
  {id:"loc-bsh-002",name:"ТЦ Дордой Плаза",        address:"пр. Чуй 155",                   city:"Бишкек",latitude:42.8781,longitude:74.5987,user_id:"demo-regional-operator-bishkek-001",admin_id:"",status:"active",      stations_count:1,created_at:"2025-09-01T00:00:00Z",updated_at:new Date().toISOString()},
  {id:"loc-bsh-003",name:"Аэропорт Манас",          address:"Аэропорт Манас, Парковка P1",    city:"Бишкек",latitude:43.0553,longitude:74.4689,user_id:"demo-regional-operator-bishkek-001",admin_id:"",status:"active",      stations_count:1,created_at:"2025-09-01T00:00:00Z",updated_at:new Date().toISOString()},
  {id:"loc-bsh-004",name:"АЗС Red Petroleum #12",   address:"ул. Ахунбаева 98",               city:"Бишкек",latitude:42.8534,longitude:74.6012,user_id:"demo-regional-operator-bishkek-001",admin_id:"",status:"active",      stations_count:1,created_at:"2025-09-01T00:00:00Z",updated_at:new Date().toISOString()},
  {id:"loc-bsh-005",name:"ТЦ Asia Mall",             address:"пр. Жибек Жолу 504",             city:"Бишкек",latitude:42.8828,longitude:74.6233,user_id:"demo-regional-operator-bishkek-001",admin_id:"",status:"inactive",    stations_count:1,created_at:"2025-09-01T00:00:00Z",updated_at:new Date().toISOString()},
  {id:"loc-bsh-006",name:"Бизнес-центр Орион",       address:"ул. Токтогула 245",              city:"Бишкек",latitude:42.8722,longitude:74.6045,user_id:"demo-regional-operator-bishkek-001",admin_id:"",status:"active",      stations_count:1,created_at:"2025-09-01T00:00:00Z",updated_at:new Date().toISOString()},
  {id:"loc-bsh-007",name:"Парк Ата-Тюрк",            address:"ул. Абдрахманова / Московская",  city:"Бишкек",latitude:42.8714,longitude:74.5938,user_id:"demo-regional-operator-bishkek-001",admin_id:"",status:"maintenance", stations_count:1,created_at:"2025-09-01T00:00:00Z",updated_at:new Date().toISOString()},
  {id:"loc-bsh-008",name:"АЗС Red Petroleum #7",     address:"ул. Байтик Баатыра 2",           city:"Бишкек",latitude:42.8488,longitude:74.5855,user_id:"demo-regional-operator-bishkek-001",admin_id:"",status:"active",      stations_count:1,created_at:"2025-09-01T00:00:00Z",updated_at:new Date().toISOString()},
  {id:"loc-bsh-009",name:"ХОП Моспрем",              address:"ул. Боконбаева 200",              city:"Бишкек",latitude:42.8612,longitude:74.5945,user_id:"demo-regional-operator-bishkek-001",admin_id:"",status:"active",      stations_count:1,created_at:"2025-09-01T00:00:00Z",updated_at:new Date().toISOString()},
  {id:"loc-bsh-010",name:"Гостиница Issyk-Kul",      address:"пр. Манаса 112",                 city:"Бишкек",latitude:42.8845,longitude:74.5678,user_id:"demo-regional-operator-bishkek-001",admin_id:"",status:"active",      stations_count:1,created_at:"2025-09-01T00:00:00Z",updated_at:new Date().toISOString()},
  {id:"loc-bsh-011",name:"ТЦ Берег озера / Офис RP", address:"ул. Панфилова 456",              city:"Бишкек",latitude:42.8634,longitude:74.6178,user_id:"demo-regional-operator-bishkek-001",admin_id:"",status:"active",      stations_count:2,created_at:"2025-09-01T00:00:00Z",updated_at:new Date().toISOString()},
  {id:"loc-bsh-012",name:"КРСУ / ТЦ Максима",        address:"ул. Боконбаева 247",              city:"Бишкек",latitude:42.8923,longitude:74.6034,user_id:"demo-regional-operator-bishkek-001",admin_id:"",status:"active",      stations_count:2,created_at:"2025-09-01T00:00:00Z",updated_at:new Date().toISOString()},
  {id:"loc-bsh-013",name:"Рынок Орто Сай / Глобус",  address:"пр. Динамо 145",                 city:"Бишкек",latitude:42.8567,longitude:74.6289,user_id:"demo-regional-operator-bishkek-001",admin_id:"",status:"active",      stations_count:2,created_at:"2025-09-01T00:00:00Z",updated_at:new Date().toISOString()},
  {id:"loc-bsh-014",name:"Госпиталь / Парк Победы",  address:"ул. Абдрахманова 95",            city:"Бишкек",latitude:42.8445,longitude:74.5789,user_id:"demo-regional-operator-bishkek-001",admin_id:"",status:"active",      stations_count:2,created_at:"2025-09-01T00:00:00Z",updated_at:new Date().toISOString()},
  {id:"loc-bsh-015",name:"АЗС RP #5 / Банк ЦАБ",    address:"ул. Советская 567",              city:"Бишкек",latitude:42.8501,longitude:74.6323,user_id:"demo-regional-operator-bishkek-001",admin_id:"",status:"maintenance", stations_count:2,created_at:"2025-09-01T00:00:00Z",updated_at:new Date().toISOString()},
];

export const demoPartnerDashboard: DemoDashboard = {
  stations_total:    DEMO_PARTNER_STATIONS.length,
  stations_online:   DEMO_PARTNER_STATIONS.filter(s => s.status === "online").length,
  stations_charging: DEMO_PARTNER_STATIONS.filter(s => s.status === "charging").length,
  stations_offline:  DEMO_PARTNER_STATIONS.filter(s => s.status === "offline" || s.status === "maintenance").length,
  sessions_today:    DEMO_PARTNER_SESSIONS.length,
  sessions_month:    Math.round(DEMO_PARTNER_SESSIONS.length * 30),
  revenue_today:     Math.round(DEMO_PARTNER_SESSIONS.reduce((s, x) => s + x.amount, 0)),
  revenue_week:      Math.round(DEMO_PARTNER_SESSIONS.reduce((s, x) => s + x.amount, 0) * 7),
  revenue_month:     Math.round(DEMO_PARTNER_SESSIONS.reduce((s, x) => s + x.amount, 0) * 30),
  revenue_total:     Math.round(3850000 * 0.343 * 0.8),
  energy_today_kwh:  Math.round(DEMO_PARTNER_SESSIONS.reduce((s, x) => s + x.energy_kwh, 0) * 10) / 10,
  energy_month_kwh:  Math.round(DEMO_PARTNER_SESSIONS.reduce((s, x) => s + x.energy_kwh, 0) * 30 * 10) / 10,
  partner_share_percent: 80,
  partner_revenue_month: Math.round(DEMO_PARTNER_SESSIONS.reduce((s, x) => s + x.amount, 0) * 30 * 0.8),
};

// ========== Owner Dashboard Stats ==========

export interface OwnerStats {
  totalStations: number;
  activeStations: number;
  activeSessions: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  monthlyEnergy: number;
  totalRevenue: number;
  totalEnergy: number;
  totalLocations: number;
  totalClients: number;
  totalPartners: number;
}

export const demoOwnerStats: OwnerStats = {
  totalStations: demoStations.length, // 35
  activeStations: onlineStations, // actual count
  activeSessions: activeSessions,
  todayRevenue: todayTotalRevenue,
  weeklyRevenue: Math.round(todayTotalRevenue * 7),
  monthlyRevenue: Math.round(todayTotalRevenue * 30),
  monthlyEnergy: Math.round(todayTotalEnergy * 30),
  totalRevenue: 3850000,
  totalEnergy: 285600,
  totalLocations: 20,
  totalClients: 1247,
  totalPartners: 12,
};

// ========== Owner Locations ==========

export interface OwnerLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  user_id: string;
  admin_id: string;
  status: "active" | "maintenance" | "inactive";
  stations_count: number;
  created_at: string;
  updated_at: string;
}

export const demoOwnerLocations: OwnerLocation[] = [
  {
    id: "loc-001",
    name: "ТЦ Бишкек Парк",
    address: "ул. Киевская 148",
    city: "Бишкек",
    latitude: 42.8746,
    longitude: 74.5878,
    user_id: "demo-owner-001",
    admin_id: "",
    status: "active",
    stations_count: 2,
    created_at: "2025-09-01T00:00:00Z",
    updated_at: new Date().toISOString(),
  },
  {
    id: "loc-002",
    name: "ТЦ Дордой Плаза",
    address: "пр. Чуй 155",
    city: "Бишкек",
    latitude: 42.8781,
    longitude: 74.5987,
    user_id: "demo-owner-001",
    admin_id: "",
    status: "active",
    stations_count: 1,
    created_at: "2025-09-01T00:00:00Z",
    updated_at: new Date().toISOString(),
  },
  {
    id: "loc-003",
    name: "Аэропорт Манас",
    address: "Аэропорт Манас, Парковка P1",
    city: "Бишкек",
    latitude: 43.0553,
    longitude: 74.4689,
    user_id: "demo-owner-001",
    admin_id: "",
    status: "active",
    stations_count: 2,
    created_at: "2025-09-01T00:00:00Z",
    updated_at: new Date().toISOString(),
  },
  {
    id: "loc-004",
    name: "АЗС Red Petroleum",
    address: "ул. Ахунбаева 98",
    city: "Бишкек",
    latitude: 42.8534,
    longitude: 74.6012,
    user_id: "demo-owner-001",
    admin_id: "",
    status: "maintenance",
    stations_count: 3,
    created_at: "2025-09-01T00:00:00Z",
    updated_at: new Date().toISOString(),
  },
  {
    id: "loc-005",
    name: "БЦ Орион",
    address: "ул. Токтогула 245",
    city: "Бишкек",
    latitude: 42.8722,
    longitude: 74.6045,
    user_id: "demo-owner-001",
    admin_id: "",
    status: "active",
    stations_count: 1,
    created_at: "2025-09-01T00:00:00Z",
    updated_at: new Date().toISOString(),
  },
];

// ========== Admin Tariff Plans ==========

export interface TariffPlan {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
  is_active: boolean;
  rules_count: number;
  stations_count: number;
  created_at: string;
  updated_at: string;
}

export const demoAdminTariffs: TariffPlan[] = [
  {
    id: "tp-001",
    name: "Стандартный",
    description: "Базовый дневной тариф",
    is_default: true,
    is_active: true,
    rules_count: 1,
    stations_count: 20,
    created_at: "2025-09-01T00:00:00Z",
    updated_at: new Date().toISOString(),
  },
  {
    id: "tp-002",
    name: "Ночной (-20%)",
    description: "Скидка 22:00–06:00",
    is_default: false,
    is_active: true,
    rules_count: 2,
    stations_count: 15,
    created_at: "2025-09-01T00:00:00Z",
    updated_at: new Date().toISOString(),
  },
  {
    id: "tp-003",
    name: "Корпоративный",
    description: "Для корп. клиентов",
    is_default: false,
    is_active: true,
    rules_count: 1,
    stations_count: 8,
    created_at: "2025-09-01T00:00:00Z",
    updated_at: new Date().toISOString(),
  },
];

// ========== Admin Corporate Groups ==========

export interface CorporateGroup {
  id: string;
  company_name: string;
  billing_type: "prepaid" | "postpaid";
  balance: number;
  credit_limit: number;
  current_month_spent: number;
  employees_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  contact_phone: string;
  contact_email: string;
}

export const demoAdminCorporate: CorporateGroup[] = [
  {
    id: "cg-001",
    company_name: "ОАО Бишкек Транс",
    billing_type: "prepaid",
    balance: 45000,
    credit_limit: 0,
    current_month_spent: Math.round(todayTotalRevenue * 30 * 0.3),
    employees_count: 12,
    is_active: true,
    created_at: "2025-06-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    contact_phone: "+996 312 555 001",
    contact_email: "fleet@btrans.kg",
  },
  {
    id: "cg-002",
    company_name: "ООО Азия Карго",
    billing_type: "postpaid",
    balance: 0,
    credit_limit: 30000,
    current_month_spent: Math.round(todayTotalRevenue * 30 * 0.4),
    employees_count: 7,
    is_active: true,
    created_at: "2025-07-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    contact_phone: "+996 312 555 002",
    contact_email: "ev@asiacargo.kg",
  },
  {
    id: "cg-003",
    company_name: "ГП Авиация Кыргызстана",
    billing_type: "prepaid",
    balance: 120000,
    credit_limit: 0,
    current_month_spent: Math.round(todayTotalRevenue * 30 * 0.5),
    employees_count: 25,
    is_active: true,
    created_at: "2025-08-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    contact_phone: "+996 312 555 003",
    contact_email: "transport@ka.kg",
  },
];

// ========== Admin Analytics Data ==========

export interface AdminAnalytics {
  period: "today" | "week" | "month";
  total_sessions: number;
  total_revenue: number;
  total_energy_kwh: number;
  average_session_duration: number;
  active_stations: number;
  total_stations: number;
  new_clients: number;
  return_clients: number;
  client_satisfaction: number;
  top_location: string;
  error_rate: number;
}

export const demoAdminAnalytics: AdminAnalytics = {
  period: "month",
  total_sessions: totalSessions,
  total_revenue: demoDashboard.revenue_month,
  total_energy_kwh: demoDashboard.energy_month_kwh,
  average_session_duration: 65,
  active_stations: onlineStations,
  total_stations: demoStations.length,
  new_clients: 42,
  return_clients: 1205,
  client_satisfaction: 4.6,
  top_location: "ТЦ Дордой Плаза",
  error_rate: 0.8,
};

// ========== ROLE-BASED DEMO DATA ==========

/**
 * SystemAdmin видит ВСЕ:
 * - 20 локаций (15 Бишкек, 3 Ош, 2 Нарын)
 * - 35 станций по всему Кыргызстану
 * - Полную аналитику всей системы
 */
export const demoSystemAdminStats = {
  totalStations: 35,
  activeStations: onlineStations,
  activeSessions: activeSessions,
  todayRevenue: todayTotalRevenue,
  weeklyRevenue: Math.round(todayTotalRevenue * 7),
  monthlyRevenue: Math.round(todayTotalRevenue * 30),
  monthlyEnergy: Math.round(todayTotalEnergy * 30),
  totalRevenue: 3850000,
  totalEnergy: 285600,
  totalLocations: 20,
  totalClients: 1247,
  totalPartners: 12,
  cityBreakdown: {
    Bishkek: {
      locations: 15,
      stations: 20,
      revenue: Math.round(todayTotalRevenue * 30 * 0.57) // ~57% of total
    },
    Osh: {
      locations: 3,
      stations: 8,
      revenue: Math.round(todayTotalRevenue * 30 * 0.22) // ~22% of total
    },
    Naryn: {
      locations: 2,
      stations: 7,
      revenue: Math.round(todayTotalRevenue * 30 * 0.21) // ~21% of total
    },
  },
};

/**
 * RegionalOperator (например, оператор Бишкека) видит:
 * - 15 локаций Бишкека
 * - 20 станций Бишкека
 * - Только свою аналитику (не другие города)
 */
const bishkekStations = demoStations.filter(s => s.city === "Бишкек");
const bishkekRevenue = Math.round(todayTotalRevenue * 30 * 0.57);
export const demoRegionalOperatorBishkekStats = {
  city: "Bishkek",
  totalStations: 20,
  activeStations: bishkekStations.filter(s => s.status === "online" || s.status === "charging").length,
  activeSessions: activeSessions,
  todayRevenue: Math.round(todayTotalRevenue * 0.57),
  weeklyRevenue: Math.round(todayTotalRevenue * 7 * 0.57),
  monthlyRevenue: bishkekRevenue,
  monthlyEnergy: Math.round(todayTotalEnergy * 30 * 0.57),
  totalRevenue: Math.round(3850000 * 0.57),
  totalEnergy: Math.round(285600 * 0.57),
  totalLocations: 15,
  totalClients: 782,
  totalPartners: 8,
};

/**
 * PartnerCompany (например, АО Бишкек Электро) видит:
 * - 8 локаций из разных городов (5 Бишкек, 2 Ош, 1 Нарын)
 * - 12 станций
 * - Только свои данные и свой доход
 */
export const demoPartnerCompanyStats = {
  companyName: "АО Бишкек Электро",
  totalStations: 12,
  activeStations: 11,
  activeSessions: activeSessions,
  todayRevenue: Math.round(todayTotalRevenue * 0.8),
  weeklyRevenue: Math.round(todayTotalRevenue * 7 * 0.8),
  monthlyRevenue: Math.round(todayTotalRevenue * 30 * 0.8),
  monthlyEnergy: Math.round(todayTotalEnergy * 30 * 0.8),
  totalRevenue: Math.round(3850000 * 0.8),
  totalEnergy: Math.round(285600 * 0.8),
  totalLocations: 8,
  locationsByCity: {
    Bishkek: 5,
    Osh: 2,
    Naryn: 1,
  },
  revenueShare: 0.8,
  platformShare: 0.2,
};

// ========== DEMO ANALYTICS ==========

export const DEMO_ANALYTICS_OVERVIEW = {
  total_stations: 35,
  total_sessions: totalSessions,
  total_revenue: Math.round(todayTotalRevenue * 30),
  total_energy_kwh: Math.round(todayTotalEnergy * 30),
  active_users: 1247,
  sessions_today: demoSessions.length,
  revenue_today: todayTotalRevenue,
  energy_today: Math.round(todayTotalEnergy),
};

export const DEMO_CHART_DATA = [
  { date: "2026-02-24", sessions: 28, revenue: Math.round(todayTotalRevenue * 0.8), energy: Math.round(todayTotalEnergy * 0.8) },
  { date: "2026-02-25", sessions: 31, revenue: Math.round(todayTotalRevenue * 0.95), energy: Math.round(todayTotalEnergy * 0.95) },
  { date: "2026-02-26", sessions: 26, revenue: Math.round(todayTotalRevenue * 0.75), energy: Math.round(todayTotalEnergy * 0.75) },
  { date: "2026-02-27", sessions: 35, revenue: Math.round(todayTotalRevenue * 1.1), energy: Math.round(todayTotalEnergy * 1.1) },
  { date: "2026-02-28", sessions: demoSessions.length, revenue: todayTotalRevenue, energy: Math.round(todayTotalEnergy) },
  { date: "2026-03-01", sessions: 32, revenue: Math.round(todayTotalRevenue * 0.95), energy: Math.round(todayTotalEnergy * 0.95) },
  { date: "2026-03-02", sessions: 38, revenue: Math.round(todayTotalRevenue * 1.15), energy: Math.round(todayTotalEnergy * 1.15) },
];

export const DEMO_HEATMAP_DATA = {
  days: 30,
  matrix: [
    [8, 12, 15, 18, 22, 25, 28, 32, 35, 38, 40, 42, 45, 43, 40],
    [38, 35, 32, 28, 25, 22, 18, 15, 12, 10, 8, 6, 5, 7, 10],
    [12, 15, 18, 22, 25, 28, 32, 35, 38, 40, 42, 45, 43, 40, 38],
    [35, 32, 28, 25, 22, 18, 15, 12, 10, 8, 6, 5, 7, 10, 12],
    [15, 18, 22, 25, 28, 32, 35, 38, 40, 42, 45, 43, 40, 38, 35],
    [32, 28, 25, 22, 18, 15, 12, 10, 8, 6, 5, 7, 10, 12, 15],
    [18, 22, 25, 28, 32, 35, 38, 40, 42, 45, 43, 40, 38, 35, 32],
  ],
  day_labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
};

export const DEMO_USER_GROWTH = [
  { period: "2026-02-10", new_users: 24, cumulative: 1223 },
  { period: "2026-02-17", new_users: 18, cumulative: 1241 },
  { period: "2026-02-24", new_users: 6, cumulative: 1247 },
];

export const DEMO_UPTIME_DATA = {
  days: 30,
  total_minutes: 43200,
  avg_uptime_pct: 98.5,
  stations: [
    { station_id: "RP-BSH-001", uptime_pct: 99.8, downtime_minutes: 8, incidents_count: 1 },
    { station_id: "RP-BSH-002", uptime_pct: 99.2, downtime_minutes: 55, incidents_count: 2 },
    { station_id: "RP-BSH-003", uptime_pct: 97.5, downtime_minutes: 108, incidents_count: 3 },
    { station_id: "RP-BSH-004", uptime_pct: 98.9, downtime_minutes: 47, incidents_count: 1 },
    { station_id: "RP-BSH-005", uptime_pct: 95.2, downtime_minutes: 209, incidents_count: 5 },
  ],
};

// ========== DEMO ALERTS ==========

export const DEMO_ALERTS = [
  {
    id: "alert-001",
    type: "station_offline",
    severity: "critical" as const,
    title: "Станция RP-BSH-007 офлайн",
    message: "Станция в Парке Ата-Тюрк не отвечает на запросы > 2 часов",
    station_id: "st-007",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    acknowledged: false,
  },
  {
    id: "alert-002",
    type: "low_balance",
    severity: "warning" as const,
    title: "Низкий баланс партнера",
    message: "АО Бишкек Электро: баланс < 5000 сом",
    station_id: null,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    acknowledged: true,
  },
  {
    id: "alert-003",
    type: "connector_fault",
    severity: "warning" as const,
    title: "Коннектор неисправен",
    message: "Коннектор #2 на RP-BSH-003 в Аэропорту не отвечает",
    station_id: "st-003",
    created_at: new Date(Date.now() - 14400000).toISOString(),
    acknowledged: false,
  },
  {
    id: "alert-004",
    type: "maintenance",
    severity: "info" as const,
    title: "Плановое обслуживание",
    message: "Плановое обслуживание станции RP-BSH-005 в 02:00",
    station_id: "st-005",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    acknowledged: false,
  },
];

// ========== DEMO CLIENTS ==========

export const DEMO_CLIENTS = [
  {
    id: "client-001",
    phone: "+996700111222",
    name: "Усуп Жоробекулов",
    email: null,
    balance: 12500,
    total_sessions: 45,
    total_energy_kwh: 450,
    created_at: "2025-01-15T00:00:00Z",
    last_session_at: new Date(Date.now() - 3600000).toISOString(),
    is_active: true,
  },
  {
    id: "client-002",
    phone: "+996555333444",
    name: "Акбар Касымалиев",
    email: null,
    balance: 8450,
    total_sessions: 128,
    total_energy_kwh: 1280,
    created_at: "2024-06-20T00:00:00Z",
    last_session_at: new Date(Date.now() - 1800000).toISOString(),
    is_active: true,
  },
  {
    id: "client-003",
    phone: "+996772555666",
    name: "Гулнур Турдубаева",
    email: null,
    balance: 3200,
    total_sessions: 89,
    total_energy_kwh: 890,
    created_at: "2024-09-10T00:00:00Z",
    last_session_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
  },
  {
    id: "client-004",
    phone: "+996550777888",
    name: "Берик Нурбаев",
    email: null,
    balance: 0,
    total_sessions: 12,
    total_energy_kwh: 120,
    created_at: "2025-02-01T00:00:00Z",
    last_session_at: new Date(Date.now() - 172800000).toISOString(),
    is_active: false,
  },
  {
    id: "client-005",
    phone: "+996703999000",
    name: "Айнур Сарыбаева",
    email: null,
    balance: 25600,
    total_sessions: 234,
    total_energy_kwh: 2340,
    created_at: "2024-03-05T00:00:00Z",
    last_session_at: new Date(Date.now() - 900000).toISOString(),
    is_active: true,
  },
];

// ========== DEMO PARTNERS ==========

export const DEMO_PARTNERS = [
  {
    id: "partner-001",
    name: "Алмаз Токтоналиев",
    email: "almaz@bishkek-electro.kg",
    phone: "+996555123456",
    company_name: "АО Бишкек Электро",
    station_count: 12,
    total_revenue: Math.round(3850000 * 0.8),
    commission_rate: 0.15,
    is_active: true,
    created_at: "2025-06-01T00:00:00Z",
  },
  {
    id: "partner-002",
    name: "Дастан Мусаев",
    email: "ev@asiacargo.kg",
    phone: "+996312555002",
    company_name: "ООО Азия Карго",
    station_count: 8,
    total_revenue: Math.round(3850000 * 0.12),
    commission_rate: 0.18,
    is_active: true,
    created_at: "2025-07-15T00:00:00Z",
  },
  {
    id: "partner-003",
    name: "Камчыбек Абдулов",
    email: "transport@ka.kg",
    phone: "+996312555003",
    company_name: "ГП Авиация Кыргызстана",
    station_count: 15,
    total_revenue: Math.round(3850000 * 0.08),
    commission_rate: 0.12,
    is_active: true,
    created_at: "2025-08-01T00:00:00Z",
  },
];

// ========== Admin Reserves (Bookings) ==========

const now = Date.now();
const h = 3600000;

export const demoReserves = [
  { id: "rsv-001", station_id: "stn-bsh-001", user_id: "client-001", connector_number: 1, start_time: new Date(now - 0.5 * h).toISOString(), end_time: new Date(now + 0.5 * h).toISOString(), status: "active",    created_at: new Date(now - 0.5 * h).toISOString(), station_name: "ТЦ Бишкек Парк — ABB Terra 54",        user_phone: "+996700111001" },
  { id: "rsv-002", station_id: "stn-bsh-003", user_id: "client-002", connector_number: 2, start_time: new Date(now - 0.2 * h).toISOString(), end_time: new Date(now + 0.8 * h).toISOString(), status: "active",    created_at: new Date(now - 0.2 * h).toISOString(), station_name: "Аэропорт Манас — Schneider EVlink",     user_phone: "+996555222002" },
  { id: "rsv-003", station_id: "stn-bsh-006", user_id: "client-003", connector_number: 1, start_time: new Date(now - 3 * h).toISOString(),   end_time: new Date(now - 2 * h).toISOString(),   status: "completed", created_at: new Date(now - 3 * h).toISOString(),   station_name: "Бизнес-центр Орион — Delta AC Mini",    user_phone: "+996770333003" },
  { id: "rsv-004", station_id: "stn-bsh-008", user_id: "client-004", connector_number: 1, start_time: new Date(now - 5 * h).toISOString(),   end_time: new Date(now - 4 * h).toISOString(),   status: "completed", created_at: new Date(now - 5 * h).toISOString(),   station_name: "АЗС Red Petroleum #7 — ABB Terra AC",   user_phone: "+996500444004" },
  { id: "rsv-005", station_id: "stn-bsh-011", user_id: "client-005", connector_number: 2, start_time: new Date(now - 2 * h).toISOString(),   end_time: new Date(now - 1 * h).toISOString(),   status: "cancelled", created_at: new Date(now - 2 * h).toISOString(),   station_name: "ТЦ Берег озера — Siemens VersiCharge",  user_phone: "+996700555005" },
  { id: "rsv-006", station_id: "stn-osh-001", user_id: "client-006", connector_number: 1, start_time: new Date(now - 8 * h).toISOString(),   end_time: new Date(now - 7 * h).toISOString(),   status: "expired",   created_at: new Date(now - 8 * h).toISOString(),   station_name: "ТЦ Ош Базар — ABB Terra 54",            user_phone: "+996555666006" },
  { id: "rsv-007", station_id: "stn-bsh-004", user_id: "client-007", connector_number: 1, start_time: new Date(now + 1 * h).toISOString(),   end_time: new Date(now + 2 * h).toISOString(),   status: "active",    created_at: new Date(now).toISOString(),              station_name: "АЗС Red Petroleum #12 — Delta DC Wallbox", user_phone: "+996770777007" },
  { id: "rsv-008", station_id: "stn-bsh-009", user_id: "client-001", connector_number: 1, start_time: new Date(now - 24 * h).toISOString(),  end_time: new Date(now - 23 * h).toISOString(),  status: "completed", created_at: new Date(now - 24 * h).toISOString(),  station_name: "ХОП Моспрем — Schneider EVlink",        user_phone: "+996700111001" },
  { id: "rsv-009", station_id: "stn-nrn-001", user_id: "client-008", connector_number: 1, start_time: new Date(now - 6 * h).toISOString(),   end_time: new Date(now - 5.5 * h).toISOString(), status: "cancelled", created_at: new Date(now - 6 * h).toISOString(),   station_name: "АЗС Нарын #1 — ABB Terra AC",           user_phone: "+996555888008" },
  { id: "rsv-010", station_id: "stn-bsh-012", user_id: "client-009", connector_number: 1, start_time: new Date(now - 10 * h).toISOString(),  end_time: new Date(now - 9 * h).toISOString(),   status: "completed", created_at: new Date(now - 10 * h).toISOString(),  station_name: "КРСУ / ТЦ Максима — Siemens VersiCharge", user_phone: "+996700999009" },
];
