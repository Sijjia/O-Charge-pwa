import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface PageLayoutProps {
  children: ReactNode;
  hasBottomAction?: boolean; // Если есть фиксированная кнопка внизу
  className?: string;
}

export function PageLayout({
  children,
  hasBottomAction = false,
  className = "",
}: PageLayoutProps) {
  const location = useLocation();

  // Страницы без bottom navigation
  const noBottomNav = location.pathname.startsWith("/auth");

  // Динамический отступ через CSS переменную --nav-height
  // hasBottomAction добавляет 80px для фиксированной кнопки
  const paddingBottom = noBottomNav
    ? undefined
    : hasBottomAction
      ? "calc(var(--nav-height) + 96px)"
      : "calc(var(--nav-height) + 16px)";

  return (
    <div
      className={`min-h-screen ${className}`}
      style={paddingBottom ? { paddingBottom } : undefined}
    >
      {children}
    </div>
  );
}
