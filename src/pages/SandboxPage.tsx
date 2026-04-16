/**
 * Sandbox Page — dev tools: навигация, демо-логин, тестовые станции
 * Доступна без авторизации по адресу /sandbox
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";
import { useDemoMode } from "@/shared/demo/useDemoMode";
import type { Owner } from "@/features/auth/types/auth.types";

// ========== Section: Quick Navigation ==========

interface NavGroup {
  title: string;
  links: { to: string; label: string; icon: string }[];
}

const navGroups: NavGroup[] = [
  {
    title: "Клиент",
    links: [
      { to: "/", label: "Карта", icon: "solar:map-linear" },
      { to: "/stations", label: "Список станций", icon: "solar:list-linear" },
      { to: "/charging", label: "Зарядка", icon: "solar:bolt-linear" },
      { to: "/charging/SIM-TEST", label: "Зарядка /SIM-TEST", icon: "solar:bolt-linear" },
      { to: "/charging-process/demo-session", label: "Процесс зарядки", icon: "solar:battery-charge-linear" },
      { to: "/charging-complete/demo-session", label: "Зарядка завершена", icon: "solar:check-circle-linear" },
      { to: "/qr-scanner", label: "QR Сканер", icon: "solar:qr-code-linear" },
      { to: "/history", label: "История", icon: "solar:history-linear" },
      { to: "/payments", label: "Платежи", icon: "solar:wallet-linear" },
      { to: "/profile", label: "Профиль", icon: "solar:user-linear" },
      { to: "/profile/edit", label: "Редактирование профиля", icon: "solar:pen-linear" },
      { to: "/settings", label: "Настройки", icon: "solar:settings-linear" },
      { to: "/settings/notifications", label: "Уведомления", icon: "solar:bell-linear" },
      { to: "/topup", label: "Пополнить", icon: "solar:card-linear" },
      { to: "/topup/success", label: "Пополнение успешно", icon: "solar:check-circle-linear" },
      { to: "/favorites", label: "Избранные", icon: "solar:star-linear" },
      { to: "/about", label: "О приложении", icon: "solar:info-circle-linear" },
      { to: "/support", label: "Поддержка", icon: "solar:chat-round-dots-linear" },
      { to: "/install", label: "Установка PWA", icon: "solar:download-minimalistic-linear" },
      { to: "/splash", label: "Splash Screen", icon: "solar:sun-linear" },
    ],
  },
  {
    title: "Auth",
    links: [
      { to: "/auth/phone", label: "Вход (телефон)", icon: "solar:phone-linear" },
      { to: "/auth/otp", label: "OTP верификация", icon: "solar:lock-keyhole-linear" },
      { to: "/auth/name", label: "Ввод имени", icon: "solar:user-plus-linear" },
      { to: "/auth/debug", label: "Auth Debug", icon: "solar:bug-linear" },
    ],
  },
  {
    title: "Гость",
    links: [
      { to: "/guest/SIM-TEST", label: "Landing /SIM-TEST", icon: "solar:user-speak-linear" },
      { to: "/guest/SIM-TEST-201", label: "Landing /SIM-TEST-201", icon: "solar:user-speak-linear" },
      { to: "/guest/phone", label: "Телефон гостя", icon: "solar:phone-linear" },
      { to: "/guest/payment", label: "Оплата гостя", icon: "solar:card-linear" },
      { to: "/guest/payment/qr", label: "Оплата QR", icon: "solar:qr-code-linear" },
      { to: "/guest/charging/demo-session", label: "Зарядка гостя", icon: "solar:bolt-linear" },
      { to: "/guest/complete/demo-session", label: "Завершение гостя", icon: "solar:check-circle-linear" },
    ],
  },
  {
    title: "Партнёр",
    links: [
      { to: "/partner/dashboard", label: "Обзор", icon: "solar:widget-2-linear" },
      { to: "/partner/stations", label: "Станции", icon: "solar:battery-charge-linear" },
      { to: "/partner/sessions", label: "Сессии", icon: "solar:history-linear" },
      { to: "/partner/revenue", label: "Доходы", icon: "solar:graph-up-linear" },
      { to: "/partner/settings", label: "Настройки", icon: "solar:settings-linear" },
    ],
  },
  {
    title: "Owner Dashboard",
    links: [
      { to: "/owner/dashboard", label: "Обзор", icon: "solar:widget-2-linear" },
      { to: "/owner/stations", label: "Станции", icon: "solar:battery-charge-linear" },
      { to: "/owner/stations/create", label: "Создать станцию", icon: "solar:add-circle-linear" },
      { to: "/owner/sessions", label: "Сессии", icon: "solar:history-linear" },
      { to: "/owner/revenue", label: "Доходы", icon: "solar:graph-up-linear" },
      { to: "/owner/incidents", label: "Инциденты", icon: "solar:danger-triangle-linear" },
      { to: "/owner/locations", label: "Локации", icon: "solar:map-point-linear" },
      { to: "/owner/locations/create", label: "Создать локацию", icon: "solar:add-circle-linear" },
      { to: "/owner/tariffs", label: "Тарифы", icon: "solar:tag-price-linear" },
      { to: "/owner/tariffs/create", label: "Создать тариф", icon: "solar:add-circle-linear" },
      { to: "/owner/corporate", label: "Корпоративные", icon: "solar:buildings-2-linear" },
      { to: "/owner/corporate/create", label: "Создать корп. группу", icon: "solar:add-circle-linear" },
      { to: "/owner/logs", label: "OCPP Логи", icon: "solar:document-text-linear" },
      { to: "/owner/operators", label: "Операторы", icon: "solar:user-plus-linear" },
      { to: "/owner/users", label: "Пользователи", icon: "solar:users-group-rounded-linear" },
    ],
  },
  {
    title: "Admin Panel",
    links: [
      { to: "/admin/dashboard", label: "Обзор", icon: "solar:widget-2-linear" },
      { to: "/admin/stations", label: "Станции", icon: "solar:battery-charge-linear" },
      { to: "/admin/stations/create", label: "Создать станцию", icon: "solar:add-circle-linear" },
      { to: "/admin/sessions", label: "Сессии", icon: "solar:history-linear" },
      { to: "/admin/clients", label: "Клиенты", icon: "solar:users-group-two-rounded-linear" },
      { to: "/admin/reserves", label: "Резервы", icon: "solar:calendar-mark-linear" },
      { to: "/admin/partners", label: "Партнёры", icon: "solar:handshake-linear" },
      { to: "/admin/analytics", label: "Аналитика", icon: "solar:chart-square-linear" },
      { to: "/admin/revenue", label: "Доходы", icon: "solar:graph-up-linear" },
      { to: "/admin/locations", label: "Локации", icon: "solar:map-point-linear" },
      { to: "/admin/locations/create", label: "Создать локацию", icon: "solar:add-circle-linear" },
      { to: "/admin/tariffs", label: "Тарифы", icon: "solar:tag-price-linear" },
      { to: "/admin/tariffs/create", label: "Создать тариф", icon: "solar:add-circle-linear" },
      { to: "/admin/corporate", label: "Корпоративные", icon: "solar:buildings-2-linear" },
      { to: "/admin/corporate/create", label: "Создать корп. группу", icon: "solar:add-circle-linear" },
      { to: "/admin/operators", label: "Операторы", icon: "solar:user-plus-linear" },
      { to: "/admin/users", label: "Пользователи", icon: "solar:users-group-rounded-linear" },
      { to: "/admin/logs", label: "OCPP Логи", icon: "solar:document-text-linear" },
      { to: "/admin/alerts", label: "Алерты", icon: "solar:bell-bing-linear" },
      { to: "/admin/stress-test", label: "Стресс-тест", icon: "solar:bomb-linear" },
      { to: "/admin/settings", label: "Настройки", icon: "solar:settings-linear" },
    ],
  },
  {
    title: "Корпоратив",
    links: [
      { to: "/corporate/login", label: "Логин", icon: "solar:lock-linear" },
      { to: "/corporate/dashboard", label: "Обзор", icon: "solar:widget-2-linear" },
      { to: "/corporate/employees", label: "Сотрудники", icon: "solar:users-group-rounded-linear" },
      { to: "/corporate/reports", label: "Отчёты", icon: "solar:document-text-linear" },
      { to: "/corporate/invoices", label: "Счета", icon: "solar:bill-list-linear" },
    ],
  },
  {
    title: "Системная карта",
    links: [
      { to: "/admin/system-map", label: "System Map", icon: "solar:diagram-up-linear" },
    ],
  },
  {
    title: "Лендинг (WWW)",
    links: [
      { to: "/www", label: "Главная", icon: "solar:home-linear" },
      { to: "/www/map", label: "Карта", icon: "solar:map-linear" },
      { to: "/www/tariffs", label: "Тарифы", icon: "solar:tag-price-linear" },
      { to: "/www/b2b", label: "B2B", icon: "solar:buildings-linear" },
      { to: "/www/faq", label: "FAQ", icon: "solar:question-circle-linear" },
      { to: "/www/contacts", label: "Контакты", icon: "solar:phone-linear" },
      { to: "/www/download", label: "Скачать", icon: "solar:download-minimalistic-linear" },
    ],
  },
  {
    title: "Debug / PWA",
    links: [
      { to: "/pwa/debug", label: "PWA Debug", icon: "solar:bug-linear" },
      { to: "/auth/debug", label: "Auth Debug", icon: "solar:shield-keyhole-linear" },
    ],
  },
  {
    title: "Error Pages",
    links: [
      { to: "/error/charging", label: "Charging Error", icon: "solar:danger-triangle-linear" },
      { to: "/error/balance", label: "Low Balance", icon: "solar:wallet-linear" },
      { to: "/error/offline", label: "Offline", icon: "solar:cloud-cross-linear" },
      { to: "/error/station", label: "Station N/A", icon: "solar:close-circle-linear" },
      { to: "/error/connectors", label: "Connectors Busy", icon: "solar:plug-circle-linear" },
      { to: "/error/payment", label: "Payment Error", icon: "solar:card-linear" },
      { to: "/error/limit", label: "Limit Reached", icon: "solar:stop-circle-linear" },
      { to: "/error/update", label: "App Update", icon: "solar:download-minimalistic-linear" },
      { to: "/nonexistent-page", label: "404", icon: "solar:question-circle-linear" },
    ],
  },
];

// ========== Section: Demo Login ==========

function DemoLoginSection() {
  const navigate = useNavigate();
  const { login, loginAsOwner } = useUnifiedAuthStore();
  const { enableDemo } = useDemoMode();

  const loginAs = (role: "client" | "partner" | "admin" | "owner") => {
    const demoUser = {
      id: `demo-${role}`,
      email: null,
      phone: "+996555000000",
      name: role === "client" ? "Демо Клиент" : role === "partner" ? "Демо Партнёр" : role === "owner" ? "Демо Owner" : "Демо Админ",
      balance: 5000,
      status: "active" as const,
      favoriteStations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    login(demoUser);

    if (role === "partner" || role === "admin" || role === "owner") {
      const ownerData: Owner = {
        id: `demo-${role}`,
        phone: "+996555000000",
        role: role === "partner" ? "operator" : "admin",
        is_active: true,
        is_partner: role === "partner",
      };
      loginAsOwner(ownerData);
    }

    enableDemo(role === "owner" ? "admin" : role);

    if (role === "client") navigate("/");
    else if (role === "partner") navigate("/partner/dashboard");
    else if (role === "owner") navigate("/owner/dashboard");
    else navigate("/admin/dashboard");
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-yellow-400/80 bg-yellow-400/10 rounded-lg px-3 py-2">
        Демо-логин — только просмотр UI. API запросы не работают. Для полного теста используйте реальный вход ниже.
      </p>
      <button
        onClick={() => loginAs("client")}
        className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-zinc-900 dark:text-white transition-colors active:scale-[0.98]"
      >
        <Icon icon="solar:user-linear" width={20} className="text-blue-400" />
        <div className="text-left">
          <p className="font-medium">Войти как клиент</p>
          <p className="text-xs text-zinc-500 dark:text-gray-400">Карта, зарядка, баланс</p>
        </div>
      </button>

      <button
        onClick={() => loginAs("partner")}
        className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-zinc-900 dark:text-white transition-colors active:scale-[0.98]"
      >
        <Icon icon="solar:buildings-linear" width={20} className="text-green-400" />
        <div className="text-left">
          <p className="font-medium">Партнёр (АО Бишкек Электро)</p>
          <p className="text-xs text-zinc-500 dark:text-gray-400">12 станций · 3 города · доля 80%</p>
        </div>
      </button>

      <button
        onClick={() => loginAs("admin")}
        className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-zinc-900 dark:text-white transition-colors active:scale-[0.98]"
      >
        <Icon icon="solar:shield-user-linear" width={20} className="text-red-400" />
        <div className="text-left">
          <p className="font-medium">Системный администратор</p>
          <p className="text-xs text-zinc-500 dark:text-gray-400">Вся сеть: 35 станций · 20 локаций · 3 города</p>
        </div>
      </button>

      <button
        onClick={() => loginAs("owner")}
        className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-zinc-900 dark:text-white transition-colors active:scale-[0.98]"
      >
        <Icon icon="solar:settings-minimalistic-linear" width={20} className="text-orange-400" />
        <div className="text-left">
          <p className="font-medium">Городской оператор (Бишкек)</p>
          <p className="text-xs text-zinc-500 dark:text-gray-400">20 станций · 15 локаций · только Бишкек</p>
        </div>
      </button>
    </div>
  );
}

// ========== Section: Guest Flow ==========

function GuestFlowSection() {
  const [code, setCode] = useState("SIM-TEST");
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Код станции"
          className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <button
          onClick={() => navigate(`/guest/${code}`)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          Открыть
        </button>
      </div>
      <p className="text-xs text-zinc-500 dark:text-gray-500">
        Тестовые коды: SIM-TEST, SIM-TEST-201
      </p>
    </div>
  );
}

// ========== Section: Features Demo ==========

function FeaturesDemo() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <button
        onClick={() => navigate("/settings#notifications")}
        className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-zinc-900 dark:text-white transition-colors active:scale-[0.98]"
      >
        <Icon icon="solar:bell-linear" width={20} className="text-red-400" />
        <div className="text-left">
          <p className="font-medium">Push Notifications UI</p>
          <p className="text-xs text-zinc-500 dark:text-gray-400">6 типов, тихие часы, история, тест</p>
        </div>
      </button>
    </div>
  );
}

// ========== Section: Corporate Demo ==========

function CorporateDemoSection() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <p className="text-xs text-blue-400/80 bg-blue-400/10 rounded-lg px-3 py-2">
        Корпоративный кабинет для юридических лиц. Вход через обычный OTP, но номер должен быть привязан к корп. группе.
      </p>
      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 space-y-2">
        <p className="text-xs text-zinc-500 dark:text-gray-400 font-semibold mb-1">Демо-аккаунты:</p>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-600 dark:text-gray-300">Администратор (ОсОО "Электромобиль KG")</span>
            <code className="text-xs text-green-500 bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded">+996700100001</code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-600 dark:text-gray-300">Сотрудник #1</span>
            <code className="text-xs text-green-500 bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded">+996700100002</code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-600 dark:text-gray-300">Сотрудник #2</span>
            <code className="text-xs text-green-500 bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded">+996700100003</code>
          </div>
        </div>
      </div>
      <button
        onClick={() => navigate("/corporate/login")}
        className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-zinc-900 dark:text-white transition-colors active:scale-[0.98]"
      >
        <Icon icon="solar:buildings-2-linear" width={20} className="text-blue-400" />
        <div className="text-left">
          <p className="font-medium">Войти в корпоративный кабинет</p>
          <p className="text-xs text-zinc-500 dark:text-gray-400">OTP авторизация</p>
        </div>
      </button>
    </div>
  );
}

// ========== Section: Station Emulator ==========

function StationEmulatorSection() {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-orange-400/80 bg-orange-400/10 rounded-lg px-3 py-2">
        Станции отображаются на карте, но показывают &laquo;offline&raquo; если OCPP-симулятор не запущен на сервере.
      </p>
      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 space-y-2">
        <div className="flex justify-between">
          <span className="text-zinc-500 dark:text-gray-400">SIM-TEST</span>
          <span className="text-zinc-500 dark:text-gray-500">Симулятор (требует запуск)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500 dark:text-gray-400">SIM-TEST-201</span>
          <span className="text-zinc-500 dark:text-gray-500">Симулятор (требует запуск)</span>
        </div>
      </div>
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 space-y-2">
        <p className="text-zinc-500 dark:text-gray-400 mb-1">Запуск на VPS (SSH):</p>
        <code className="text-xs text-green-600 dark:text-green-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded block">
          ssh vps
        </code>
        <code className="text-xs text-green-600 dark:text-green-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded block overflow-x-auto whitespace-nowrap">
          cd /root/ocpp-rp/tools/.simulator && CP_ID=&quot;SIM-TEST&quot; npx tsx index_16.ts
        </code>
      </div>
    </div>
  );
}

// ========== Section: Real Login ==========

function RealLoginSection() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("+996700000001");

  const goToLogin = () => {
    navigate("/auth/login", { state: { phone } });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-green-400/80 bg-green-400/10 rounded-lg px-3 py-2">
        Настоящая авторизация через OTP. Код появится в логах сервера: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">tail -f /tmp/uvicorn.log</code>
      </p>
      <div className="flex gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+996XXXXXXXXX"
          className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
        />
        <button
          onClick={goToLogin}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
        >
          Войти
        </button>
      </div>
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 space-y-1">
        <p className="text-xs text-zinc-500 dark:text-gray-400">Тестовые номера (DEV MODE):</p>
        <p className="text-xs text-zinc-600 dark:text-gray-300">+996700000001 — тестовый клиент (баланс 5000)</p>
        <p className="text-xs text-zinc-500 dark:text-gray-400 mt-2">OTP приходит в логи, не по SMS.</p>
      </div>
    </div>
  );
}

// ========== Main Page ==========

export function SandboxPage() {
  const { isDemoMode, disableDemo } = useDemoMode();
  const { isAuthenticated, userType } = useUnifiedAuthStore();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] text-zinc-900 dark:text-white">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <Icon icon="solar:test-tube-linear" width={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Sandbox</h1>
              <p className="text-xs text-zinc-500 dark:text-gray-400">Red Petroleum EV — Dev Tools</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {isDemoMode && (
              <button
                onClick={disableDemo}
                className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-lg text-xs"
              >
                Demo ON
              </button>
            )}
            {isAuthenticated && (
              <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-lg text-xs">
                {userType}
              </span>
            )}
            <Link to="/" className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-gray-300 transition-colors">
              <Icon icon="solar:map-linear" width={16} className="inline mr-1" />
              Карта
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-8">
        {/* A) Quick Navigation */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Icon icon="solar:compass-linear" width={20} className="text-red-400" />
            Быстрая навигация
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {navGroups.map((group) => (
              <div key={group.title} className="bg-white/80 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-zinc-500 dark:text-gray-500 uppercase tracking-wider mb-3">{group.title}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {group.links.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs text-zinc-600 dark:text-gray-300 transition-colors"
                    >
                      <Icon icon={link.icon} width={14} />
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* B) Real Login */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Icon icon="solar:key-linear" width={20} className="text-green-400" />
              Реальный вход (OTP)
            </h2>
            <RealLoginSection />
          </section>

          {/* C) Guest Flow */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Icon icon="solar:user-speak-linear" width={20} className="text-blue-400" />
              Гостевой поток
            </h2>
            <GuestFlowSection />
          </section>

          {/* D) Demo Login */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Icon icon="solar:login-2-linear" width={20} className="text-yellow-400" />
              Демо-логин (UI only)
            </h2>
            <DemoLoginSection />
          </section>

          {/* F) Corporate Demo */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Icon icon="solar:buildings-2-linear" width={20} className="text-blue-400" />
              Корпоративный кабинет
            </h2>
            <CorporateDemoSection />
          </section>

          {/* G) Features Demo */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Icon icon="solar:star-spark-linear" width={20} className="text-purple-400" />
              Демонстрация функций
            </h2>
            <FeaturesDemo />
          </section>

          {/* E) Station Emulator */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Icon icon="solar:battery-charge-linear" width={20} className="text-orange-400" />
              Эмулятор станции
            </h2>
            <StationEmulatorSection />
          </section>
        </div>
      </div>
    </div>
  );
}
