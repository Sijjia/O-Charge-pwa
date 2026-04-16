/**
 * Hook to detect current panel base path (/owner or /admin).
 * Allows pages to be reused in both Owner and Admin panels.
 */
import { useLocation } from "react-router-dom";

export function usePanelBase(): string {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return "/admin";
  return "/owner";
}
