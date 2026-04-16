import { Icon } from "@iconify/react";

export function B2BPage() {
  return (
    <main className="flex-1 container mx-auto px-4 py-8 lg:py-12 max-w-6xl">

      {/* Header Section */}
      <div className="mb-12 text-center animate-enter" style={{ animationDelay: "0s" }}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 mb-4">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Для бизнеса</span>
        </div>
        <h1 className="text-3xl lg:text-5xl font-semibold tracking-tight mb-4 text-zinc-900 dark:text-white">Растите вместе с нами</h1>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto text-lg">Управляйте корпоративным автопарком или начните зарабатывать на зарядных станциях.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">

        {/* Corporate Clients Section */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 lg:p-8 flex flex-col animate-enter hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 group" style={{ animationDelay: "0.1s" }}>
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white mb-6 group-hover:scale-110 transition-transform duration-300">
              <Icon icon="solar:buildings-2-linear" width={24} />
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-zinc-900 dark:text-white">Корпоративные клиенты</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Оптимизируйте расходы на автопарк с помощью нашей экосистемы.</p>
          </div>

          {/* Benefits List */}
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-5 mb-8 border border-zinc-100 dark:border-zinc-800/50">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <Icon icon="solar:star-linear" width={16} className="text-red-500" />
              Преимущества
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                <Icon icon="solar:check-circle-linear" width={16} className="text-zinc-400 mt-0.5 shrink-0" />
                <span><strong className="text-zinc-900 dark:text-white">Единый баланс</strong> для всей компании</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                <Icon icon="solar:check-circle-linear" width={16} className="text-zinc-400 mt-0.5 shrink-0" />
                <span>Лимиты для каждого сотрудника</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                <Icon icon="solar:check-circle-linear" width={16} className="text-zinc-400 mt-0.5 shrink-0" />
                <span>Детальные отчёты и статистика (ЭСФ)</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                <Icon icon="solar:check-circle-linear" width={16} className="text-zinc-400 mt-0.5 shrink-0" />
                <span>Постоплата (счёт в конце месяца)</span>
              </li>
            </ul>
          </div>

          {/* Form */}
          <form className="space-y-4 mt-auto" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 ml-1">Название организации</label>
                <input
                  type="text"
                  placeholder="ОсОО 'Example'"
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-red-500 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-3 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 ml-1">ИНН</label>
                <input
                  type="text"
                  placeholder="1234567890"
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-red-500 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-3 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 ml-1">Телефон</label>
                <input
                  type="tel"
                  placeholder="+996 555 000 000"
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-red-500 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-3 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 ml-1">Email</label>
                <input
                  type="email"
                  placeholder="corp@company.com"
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-red-500 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-3 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 ml-1">Количество электромобилей</label>
              <div className="relative">
                <Icon icon="solar:car-linear" width={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="number"
                  placeholder="5"
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-red-500 text-zinc-900 dark:text-white text-sm rounded-xl pl-11 pr-4 py-3 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
              </div>
            </div>

            <button
              type="button"
              className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium py-3.5 rounded-xl mt-2 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>Отправить заявку</span>
              <Icon icon="solar:arrow-right-linear" width={18} />
            </button>
            <p className="text-[10px] text-zinc-400 text-center">Нажимая кнопку, вы соглашаетесь с политикой обработки данных</p>
          </form>
        </div>

        {/* Partners Section */}
        <div className="bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-900/20 rounded-3xl p-6 lg:p-8 flex flex-col animate-enter relative overflow-hidden group" style={{ animationDelay: "0.2s" }}>
          {/* Decorative BG */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <div className="mb-8 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-500 mb-6 group-hover:scale-110 transition-transform duration-300">
              <Icon icon="solar:hand-shake-linear" width={24} />
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-zinc-900 dark:text-white">Стать партнёром</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Монетизируйте свою парковку или локацию, установив зарядную станцию.</p>
          </div>

          {/* Benefits List */}
          <div className="bg-red-50/50 dark:bg-red-900/5 rounded-2xl p-5 mb-8 border border-red-100 dark:border-red-500/10 relative z-10">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <Icon icon="solar:wallet-money-linear" width={16} className="text-red-500" />
              Ваша выгода
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                <Icon icon="solar:check-circle-bold" width={16} className="text-red-500 mt-0.5 shrink-0" />
                <span>Доход <strong className="text-zinc-900 dark:text-white">до 80%</strong> от каждой зарядки</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                <Icon icon="solar:check-circle-bold" width={16} className="text-red-500 mt-0.5 shrink-0" />
                <span>Мы берём на себя обслуживание</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                <Icon icon="solar:check-circle-bold" width={16} className="text-red-500 mt-0.5 shrink-0" />
                <span>Мгновенная интеграция в сеть</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                <Icon icon="solar:check-circle-bold" width={16} className="text-red-500 mt-0.5 shrink-0" />
                <span>Личный кабинет владельца</span>
              </li>
            </ul>
          </div>

          {/* Form */}
          <form className="space-y-4 mt-auto relative z-10" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 ml-1">Ваше имя</label>
                <input
                  type="text"
                  placeholder="Иван Иванов"
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-red-500 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-3 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 ml-1">Телефон</label>
                <input
                  type="tel"
                  placeholder="+996 555 000 000"
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-red-500 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-3 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 ml-1">Адрес предполагаемой станции</label>
              <div className="relative">
                <Icon icon="solar:map-point-linear" width={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="г. Бишкек, ул. ..."
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-red-500 text-zinc-900 dark:text-white text-sm rounded-xl pl-11 pr-4 py-3 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
              </div>
            </div>

            <button
              type="button"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3.5 rounded-xl mt-2 active:scale-[0.98] transition-all shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.23)] flex items-center justify-center gap-2"
            >
              <span>Оставить заявку</span>
              <Icon icon="solar:letter-linear" width={18} />
            </button>
            <p className="text-[10px] text-zinc-400 text-center">Менеджер свяжется с вами в течение рабочего дня</p>
          </form>
        </div>
      </div>

    </main>
  );
}
