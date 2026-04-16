import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";

/* ------------------------------------------------------------------ */
/*  Marquee brand icons (duplicated for infinite scroll)              */
/* ------------------------------------------------------------------ */
const brandIcons = [
  { icon: "simple-icons:tesla", size: 24 },
  { icon: "simple-icons:byd", size: 32 },
  { icon: "simple-icons:zeekr", size: 20 },
  { icon: "simple-icons:liauto", size: 28 },
  { icon: "simple-icons:porsche", size: 32 },
  { icon: "simple-icons:mercedes", size: 32 },
  { icon: "simple-icons:bmw", size: 32 },
  { icon: "simple-icons:audi", size: 32 },
] as const;

function BrandRow({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div
      className="flex items-center justify-around gap-16 shrink-0 animate-marquee min-w-full"
      aria-hidden={ariaHidden || undefined}
    >
      {brandIcons.map((b) => (
        <Icon
          key={b.icon}
          icon={b.icon}
          width={b.size}
          className="text-zinc-300 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors duration-300 cursor-pointer"
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature cards data                                                */
/* ------------------------------------------------------------------ */
const features = [
  {
    icon: "solar:bolt-linear",
    iconColor: "text-red-600",
    title: "Быстрая зарядка 150 кВт",
    desc: "Зарядите свой электромобиль до 80% всего за 15-30 минут. Европейское оборудование с защитой от перегрузок.",
    colSpan: "md:col-span-2",
  },
  {
    icon: "solar:plug-circle-linear",
    iconColor: "text-zinc-900 dark:text-white",
    title: "Все разъёмы",
    desc: "Поддерживаем CCS2, CHAdeMO и GB/T.",
    colSpan: "",
  },
  {
    icon: "solar:clock-circle-linear",
    iconColor: "text-zinc-900 dark:text-white",
    title: "Работаем 24/7",
    desc: "Доступно круглосуточно. Безопасные локации.",
    colSpan: "",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Steps data                                                        */
/* ------------------------------------------------------------------ */
const steps = [
  {
    title: "Скачайте приложение",
    desc: "Доступно для iOS и Android. Удобный интерфейс для поиска станций и управления зарядкой.",
    active: true,
  },
  {
    title: "Зарегистрируйтесь",
    desc: "Создайте аккаунт за минуту по номеру телефона. Привяжите карту для быстрой оплаты.",
    active: false,
  },
  {
    title: "Найдите станцию",
    desc: "Используйте карту для поиска ближайшей станции. Фильтруйте по типу коннектора и мощности.",
    active: false,
  },
] as const;

/* ================================================================== */
/*  HomePage                                                          */
/* ================================================================== */
export function HomePage() {
  return (
    <>
      {/* ---- Inline keyframes (marquee, phone mockup) ---- */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 50s linear infinite;
        }
        .group:hover .animate-marquee {
          animation-play-state: paused;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
        }
        .animate-fade-up { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }

        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(220, 38, 38, 0.4)); }
          50%      { filter: drop-shadow(0 0 16px rgba(220, 38, 38, 0.7)); }
        }
        .neon-svg { animation: pulse-glow 3s infinite ease-in-out; }
        .progress-ring__circle {
          transition: stroke-dashoffset 0.35s;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
        }

        @keyframes ripple {
          0%   { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .ripple-circle { animation: ripple 3s infinite cubic-bezier(0, 0.2, 0.8, 1); }

        @keyframes rise-up-long {
          0%   { transform: translateY(520px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.8; }
          100% { transform: translateY(-100px); opacity: 0; }
        }
        .energy-beam {
          background: linear-gradient(to top, rgba(239, 68, 68, 0), #EF4444, rgba(239, 68, 68, 0));
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
          position: absolute;
          bottom: 0;
          border-radius: 99px;
          opacity: 0;
          will-change: transform, opacity;
        }
        .beams-mask {
          mask-image: linear-gradient(to top, transparent 0%, black 10%, black 90%, transparent 100%);
          -webkit-mask-image: linear-gradient(to top, transparent 0%, black 10%, black 90%, transparent 100%);
        }

        .shine-button { position: relative; overflow: hidden; }
        .shine-button::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: 0.5s;
        }
        .shine-button:hover::after { left: 100%; }

        .linear-card {
          border: 1px solid var(--lc-border, #E4E4E7);
          background-color: var(--lc-bg, #FFFFFF);
          box-shadow: var(--lc-shadow, 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03));
          transition: all 0.3s ease;
        }
        :is(.dark) .linear-card {
          --lc-border: rgba(63,63,70,0.5);
          --lc-bg: rgba(24,24,27,0.6);
          --lc-shadow: none;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .linear-card:hover {
          border-color: rgba(220,38,38,0.4);
          transform: translateY(-2px);
        }

        .map-pattern {
          background-color: #e5e5e5;
          background-image:
            linear-gradient(#fff 2px, transparent 2px),
            linear-gradient(90deg, #fff 2px, transparent 2px);
          background-size: 40px 40px;
        }
        :is(.dark) .map-pattern {
          background-color: #0A0E17;
          background-image:
            linear-gradient(#27272a 2px, transparent 2px),
            linear-gradient(90deg, #27272a 2px, transparent 2px);
        }
      `}</style>

      {/* ============================================================ */}
      {/*  AMBIENT BACKGROUND                                          */}
      {/* ============================================================ */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.08] dark:opacity-[0.1]"
          style={{
            backgroundSize: "40px 40px",
            backgroundImage:
              "linear-gradient(to right, #E4E4E7 1px, transparent 1px), linear-gradient(to bottom, #E4E4E7 1px, transparent 1px)",
            maskImage:
              "radial-gradient(circle at center, black 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(circle at center, black 40%, transparent 100%)",
          }}
        />
        {/* Red glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-red-600/5 dark:bg-red-600/10 blur-[120px] rounded-full opacity-60" />
      </div>

      {/* ============================================================ */}
      {/*  HERO SECTION                                                */}
      {/* ============================================================ */}
      <main className="z-10 max-w-7xl mx-auto pt-36 px-6 pb-20 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div className="flex flex-col animate-fade-up opacity-0 items-start">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] shadow-sm mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-xs font-semibold text-zinc-800 dark:text-red-400/90 tracking-tight">
                Первая сеть быстрых ЭЗС в Кыргызстане
              </span>
            </div>

            {/* Heading */}
            <h1 className="lg:text-7xl leading-[1.05] text-5xl font-black italic text-zinc-900 dark:text-white mb-6 tracking-tight">
              ЗАРЯЖАЙ
              <br />
              <span className="text-red-600">БУДУЩЕЕ </span>
              СЕГОДНЯ
            </h1>

            {/* Description */}
            <p className="leading-relaxed text-lg font-light text-zinc-600 dark:text-white/80 max-w-md mb-10">
              Сеть быстрых зарядных станций от Red Petroleum. До 150 кВт
              мощности. Зарядка любого электромобиля от 15 минут.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/install"
                className="btn btn-primary shine-button h-12 px-8 !rounded-full text-[15px] shadow-[0_0_25px_rgba(220,38,38,0.5)] border-red-500"
              >
                Скачать приложение
              </Link>
              <Link
                to="/www/map"
                className="btn btn-outline h-12 px-8 !rounded-full text-[15px] gap-2 border-zinc-300 dark:border-red-500 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-red-500/10"
              >
                Найти станцию
                <Icon
                  icon="solar:map-arrow-right-linear"
                  width={18}
                  className="text-red-500 ml-2"
                />
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 flex items-center gap-8 border-t border-zinc-200 dark:border-white/10 pt-8 w-full">
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">210</div>
                <div className="text-xs text-zinc-500 dark:text-white/50 uppercase tracking-wider mt-1 font-semibold">
                  Станций
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">150 кВт</div>
                <div className="text-xs text-zinc-500 dark:text-white/50 uppercase tracking-wider mt-1 font-semibold">
                  Мощность
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">24/7</div>
                <div className="text-xs text-zinc-500 dark:text-white/50 uppercase tracking-wider mt-1 font-semibold">
                  Доступ
                </div>
              </div>
            </div>
          </div>

          {/* Right: Cashback Card */}
          <div className="relative opacity-0 animate-fade-up delay-2">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative w-full max-w-md ml-auto linear-card rounded-2xl p-8 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-900/10 transition-all duration-300">
              {/* Card Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-900 dark:text-white">
                  <Icon icon="solar:star-linear" width={24} />
                </div>
                <div className="px-2.5 py-1 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-md text-[11px] font-bold text-zinc-600 dark:text-white/80">
                  Уровень: Gold
                </div>
              </div>

              <h3 className="text-xl text-zinc-900 dark:text-white font-bold mb-1">
                Red Club
              </h3>
              <div className="text-sm text-zinc-500 dark:text-white/60 mb-6 font-medium">
                Программа лояльности
              </div>

              {/* Cashback */}
              <div className="mb-8 p-4 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.04] rounded-xl text-center relative overflow-hidden">
                <div className="text-[11px] text-zinc-400 dark:text-white/40 uppercase tracking-wider mb-2 font-bold">
                  Ваш кэшбек
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
                    15%
                  </span>
                  <span className="text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded rotate-[-6deg]">
                    MAX
                  </span>
                </div>
                <div className="mt-2 text-[12px] text-zinc-400 dark:text-white/40 font-medium">
                  Бонусы с каждого кВт·ч
                </div>
              </div>

              {/* Bonus Items */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-500 dark:text-white/60 shrink-0 border border-zinc-100 dark:border-white/5">
                    <Icon icon="solar:wallet-money-linear" width={16} />
                  </div>
                  <div>
                    <div className="text-[13px] text-zinc-900 dark:text-white font-semibold">
                      1 Бонус = 1 Сом
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-white/40">
                      Честный курс обмена
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-500 dark:text-white/60 shrink-0 border border-zinc-100 dark:border-white/5">
                    <Icon icon="solar:ev-station-linear" width={16} />
                  </div>
                  <div>
                    <div className="text-[13px] text-zinc-900 dark:text-white font-semibold">
                      Тратьте на АЗС
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-white/40">
                      Топливо и товары
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between text-[11px] text-zinc-500 dark:text-white/40 mb-2 font-bold">
                  <span>Баланс: 1,250 B</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-[65%] bg-red-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================ */}
      {/*  MARQUEE — Brand Compatibility                               */}
      {/* ============================================================ */}
      <section className="border-y border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="linear-card overflow-hidden relative rounded-xl p-8">
            <p className="text-center text-xs font-bold text-zinc-400 dark:text-white/30 mb-8 tracking-widest uppercase">
              Поддерживаем все популярные марки
            </p>

            <div
              className="group flex overflow-hidden w-full select-none gap-16"
              style={{
                maskImage:
                  "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)",
              }}
            >
              <BrandRow />
              <BrandRow ariaHidden />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURES — Why Choose Red Charge?                           */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto pt-24 px-6 pb-24">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white mb-4">
            Почему выбирают Red Charge?
          </h2>
          <p className="text-lg font-light text-zinc-500 dark:text-white/60 max-w-xl">
            Мы создали сервис, который делает зарядку электромобиля такой же
            простой, как заправку бензином.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* First 3 feature cards */}
          {features.map((f) => (
            <div
              key={f.title}
              className={`${f.colSpan} linear-card rounded-2xl p-8 relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-900/10 transition-all duration-300`}
            >
              {f.colSpan && (
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[80px] rounded-full group-hover:bg-red-600/10 transition-colors duration-500" />
              )}
              <div className="relative z-10">
                <div
                  className={`w-12 h-12 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center mb-6 ${f.iconColor}`}
                >
                  <Icon icon={f.icon} width={28} />
                </div>
                <h3 className="text-lg text-zinc-900 dark:text-white font-bold mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-white/60 max-w-md leading-relaxed font-medium">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}

          {/* Payment Card (wide) */}
          <div className="md:col-span-2 linear-card rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-900/10 transition-all duration-300">
            <div className="flex-1">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center mb-6 text-red-600">
                <Icon icon="solar:card-linear" width={28} />
              </div>
              <h3 className="text-xl text-zinc-900 dark:text-white font-bold mb-2">
                Любой способ оплаты
              </h3>
              <p className="text-sm text-zinc-500 dark:text-white/60 leading-relaxed max-w-sm font-medium">
                Visa, MasterCard, Элкарт, MBANK, О!Деньги. Платите в приложении
                в один клик.
              </p>
            </div>
            {/* Mini payment UI */}
            <div className="w-full md:w-72 bg-white dark:bg-black/40 rounded-xl border border-zinc-200 dark:border-white/5 p-5 relative shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-white/5 pb-3">
                <span className="text-xs text-zinc-500 dark:text-white/40 font-semibold">
                  Способ оплаты
                </span>
                <span className="text-xs text-zinc-900 dark:text-white font-bold">
                  Visa &bull;&bull; 4242
                </span>
              </div>
              <button className="w-full bg-red-600 text-white text-xs py-2.5 rounded-lg font-bold hover:bg-red-500 transition-colors">
                Оплатить 588 сом
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  3 STEPS + MAP                                               */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white mb-12 text-center md:text-left">
          Зарядка в 3 шага
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Map Visualization */}
          <div className="linear-card rounded-3xl overflow-hidden h-[400px] lg:h-[500px] relative group border border-zinc-200 dark:border-white/10 shadow-lg">
            {/* Abstract Map Pattern */}
            <div className="absolute inset-0 map-pattern opacity-60" />
            {/* Radial fade */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-[#0A0E17]/20" />

            {/* Abstract roads */}
            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none stroke-zinc-400 dark:stroke-zinc-600" strokeWidth={2}>
              <path d="M-10 100 Q 100 120 200 80 T 400 150 T 600 100" fill="none" />
              <path d="M50 400 Q 150 300 250 350 T 450 300" fill="none" />
              <path d="M300 -10 L 320 600" fill="none" />
              <path d="M100 200 L 500 250" fill="none" />
            </svg>

            {/* Current location */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-4 h-4 bg-blue-500 border-2 border-white dark:border-[#0A0E17] rounded-full shadow-lg" />
              </div>
              <div className="bg-white dark:bg-zinc-800 px-3 py-1 rounded-full shadow-lg text-[10px] font-bold text-zinc-800 dark:text-white mt-[-10px] z-20 border border-zinc-100 dark:border-zinc-700">
                Вы здесь
              </div>
            </div>

            {/* Charging point pins */}
            <div className="absolute top-[30%] left-[30%] group-hover:scale-110 transition-transform duration-300">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
              <Icon
                icon="solar:map-point-bold"
                width={30}
                className="relative text-red-600 drop-shadow-md"
              />
            </div>
            <div className="absolute top-[20%] right-[25%] group-hover:scale-110 transition-transform duration-300">
              <span
                className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"
                style={{ animationDuration: "2s" }}
              />
              <Icon
                icon="solar:map-point-bold"
                width={30}
                className="relative text-red-600 drop-shadow-md"
              />
            </div>
            <div className="absolute bottom-[25%] left-[45%] group-hover:scale-110 transition-transform duration-300">
              <span
                className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"
                style={{ animationDuration: "1.5s" }}
              />
              <Icon
                icon="solar:map-point-bold"
                width={30}
                className="relative text-red-600 drop-shadow-md"
              />
            </div>

            {/* Overlay card */}
            <div className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-4 rounded-xl border border-zinc-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-500 dark:text-white/60 font-medium">
                  Ближайшая станция
                </div>
                <div className="text-sm font-bold text-zinc-900 dark:text-white">
                  ул. Ахунбаева, 128
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-md">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold">Свободно</span>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="flex flex-col justify-center">
            <div className="relative pl-8 border-l border-zinc-300 dark:border-white/20 space-y-12">
              {steps.map((step) => (
                <div key={step.title} className="relative group">
                  <div
                    className={`absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-white dark:bg-black border-2 flex items-center justify-center z-10 ${step.active
                        ? "border-red-500"
                        : "border-zinc-300 dark:border-zinc-700 group-hover:border-red-500"
                      } transition-colors`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${step.active
                          ? "bg-red-500"
                          : "bg-zinc-300 dark:bg-zinc-700 group-hover:bg-red-500"
                        } transition-colors`}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-red-500 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-zinc-500 dark:text-white/60 leading-relaxed text-sm font-medium">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 pl-8">
              <Link
                to="/install"
                className="btn shine-button bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 h-12 px-8 !rounded-full text-[15px] gap-2 w-fit"
              >
                Начать пользоваться
                <Icon icon="solar:arrow-right-linear" width={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TARIFFS                                                     */}
      {/* ============================================================ */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-3xl font-semibold tracking-tight text-left text-zinc-900 dark:text-white mb-12">
            Тарифы
          </h2>

          <div className="w-full">
            <div className="linear-card rounded-2xl overflow-hidden shadow-lg backdrop-blur-md">
              {/* Header */}
              <div className="grid grid-cols-3 bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10 py-4 px-6 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40">
                <div>Тип</div>
                <div>Время</div>
                <div>Цена</div>
              </div>

              {/* Day Row */}
              <div className="grid grid-cols-3 py-6 px-6 border-b border-zinc-200 dark:border-white/5 items-center hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors bg-white dark:bg-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-500/10 flex items-center justify-center text-yellow-600 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-500/20">
                    <Icon icon="solar:sun-2-linear" width={18} />
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    Дневной
                  </span>
                </div>
                <div className="text-sm text-zinc-600 dark:text-white/60 font-medium">
                  06:00 - 23:00
                </div>
                <div className="text-sm font-bold text-zinc-900 dark:text-white">
                  15 сом
                  <span className="font-medium text-zinc-400 dark:text-white/30 text-xs">
                    /кВтч
                  </span>
                </div>
              </div>

              {/* Night Row */}
              <div className="grid grid-cols-3 py-6 px-6 items-center bg-indigo-50/60 dark:bg-indigo-500/[0.03] hover:bg-indigo-50 dark:hover:bg-indigo-500/[0.05] transition-colors border-l-4 border-indigo-500">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                    <Icon icon="solar:moon-stars-linear" width={16} />
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    Ночной
                  </span>
                </div>
                <div className="text-sm text-zinc-600 dark:text-white/60 font-medium">
                  23:00 - 06:00
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    12 сом
                    <span className="font-medium text-zinc-400 dark:text-white/30 text-xs">
                      /кВтч
                    </span>
                  </span>
                  <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-500/10 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-500/20">
                    -20%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOR BUSINESS                                                */}
      {/* ============================================================ */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-left text-zinc-900 dark:text-white mb-12">
            Для бизнеса
          </h2>

          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Corporate */}
              <div className="linear-card rounded-2xl p-8 group hover:border-red-500/40 transition-all cursor-pointer relative overflow-hidden bg-white dark:bg-zinc-900">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center mb-6 text-zinc-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
                  <Icon icon="solar:buildings-linear" width={24} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                  Корпоративные тарифы
                </h3>
                <p className="text-sm text-zinc-500 dark:text-white/60 leading-relaxed mb-8 font-medium">
                  Управление парком EV, установка лимитов для сотрудников, единая
                  отчётность и закрывающие документы.
                </p>
                <Link
                  to="/www/b2b"
                  className="flex items-center text-sm font-bold text-red-600 hover:text-red-500 transition-colors"
                >
                  Узнать больше
                  <Icon
                    icon="solar:arrow-right-linear"
                    width={16}
                    className="ml-2 group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              </div>

              {/* Partner */}
              <div className="linear-card rounded-2xl p-8 group hover:border-red-500/40 transition-all cursor-pointer relative overflow-hidden bg-white dark:bg-zinc-900">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center mb-6 text-zinc-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
                  <Icon icon="solar:hand-shake-linear" width={24} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                  Стать партнёром
                </h3>
                <p className="text-sm text-zinc-500 dark:text-white/60 leading-relaxed mb-8 font-medium">
                  Установите зарядную станцию на своей территории и получайте до
                  80% дохода от каждой зарядки.
                </p>
                <Link
                  to="/www/b2b"
                  className="flex items-center text-sm font-bold text-red-600 hover:text-red-500 transition-colors"
                >
                  Оставить заявку
                  <Icon
                    icon="solar:arrow-right-linear"
                    width={16}
                    className="ml-2 group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  DOWNLOAD APP                                                */}
      {/* ============================================================ */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="linear-card rounded-3xl p-8 md:p-0 backdrop-blur-md overflow-hidden relative border border-zinc-200 dark:border-white/10 shadow-2xl">
            {/* Decorative glow */}
            <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-red-600/5 dark:bg-red-600/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-2 items-center">
              {/* Left: Phone Mockup */}
              <div className="relative h-[400px] md:h-[550px] flex items-center justify-center bg-zinc-50 dark:bg-white/5 md:border-r border-zinc-200 dark:border-white/5 p-8">
                <div className="overflow-hidden flex flex-col transform md:scale-90 lg:scale-100 transition-transform bg-zinc-900 w-[260px] h-[520px] border-zinc-800 border-8 rounded-[3rem] relative shadow-2xl">
                  {/* Notch */}
                  <div className="h-7 w-full bg-[#0A0E17] flex justify-center items-center pt-2 z-50 relative shrink-0">
                    <div className="w-24 h-5 bg-black rounded-full" />
                  </div>

                  {/* Screen Content */}
                  <div className="flex-1 bg-[#0A0E17] text-zinc-100 relative w-full h-full overflow-hidden flex flex-col font-sans select-none">
                    {/* Energy Beams */}
                    <div className="absolute inset-0 z-0 flex justify-center overflow-hidden pointer-events-none opacity-100">
                      <div className="w-full h-full relative beams-mask">
                        <div
                          className="energy-beam w-[2px] h-[35%]"
                          style={{
                            left: "15%",
                            animation:
                              "rise-up-long 3.5s infinite linear",
                            animationDelay: "0.2s",
                          }}
                        />
                        <div
                          className="energy-beam w-[3px] h-[50%]"
                          style={{
                            left: "35%",
                            animation:
                              "rise-up-long 4.5s infinite linear",
                            animationDelay: "2.1s",
                          }}
                        />
                        <div
                          className="energy-beam w-[4px] h-[65%]"
                          style={{
                            left: "50%",
                            animation:
                              "rise-up-long 4s infinite linear",
                            animationDelay: "1s",
                          }}
                        />
                        <div
                          className="energy-beam w-[3px] h-[45%]"
                          style={{
                            left: "65%",
                            animation:
                              "rise-up-long 5s infinite linear",
                            animationDelay: "3.2s",
                          }}
                        />
                        <div
                          className="energy-beam w-[2px] h-[40%]"
                          style={{
                            left: "85%",
                            animation:
                              "rise-up-long 3.8s infinite linear",
                            animationDelay: "1.5s",
                          }}
                        />
                      </div>
                    </div>

                    {/* Header */}
                    <div className="flex shrink-0 bg-[#0A0E17]/80 z-20 border-white/5 rounded-lg border-b pt-4 pr-4 pb-2 pl-4 relative backdrop-blur-xl items-center justify-between">
                      <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                        <Icon icon="solar:arrow-left-linear" width={18} />
                      </div>
                      <h2 className="text-sm font-bold tracking-tight text-white">
                        Сессия
                      </h2>
                      <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                        <Icon icon="solar:moon-stars-linear" width={18} />
                      </div>
                    </div>

                    {/* Main scrollable content */}
                    <div className="flex-1 overflow-hidden p-3 pb-24 flex flex-col items-center relative z-10">
                      {/* Gauge */}
                      <div className="relative w-full aspect-square flex items-center justify-center my-2 max-h-[200px]">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-32 h-32 rounded-full border border-red-600/20 ripple-circle" />
                          <div
                            className="w-32 h-32 rounded-full border border-red-600/10 ripple-circle"
                            style={{ animationDelay: "1s" }}
                          />
                        </div>

                        <svg
                          className="w-48 h-48 neon-svg z-10"
                          viewBox="0 0 100 100"
                        >
                          <circle
                            className="text-zinc-800/50"
                            strokeWidth={6}
                            stroke="currentColor"
                            fill="transparent"
                            r={42}
                            cx={50}
                            cy={50}
                          />
                          <circle
                            className="text-red-600 progress-ring__circle"
                            strokeWidth={6}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r={42}
                            cx={50}
                            cy={50}
                            strokeDasharray="263.89"
                            strokeDashoffset="92.36"
                          />
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold tracking-tighter text-white drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                              65
                            </span>
                            <span className="text-sm font-medium text-red-500/80">
                              %
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-950/30 border border-red-500/20">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600" />
                            </span>
                            <span className="text-[10px] font-medium text-red-100 tracking-wide uppercase">
                              Зарядка...
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Data Grid */}
                      <div className="w-full grid grid-cols-2 gap-2 mt-2 relative z-10">
                        <div className="bg-zinc-900/40 rounded-xl border border-zinc-800 p-3 flex flex-col gap-1 backdrop-blur-sm">
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Icon
                              icon="solar:bolt-circle-linear"
                              width={14}
                            />
                            <span className="text-[10px] font-medium">
                              Энергия
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-white tracking-tight">
                            12.5{" "}
                            <span className="text-[10px] font-medium text-zinc-500">
                              кВтч
                            </span>
                          </div>
                        </div>

                        <div className="bg-zinc-900/40 rounded-xl border border-zinc-800 p-3 flex flex-col gap-1 backdrop-blur-sm">
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Icon
                              icon="solar:clock-circle-linear"
                              width={14}
                            />
                            <span className="text-[10px] font-medium">
                              Время
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-white tracking-tight">
                            00:14:32
                          </div>
                        </div>

                        <div className="bg-zinc-900/40 rounded-xl border border-zinc-800 p-3 flex flex-col gap-1 backdrop-blur-sm">
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Icon
                              icon="solar:lightning-linear"
                              width={14}
                            />
                            <span className="text-[10px] font-medium">
                              Мощность
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-white tracking-tight">
                            87{" "}
                            <span className="text-[10px] font-medium text-zinc-500">
                              кВт
                            </span>
                          </div>
                        </div>

                        <div className="bg-zinc-900/40 rounded-xl border border-zinc-800 p-3 flex flex-col gap-1 backdrop-blur-sm relative overflow-hidden">
                          <div className="absolute -right-3 -top-3 w-8 h-8 bg-red-500/10 blur-xl rounded-full" />
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Icon
                              icon="solar:wallet-money-linear"
                              width={14}
                            />
                            <span className="text-[10px] font-medium">
                              Стоимость
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-white tracking-tight">
                            187.5{" "}
                            <span className="text-[10px] font-medium text-zinc-500">
                              сом
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Charging Graph */}
                      <div className="w-full h-12 mt-4 relative opacity-50 z-10">
                        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-zinc-800" />
                        <svg
                          className="w-full h-full"
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient
                              id="gradient-mock"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="0%"
                            >
                              <stop
                                offset="0%"
                                stopColor="rgba(220, 38, 38, 0)"
                              />
                              <stop
                                offset="50%"
                                stopColor="rgba(220, 38, 38, 0.5)"
                              />
                              <stop
                                offset="100%"
                                stopColor="rgba(220, 38, 38, 0.8)"
                              />
                            </linearGradient>
                          </defs>
                          <path
                            d="M0,48 L20,45 L40,30 L60,26 L80,26 L100,25 L150,25 L200,25 L300,25"
                            fill="none"
                            stroke="url(#gradient-mock)"
                            strokeWidth={2}
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Bottom button */}
                    <div className="bg-[#0A0E17]/90 z-30 border-zinc-800 rounded-full border-t p-4 absolute right-0 bottom-0 left-0 backdrop-blur-md">
                      <div className="w-full py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-red-500 font-semibold text-xs flex items-center justify-center gap-2">
                        <Icon
                          icon="solar:stop-circle-bold"
                          width={18}
                        />
                        <span className="tracking-tight">
                          Остановить зарядку
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Content */}
              <div className="p-10 md:p-16 flex flex-col items-start justify-center h-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-bold mb-6">
                  <Icon icon="solar:smartphone-linear" width={14} />
                  Mobile App
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tight">
                  Управление зарядкой <br /> в вашем телефоне
                </h2>

                <p className="text-zinc-500 dark:text-white/60 mb-10 text-lg leading-relaxed font-light">
                  Полный контроль над процессом. Бронируйте станции, следите за
                  статусом зарядки в реальном времени и оплачивайте услуги в один
                  клик.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <button className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-80 px-6 py-3.5 rounded-xl flex items-center gap-3 transition-opacity shadow-lg">
                    <Icon icon="simple-icons:apple" width={24} />
                    <div className="text-left leading-none">
                      <div className="text-[10px] uppercase opacity-70 font-bold mb-0.5">
                        Download on the
                      </div>
                      <div className="text-sm font-bold">App Store</div>
                    </div>
                  </button>
                  <button className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-80 px-6 py-3.5 rounded-xl flex items-center gap-3 transition-opacity shadow-lg">
                    <Icon icon="simple-icons:googleplay" width={24} />
                    <div className="text-left leading-none">
                      <div className="text-[10px] uppercase opacity-70 font-bold mb-0.5">
                        Get it on
                      </div>
                      <div className="text-sm font-bold">Google Play</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
