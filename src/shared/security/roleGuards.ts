import type {
  UnifiedUser,
  UserRole,
} from "@/features/auth/types/unified.types";

export function hasAnyRole(
  user: UnifiedUser | null,
  allowed: ReadonlyArray<UserRole>,
): boolean {
  if (!user || !user.roles || user.roles.length === 0) return false;
  return user.roles.some((r) => allowed.includes(r));
}

export function hasAllRoles(
  user: UnifiedUser | null,
  required: ReadonlyArray<UserRole>,
): boolean {
  if (!user || !user.roles || user.roles.length === 0) return false;
  return required.every((r) => user.roles!.includes(r));
}
