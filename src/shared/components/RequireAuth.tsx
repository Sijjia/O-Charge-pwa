import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";

interface RequireAuthProps {
  children: ReactNode;
  /** "redirect" navigates to /auth; "modal" appends ?auth=required (default) */
  fallback?: "redirect" | "modal";
}

export function RequireAuth({ children, fallback = "modal" }: RequireAuthProps) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  const isInitialized = useUnifiedAuthStore((s) => s.isInitialized);
  const location = useLocation();

  if (!isInitialized) return null;

  if (!isAuthenticated) {
    if (fallback === "redirect") {
      return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
    }
    return <Navigate to={`${location.pathname}?auth=required`} replace />;
  }

  return <>{children}</>;
}
