import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

export function SupportPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Поддержка</h1>
          <p className="text-zinc-500 dark:text-gray-400 mt-1">
            Свяжитесь с нами по любым вопросам: зарядка, платежи, оборудование.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm dark:shadow-none transition-colors">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Контакты</h2>
          <div className="space-y-3">
            <a
              href="mailto:support@redpetroleum.kg"
              className="flex items-center gap-3 text-zinc-600 dark:text-gray-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <Icon icon="solar:letter-linear" width={20} className="text-red-500" />
              support@redpetroleum.kg
            </a>
            <a
              href="tel:+996559974545"
              className="flex items-center gap-3 text-zinc-600 dark:text-gray-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <Icon icon="solar:phone-linear" width={20} className="text-red-500" />
              +996 559 974 545
            </a>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm dark:shadow-none transition-colors">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Сообщить о проблеме
          </h2>
          <p className="text-sm text-zinc-500 dark:text-gray-400 mb-4">
            Опишите проблему и укажите номер станции/локации, если возможно.
          </p>
          <a
            href="mailto:support@redpetroleum.kg?subject=Red%20Petroleum%20—%20Проблема&body=Опишите%20проблему%2C%20ID%20станции%2C%20время%20и%20шаги%20для%20повторения."
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            <Icon icon="solar:chat-square-linear" width={20} />
            Написать в поддержку
          </a>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm dark:shadow-none transition-colors">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">FAQ</h2>
          <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-gray-300 space-y-2">
            <li>Как пополнить баланс и где посмотреть историю?</li>
            <li>Что делать, если зарядка не начинается?</li>
            <li>Как связаться с оператором локации?</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm dark:shadow-none transition-colors">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            Установка
          </h2>
          <p className="text-sm text-zinc-500 dark:text-gray-400 mb-4">
            Установите Red Petroleum как приложение для оффлайн‑режима и быстрого
            доступа.
          </p>
          <Link
            to="/install"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            <Icon icon="solar:alt-arrow-down-linear" width={20} />
            Установить приложение
          </Link>
        </div>
      </div>
    </div>
  );
}
