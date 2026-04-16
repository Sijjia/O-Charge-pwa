import { useState } from "react";
import { Icon } from "@iconify/react";

export function ContactsPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const updateField = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <>
      <style>{`
        .input-linear { transition: all 0.2s ease; }
        .input-linear:focus {
          box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
          border-color: #DC2626;
        }
      `}</style>

      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-12 flex flex-col items-center">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-zinc-900 dark:text-white transition-colors">
            Контакты
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 transition-colors">
            Мы всегда на связи, чтобы помочь вам с зарядкой
          </p>
        </div>

        {/* Info Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Contact Methods Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col gap-6 transition-colors">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
              Связаться с нами
            </h2>

            <div className="flex flex-col gap-5">
              {/* Phone */}
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center text-zinc-900 dark:text-white shrink-0 group-hover:bg-red-50 dark:group-hover:bg-red-900/20 group-hover:text-red-600 transition-colors">
                  <Icon icon="solar:phone-calling-linear" width={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-medium mb-0.5">
                    Телефон
                  </p>
                  <a
                    href="tel:+996555000000"
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-200 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                  >
                    +996 555 000 000
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center text-zinc-900 dark:text-white shrink-0 group-hover:bg-red-50 dark:group-hover:bg-red-900/20 group-hover:text-red-600 transition-colors">
                  <Icon icon="solar:letter-linear" width={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-medium mb-0.5">
                    Email
                  </p>
                  <a
                    href="mailto:info@rp.kg"
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-200 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                  >
                    info@rp.kg
                  </a>
                </div>
              </div>

              {/* Telegram */}
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center text-zinc-900 dark:text-white shrink-0 group-hover:bg-red-50 dark:group-hover:bg-red-900/20 group-hover:text-red-600 transition-colors">
                  <Icon icon="solar:chat-round-linear" width={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-medium mb-0.5">
                    Telegram Support
                  </p>
                  <a
                    href="#"
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-200 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                  >
                    @rpev_support
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Office Info Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors">
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
                Головной офис
              </h2>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center text-zinc-900 dark:text-white shrink-0">
                  <Icon icon="solar:map-point-linear" width={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-medium mb-0.5">
                    Адрес
                  </p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                    г. Бишкек,
                    <br />
                    ул. Московская, 123
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center text-zinc-900 dark:text-white shrink-0">
                  <Icon icon="solar:clock-circle-linear" width={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-medium mb-0.5">
                    Режим работы
                  </p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                    Пн-Пт: 09:00 - 18:00
                    <br />
                    <span className="text-zinc-400 text-xs">Сб-Вс: Выходной</span>
                  </p>
                </div>
              </div>
            </div>

            <a
              href="#"
              className="mt-8 w-full flex items-center justify-center gap-2 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white py-3 rounded-xl text-xs font-semibold transition-all group"
            >
              <Icon icon="solar:map-arrow-right-bold" width={16} className="text-red-600" />
              Показать на карте 2ГИС
            </a>
          </div>
        </div>

        {/* Feedback Form Section */}
        <div className="w-full mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Форма обратной связи
            </span>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-sm transition-colors">
            <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-400 ml-1">
                    Ваше имя
                  </label>
                  <input
                    type="text"
                    placeholder="Иван Иванов"
                    value={form.name}
                    onChange={updateField("name")}
                    className="input-linear w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-400 ml-1">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    placeholder="+996 (___) __-__-__"
                    value={form.phone}
                    onChange={updateField("phone")}
                    className="input-linear w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-400 ml-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="ivan@example.com"
                  value={form.email}
                  onChange={updateField("email")}
                  className="input-linear w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-400 ml-1">
                  Сообщение
                </label>
                <textarea
                  rows={4}
                  placeholder="Опишите ваш вопрос..."
                  value={form.message}
                  onChange={updateField("message")}
                  className="input-linear w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  className="w-full md:w-auto md:px-8 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                >
                  <span>Отправить сообщение</span>
                  <Icon icon="solar:plain-linear" width={18} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Socials Section */}
        <div className="w-full flex flex-col items-center">
          <div className="flex items-center gap-4 mb-8 w-full max-w-xs">
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Социальные сети
            </span>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
          </div>

          <div className="flex gap-4">
            <a
              href="#"
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-[#E4405F] dark:hover:text-[#E4405F] hover:scale-110 hover:shadow-lg transition-all duration-300"
            >
              <Icon icon="logos:instagram-icon" width={20} className="grayscale hover:grayscale-0 transition-all" />
            </a>
            <a
              href="#"
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-[#1877F2] dark:hover:text-[#1877F2] hover:scale-110 hover:shadow-lg transition-all duration-300"
            >
              <Icon icon="logos:facebook" width={20} className="grayscale hover:grayscale-0 transition-all" />
            </a>
            <a
              href="#"
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-[#26A5E4] dark:hover:text-[#26A5E4] hover:scale-110 hover:shadow-lg transition-all duration-300"
            >
              <Icon icon="logos:telegram" width={20} className="grayscale hover:grayscale-0 transition-all" />
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
