import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import rpLogo from "@/assets/rp-logo.svg";
import { useAuthStatus } from "@/features/auth/hooks/useAuth";

const navLinks = [
  { label: "Карта", path: "/www/map" },
  { label: "Тарифы", path: "/www/tariffs" },
  { label: "B2B", path: "/www/b2b" },
  { label: "FAQ", path: "/www/faq" },
] as const;

const footerNavLinks = [
  { label: "Станции", path: "/www/map" },
  { label: "Тарифы", path: "/www/tariffs" },
  { label: "Для бизнеса", path: "/www/b2b" },
] as const;

export function WebsiteLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuthStatus();

  const isActive = (path: string) => location.pathname === path;

  const activeLinkClass = "text-zinc-900 dark:text-white font-medium";
  const inactiveLinkClass =
    "text-zinc-500 dark:text-white/60 hover:text-red-600 dark:hover:text-white font-medium text-[13px]";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0E17] transition-colors">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#0A0E17]/80 backdrop-blur-xl transition-colors duration-300">
        <div className="flex h-16 max-w-7xl mx-auto px-6 items-center justify-between">
          {/* Logo */}
          <Link to="/www" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-red-600 flex items-center justify-center">
              <img src={rpLogo} alt="RP Logo" className="w-full h-full object-cover scale-[1.2]" />
            </div>
            <span className="text-[15px] font-bold text-zinc-900 dark:text-white tracking-tight">
              Red Charge
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-[13px] transition-colors ${isActive(link.path) ? activeLinkClass : inactiveLinkClass
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle Placeholder */}
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 dark:text-white/60 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
              <Icon
                icon="solar:sun-2-linear"
                width={20}
                className="hidden dark:block"
              />
              <Icon
                icon="solar:moon-stars-linear"
                width={20}
                className="block dark:hidden"
              />
            </button>

            {/* CTA Button */}
            {!isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to="/auth"
                  className="text-[13px] font-bold text-zinc-900 dark:text-white hover:text-red-600 dark:hover:text-red-500 transition-colors"
                >
                  Войти
                </Link>
                <Link
                  to="/install"
                  className="shine-button h-8 px-4 rounded-full bg-red-600 hover:bg-red-500 text-[13px] font-semibold text-white transition-all items-center shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] flex"
                >
                  Приложение
                </Link>
              </div>
            ) : (
              <Link
                to="/"
                className="hidden sm:flex shine-button h-8 px-4 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-black text-[13px] font-semibold text-white transition-all items-center"
              >
                В приложение
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button
              className="lg:hidden w-8 h-8 flex items-center justify-center text-zinc-600 dark:text-white/60"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Icon
                icon={
                  mobileMenuOpen
                    ? "solar:close-circle-linear"
                    : "solar:hamburger-menu-linear"
                }
                width={22}
              />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#0A0E17]/95 backdrop-blur-xl px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-sm transition-colors ${isActive(link.path) ? activeLinkClass : inactiveLinkClass
                  }`}
              >
                {link.label}
              </Link>
            ))}
            {/* Auth section for mobile */}
            <div className="pt-2 mt-2 border-t border-zinc-100 dark:border-white/10">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-sm text-zinc-900 dark:text-white font-semibold"
                  >
                    Войти
                  </Link>
                  <Link
                    to="/install"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-sm text-red-600 font-semibold"
                  >
                    Скачать приложение
                  </Link>
                </>
              ) : (
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm text-zinc-900 dark:text-white font-semibold"
                >
                  В приложение
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <Outlet />

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0A0E17] pt-16 pb-12 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
            {/* Logo & Description */}
            <div className="col-span-2">
              <Link to="/www" className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-red-600 flex items-center justify-center">
                  <img src={rpLogo} alt="RP Logo" className="w-full h-full object-cover scale-[1.2]" />
                </div>
                <span className="text-[15px] font-bold text-zinc-900 dark:text-white tracking-tight">
                  Red Charge
                </span>
              </Link>
              <p className="text-[13px] text-zinc-500 dark:text-white/40 max-w-xs leading-relaxed font-medium">
                Сеть быстрых зарядных станций для электромобилей от Red
                Petroleum.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-[13px] font-bold text-zinc-900 dark:text-white mb-4 uppercase tracking-wider">
                Навигация
              </h4>
              <ul className="space-y-3 text-[13px] text-zinc-500 dark:text-white/50 font-medium">
                {footerNavLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="hover:text-red-600 dark:hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contacts */}
            <div>
              <h4 className="text-[13px] font-bold text-zinc-900 dark:text-white mb-4 uppercase tracking-wider">
                Контакты
              </h4>
              <ul className="space-y-3 text-[13px] text-zinc-500 dark:text-white/50 font-medium">
                <li>+996 555 000 000</li>
                <li>info@redcharge.kg</li>
                <li>@redcharge_support</li>
              </ul>
            </div>

            {/* App Buttons */}
            <div className="col-span-2 md:col-span-2">
              <h4 className="text-[13px] font-bold text-zinc-900 dark:text-white mb-4 uppercase tracking-wider">
                Приложение
              </h4>
              <div className="flex gap-3">
                <button className="bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 flex items-center gap-2 transition shadow-sm">
                  <Icon
                    icon="simple-icons:apple"
                    width={16}
                    className="text-zinc-900 dark:text-white"
                  />
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    App Store
                  </span>
                </button>
                <button className="bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 flex items-center gap-2 transition shadow-sm">
                  <Icon
                    icon="simple-icons:googleplay"
                    width={16}
                    className="text-zinc-900 dark:text-white"
                  />
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    Google Play
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-[12px] text-zinc-400 dark:text-white/30 mb-4 md:mb-0 font-medium">
              &copy; 2026 Red Charge by Red Petroleum. Все права защищены.
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 dark:text-white/40 hover:text-red-600 dark:hover:text-white transition-colors"
              >
                <Icon icon="simple-icons:instagram" width={18} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 dark:text-white/40 hover:text-red-600 dark:hover:text-white transition-colors"
              >
                <Icon icon="simple-icons:facebook" width={18} />
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 dark:text-white/40 hover:text-red-600 dark:hover:text-white transition-colors"
              >
                <Icon icon="simple-icons:telegram" width={18} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
