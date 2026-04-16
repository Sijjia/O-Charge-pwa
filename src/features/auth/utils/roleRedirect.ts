/**
 * Единый источник истины для post-login редиректов по ролям.
 * Используется в PhoneAuthForm, SSOCallbackPage, dev-login.
 */
export function getPostLoginRedirect(params: {
  userType: "client" | "owner" | "corporate";
  role?: string;
  isPartner?: boolean;
}): string {
  if (params.userType === "corporate") return "/corporate/dashboard";

  if (params.userType === "owner") {
    if (params.role === "admin" || params.role === "superadmin")
      return "/admin/dashboard";
    if (params.isPartner) return "/partner/dashboard";
    return "/owner/dashboard";
  }

  // client → карта
  return "/";
}
