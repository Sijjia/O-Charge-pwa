import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

export function FAQPage() {
  return (
    <>
      <style>{`
        details[open] summary ~ * { animation: sweep .3s ease-in-out; }
        @keyframes sweep { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
      `}</style>

      <main className="flex-1 container mx-auto px-4 py-8 lg:py-12 max-w-3xl">

        {/* Header Section */}
        <div className="mb-10 text-center animate-enter" style={{ animationDelay: "0s" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Поддержка</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight mb-3 text-zinc-900 dark:text-white">Частые вопросы</h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">Найдите ответы на самые популярные вопросы о работе сервиса Red Petroleum EV.</p>
        </div>

        {/* FAQ List */}
        <div className="space-y-3 animate-enter" style={{ animationDelay: "0.1s" }}>

          {/* Item 1 (Open by default) */}
          <details className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden [&[open]]:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300" open>
            <summary className="flex items-center justify-between p-5 cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
              <h3 className="text-base font-medium text-zinc-900 dark:text-white pr-4">Как начать зарядку?</h3>
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-open:bg-red-50 dark:group-open:bg-red-500/10 group-open:text-red-600 dark:group-open:text-red-500 transition-all duration-300">
                <Icon icon="solar:alt-arrow-down-linear" width={18} className="transition-transform duration-300 group-open:rotate-180" />
              </div>
            </summary>
            <div className="px-5 pb-6 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-dashed border-zinc-200 dark:border-zinc-800/50 mt-1 pt-4">
              <ol className="space-y-3 list-decimal list-inside marker:text-zinc-400 dark:marker:text-zinc-600 marker:font-medium">
                <li className="pl-1">Скачайте приложение <strong className="text-zinc-900 dark:text-white font-medium">Red Petroleum EV</strong> в App Store или Google Play.</li>
                <li className="pl-1">Зарегистрируйтесь используя ваш номер телефона.</li>
                <li className="pl-1">Пополните баланс через кошелек <span className="text-zinc-900 dark:text-white">Namba One</span> или банковской картой.</li>
                <li className="pl-1">Найдите свободную станцию на карте в приложении или отсканируйте QR-код на самом терминале.</li>
                <li className="pl-1">Подключите кабель к вашему электромобилю и нажмите «Старт» в приложении.</li>
              </ol>
            </div>
          </details>

          {/* Item 2 */}
          <details className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden [&[open]]:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300">
            <summary className="flex items-center justify-between p-5 cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
              <h3 className="text-base font-medium text-zinc-900 dark:text-white pr-4">Какие коннекторы поддерживаются?</h3>
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-open:bg-red-50 dark:group-open:bg-red-500/10 group-open:text-red-600 dark:group-open:text-red-500 transition-all duration-300">
                <Icon icon="solar:alt-arrow-down-linear" width={18} className="transition-transform duration-300 group-open:rotate-180" />
              </div>
            </summary>
            <div className="px-5 pb-6 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-dashed border-zinc-200 dark:border-zinc-800/50 mt-1 pt-4">
              <p>На наших станциях установлены самые популярные типы коннекторов: <strong className="text-zinc-900 dark:text-white">GB/T (DC)</strong> для быстрой зарядки китайских электромобилей, а также <strong className="text-zinc-900 dark:text-white">Type 2</strong> и <strong className="text-zinc-900 dark:text-white">CCS2</strong>. Пожалуйста, используйте фильтр в приложении, чтобы найти станцию, подходящую именно для вашего автомобиля.</p>
            </div>
          </details>

          {/* Item 3 */}
          <details className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden [&[open]]:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300">
            <summary className="flex items-center justify-between p-5 cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
              <h3 className="text-base font-medium text-zinc-900 dark:text-white pr-4">Что такое резервирование средств?</h3>
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-open:bg-red-50 dark:group-open:bg-red-500/10 group-open:text-red-600 dark:group-open:text-red-500 transition-all duration-300">
                <Icon icon="solar:alt-arrow-down-linear" width={18} className="transition-transform duration-300 group-open:rotate-180" />
              </div>
            </summary>
            <div className="px-5 pb-6 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-dashed border-zinc-200 dark:border-zinc-800/50 mt-1 pt-4">
              <p>Перед началом сессии система может временно заблокировать (зарезервировать) определенную сумму на вашем счете для гарантии оплаты. После завершения зарядки разница между зарезервированной суммой и фактической стоимостью услуги мгновенно возвращается на ваш баланс.</p>
            </div>
          </details>

          {/* Item 4 */}
          <details className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden [&[open]]:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300">
            <summary className="flex items-center justify-between p-5 cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
              <h3 className="text-base font-medium text-zinc-900 dark:text-white pr-4">Как работает ночной тариф?</h3>
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-open:bg-red-50 dark:group-open:bg-red-500/10 group-open:text-red-600 dark:group-open:text-red-500 transition-all duration-300">
                <Icon icon="solar:alt-arrow-down-linear" width={18} className="transition-transform duration-300 group-open:rotate-180" />
              </div>
            </summary>
            <div className="px-5 pb-6 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-dashed border-zinc-200 dark:border-zinc-800/50 mt-1 pt-4">
              <p>Ночной тариф действует с <strong className="text-zinc-900 dark:text-white">00:00 до 07:00</strong>. В это время стоимость киловатт-часа снижена. Если ваша зарядная сессия началась до наступления ночного времени и продолжилась после, тарификация изменится автоматически в момент перехода времени.</p>
            </div>
          </details>

          {/* Item 5 */}
          <details className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden [&[open]]:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300">
            <summary className="flex items-center justify-between p-5 cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
              <h3 className="text-base font-medium text-zinc-900 dark:text-white pr-4">Можно ли зарядиться без приложения?</h3>
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-open:bg-red-50 dark:group-open:bg-red-500/10 group-open:text-red-600 dark:group-open:text-red-500 transition-all duration-300">
                <Icon icon="solar:alt-arrow-down-linear" width={18} className="transition-transform duration-300 group-open:rotate-180" />
              </div>
            </summary>
            <div className="px-5 pb-6 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-dashed border-zinc-200 dark:border-zinc-800/50 mt-1 pt-4">
              <p>На данный момент запуск сессии возможен только через мобильное приложение Red Petroleum EV. Это необходимо для корректного учета потребленной энергии, безопасной оплаты и сохранения истории ваших зарядок.</p>
            </div>
          </details>

          {/* Item 6 */}
          <details className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden [&[open]]:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300">
            <summary className="flex items-center justify-between p-5 cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
              <h3 className="text-base font-medium text-zinc-900 dark:text-white pr-4">Как стать корпоративным клиентом?</h3>
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-open:bg-red-50 dark:group-open:bg-red-500/10 group-open:text-red-600 dark:group-open:text-red-500 transition-all duration-300">
                <Icon icon="solar:alt-arrow-down-linear" width={18} className="transition-transform duration-300 group-open:rotate-180" />
              </div>
            </summary>
            <div className="px-5 pb-6 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-dashed border-zinc-200 dark:border-zinc-800/50 mt-1 pt-4">
              <p>Для подключения B2B-аккаунта перейдите в раздел <Link to="/www/b2b" className="text-red-600 dark:text-red-500 hover:underline">B2B</Link> на нашем сайте и заполните форму заявки. Наш менеджер свяжется с вами для заключения договора. Корпоративным клиентам доступны постоплата, единый баланс и закрывающие документы.</p>
            </div>
          </details>
        </div>

        {/* Contact Section */}
        <div className="mt-12 pt-10 border-t border-zinc-200 dark:border-zinc-800 animate-enter" style={{ animationDelay: "0.2s" }}>
          <h4 className="text-center font-medium text-zinc-900 dark:text-white mb-6">Не нашли ответ?</h4>

          <div className="grid sm:grid-cols-3 gap-4">
            <a
              href="tel:+996312000000"
              className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-900 hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 rounded-2xl transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-zinc-900 dark:text-white mb-3 shadow-sm group-hover:scale-110 transition-transform">
                <Icon icon="solar:phone-calling-linear" width={20} />
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Позвонить</span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-white whitespace-nowrap">+996 312 XXX XXX</span>
            </a>

            <a
              href="mailto:support@rp.kg"
              className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-900 hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 rounded-2xl transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-zinc-900 dark:text-white mb-3 shadow-sm group-hover:scale-110 transition-transform">
                <Icon icon="solar:letter-linear" width={20} />
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Написать Email</span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">support@rp.kg</span>
            </a>

            <a
              href="https://t.me/rpev_support"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-900 hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 rounded-2xl transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-zinc-900 dark:text-white mb-3 shadow-sm group-hover:scale-110 transition-transform">
                <Icon icon="solar:chat-round-linear" width={20} />
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Telegram</span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">@rpev_support</span>
            </a>
          </div>
        </div>

      </main>
    </>
  );
}
