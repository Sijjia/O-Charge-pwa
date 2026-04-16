import type { ReactNode } from "react";
import type { UserRole } from "@/features/auth/types/unified.types";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";
import { hasAnyRole } from "@/shared/security/roleGuards";

interface RequireRoleProps {
  allowed: ReadonlyArray<UserRole>;
  fallback?: ReactNode;
  children: ReactNode;
}

export function RequireRole({
  allowed,
  fallback = null,
  children,
}: RequireRoleProps) {
  const user = useUnifiedAuthStore((s) => s.user);
  const owner = useUnifiedAuthStore((s) => s.owner);

  // Проверяем user.roles, а если пусто — fallback на owner.role
  const permitted =
    hasAnyRole(user, allowed) ||
    (owner?.role != null && allowed.includes(owner.role as UserRole));

  if (!permitted) return <>{fallback}</>;
  return <>{children}</>;
}
