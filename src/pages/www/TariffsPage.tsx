import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

export function TariffsPage() {
  return (
    <main className="flex-1 container mx-auto px-4 py-8 lg:py-12 max-w-4xl">

      {/* Header Section */}
      <div className="mb-10 text-center animate-enter" style={{ animationDelay: "0s" }}>
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight mb-3 text-zinc-900 dark:text-white">Тарифные планы</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Прозрачные условия зарядки для вашего электромобиля</p>
      </div>

      {/* Individuals Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 animate-enter" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest">Для физических лиц</h2>
          <div className="h-[1px] flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
        </div>

        {/* Tariff Cards Grid */}
        <div className="grid md:grid-cols-2 gap-4 animate-enter" style={{ animationDelay: "0.2s" }}>
          {/* Day Tariff */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-lg dark:hover:bg-[#0f0f0f] transition-all duration-300 flex flex-col relative group overflow-hidden">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-500">
                <Icon icon="solar:sun-2-linear" width={20} />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400">06:00 - 23:00</span>
            </div>
            <h3 className="text-lg font-medium mb-1">Дневной тариф</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold tracking-tight">15</span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">сом / кВтч</span>
            </div>
            <ul className="space-y-3 mt-auto border-t border-zinc-100 dark:border-zinc-800/50 pt-4">
              <li className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Icon icon="solar:check-circle-linear" width={16} className="text-zinc-400" />
                <span>Доступ ко всем станциям</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Icon icon="solar:check-circle-linear" width={16} className="text-zinc-400" />
                <span>Быстрая зарядка (DC)</span>
              </li>
            </ul>
          </div>

          {/* Night Tariff */}
          <div className="bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-6 hover:shadow-lg dark:hover:bg-[#0f0f0f] hover:border-indigo-500/50 transition-all duration-300 flex flex-col relative overflow-hidden">
            {/* Badge */}
            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">СКИДКА 20%</div>

            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Icon icon="solar:moon-stars-linear" width={20} />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400">23:00 - 06:00</span>
            </div>
            <h3 className="text-lg font-medium mb-1">Ночной тариф</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">12</span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">сом / кВтч</span>
            </div>
            <ul className="space-y-3 mt-auto border-t border-zinc-100 dark:border-zinc-800/50 pt-4">
              <li className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Icon icon="solar:check-circle-linear" width={16} className="text-indigo-500/70" />
                <span>Самая выгодная цена</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Icon icon="solar:check-circle-linear" width={16} className="text-indigo-500/70" />
                <span>Без ограничений скорости</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Calculation Example */}
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 lg:p-8 animate-enter" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-2 mb-6">
            <Icon icon="solar:calculator-minimalistic-linear" width={20} className="text-zinc-500" />
            <h3 className="text-lg font-medium">Пример расчёта стоимости</h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-zinc-200 dark:border-zinc-800 border-dashed">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-zinc-900 dark:text-white">Зарядка 50 кВтч днём</span>
                <span className="text-xs text-zinc-500">50 × 15 сом</span>
              </div>
              <span className="font-medium">750 сом</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-zinc-200 dark:border-zinc-800 border-dashed">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Зарядка 50 кВтч ночью</span>
                <span className="text-xs text-zinc-500">50 × 12 сом</span>
              </div>
              <span className="font-medium text-indigo-600 dark:text-indigo-400">600 сом</span>
            </div>
          </div>

          <div className="mt-6 bg-white dark:bg-black/20 rounded-xl p-4 flex items-center justify-between border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500">
                <Icon icon="solar:wallet-money-linear" width={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Экономия за месяц</span>
                <span className="text-[10px] text-zinc-400">(при 1000 кВтч)</span>
              </div>
            </div>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-500">3,000 сом</span>
          </div>
        </div>

        {/* Guest Charging */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-enter" style={{ animationDelay: "0.4s" }}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon icon="solar:user-hand-up-linear" width={20} className="text-zinc-500" />
              <h3 className="text-lg font-medium">Гостевая зарядка</h3>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
              Заряжайтесь без регистрации. Оплата картой. Минимальная сумма пополнения — 200 сом.
            </p>
            <div className="flex items-center gap-2 text-xs text-red-500 mt-2">
              <Icon icon="solar:danger-circle-linear" width={14} />
              <span>Ночной тариф недоступен для гостей</span>
            </div>
          </div>
          <button className="shrink-0 px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-sm font-medium rounded-xl transition-colors">
            Как это работает?
          </button>
        </div>
      </div>

      {/* Business Section */}
      <div className="mt-12 animate-enter" style={{ animationDelay: "0.5s" }}>
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest">Для бизнеса</h2>
          <div className="h-[1px] flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
        </div>

        <div className="relative overflow-hidden bg-zinc-900 dark:bg-white rounded-2xl p-8 text-white dark:text-zinc-900 shadow-2xl">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-zinc-800 dark:bg-zinc-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-red-600 rounded-full opacity-20 blur-3xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-lg">
              <h3 className="text-2xl font-semibold">Корпоративные тарифы</h3>
              <p className="text-zinc-400 dark:text-zinc-600 text-sm leading-relaxed">
                Индивидуальные условия для автопарков. Система постоплаты, управление лимитами сотрудников и детальная отчётность в личном кабинете.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-zinc-300 dark:text-zinc-700">
                  <Icon icon="solar:check-read-linear" width={16} className="text-zinc-500" />
                  <span>Единый счёт для всех авто</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-zinc-300 dark:text-zinc-700">
                  <Icon icon="solar:check-read-linear" width={16} className="text-zinc-500" />
                  <span>Закрывающие документы (ЭСФ)</span>
                </li>
              </ul>
            </div>

            <Link
              to="/www/b2b"
              className="group flex items-center gap-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-6 py-3 rounded-xl font-medium text-sm hover:scale-105 transition-transform duration-200"
            >
              <span>Оставить заявку</span>
              <Icon icon="solar:arrow-right-linear" width={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

    </main>
  );
}
