import { Icon } from "@iconify/react";

export function DownloadAppPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16">
      {/* Hero */}
      <div className="max-w-2xl w-full text-center">
        <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-600/20">
          <Icon icon="solar:bolt-circle-bold" width={40} className="text-white" />
        </div>

        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">
          Скачайте Red Charge
        </h1>

        <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-12 max-w-md mx-auto leading-relaxed">
          Зарядка электромобиля в одно касание. Найдите станцию, начните зарядку
          через QR-код.
        </p>

        {/* Install Options */}
        <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-16">
          <a
            href="/"
            className="flex items-center gap-4 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black p-4 rounded-2xl transition-colors shadow-lg"
          >
            <Icon icon="solar:smartphone-bold-duotone" width={32} />
            <div className="text-left">
              <div className="text-xs opacity-70">Открыть</div>
              <div className="text-sm font-semibold">Веб-приложение</div>
            </div>
          </a>

          <button
            onClick={() => {
              const evt = new Event("beforeinstallprompt");
              window.dispatchEvent(evt);
            }}
            className="flex items-center gap-4 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 transition-colors shadow-lg"
          >
            <Icon icon="solar:download-minimalistic-bold-duotone" width={32} />
            <div className="text-left">
              <div className="text-xs text-zinc-500">Установить</div>
              <div className="text-sm font-semibold">PWA на телефон</div>
            </div>
          </button>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
          {[
            {
              icon: "solar:map-point-wave-bold-duotone",
              title: "Карта станций",
              desc: "Все зарядные станции на интерактивной карте",
            },
            {
              icon: "solar:qr-code-bold-duotone",
              title: "QR-код",
              desc: "Начните зарядку, отсканировав QR на станции",
            },
            {
              icon: "solar:wallet-money-bold-duotone",
              title: "Баланс",
              desc: "Пополняйте баланс и отслеживайте расходы",
            },
          ].map((f) => (
            <div key={f.title} className="text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon icon={f.icon} width={24} className="text-red-500" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                {f.title}
              </h3>
              <p className="text-xs text-zinc-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
