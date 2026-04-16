/**
 * SSO Service — PKCE + Keycloak redirect logic
 * Handles Authorization Code flow with PKCE for staff login.
 */

const KEYCLOAK_BASE_URL = (import.meta.env["VITE_KEYCLOAK_BASE_URL"] as string) || "https://sso.asystem.kg";
const KEYCLOAK_REALM = (import.meta.env["VITE_KEYCLOAK_REALM"] as string) || "asystem";
const KEYCLOAK_CLIENT_ID = (import.meta.env["VITE_KEYCLOAK_CLIENT_ID"] as string) || "redpetroleum";

export const SSO_ENABLED = import.meta.env["VITE_SSO_ENABLED"] === "true";

const SSO_STATE_KEY = "sso_state";
const SSO_VERIFIER_KEY = "sso_code_verifier";

const API_BASE = import.meta.env.PROD
  ? (import.meta.env["VITE_API_URL"] as string | undefined) || ""
  : "";

// ========== PKCE Helpers ==========

function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest("SHA-256", encoder.encode(plain));
}

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function generateCodeVerifier(): Promise<string> {
  return generateRandomString(64);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = await sha256(verifier);
  return base64urlEncode(hash);
}

// ========== SSO Flow ==========

export async function startSSOLogin(): Promise<void> {
  const verifier = await generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = generateRandomString(32);

  // Save to sessionStorage for callback validation
  sessionStorage.setItem(SSO_VERIFIER_KEY, verifier);
  sessionStorage.setItem(SSO_STATE_KEY, state);

  const redirectUri = `${window.location.origin}/auth/sso/callback`;

  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: redirectUri,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  const authUrl = `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth?${params}`;
  window.location.href = authUrl;
}

export function getSSOCallbackParams(): { code: string | null; state: string | null } {
  const params = new URLSearchParams(window.location.search);
  return {
    code: params.get("code"),
    state: params.get("state"),
  };
}

export function validateSSOState(receivedState: string): boolean {
  const savedState = sessionStorage.getItem(SSO_STATE_KEY);
  return savedState !== null && savedState === receivedState;
}

export function getSSOCodeVerifier(): string | null {
  return sessionStorage.getItem(SSO_VERIFIER_KEY);
}

export function clearSSOState(): void {
  sessionStorage.removeItem(SSO_STATE_KEY);
  sessionStorage.removeItem(SSO_VERIFIER_KEY);
}

// ========== Backend Exchange ==========

export interface SSOExchangeResult {
  success: boolean;
  user_type?: string;
  user_id?: string;
  role?: string;
  admin_id?: string | null;
  error?: string;
  message?: string;
}

export async function exchangeSSOCode(
  code: string,
  codeVerifier: string,
): Promise<SSOExchangeResult> {
  const redirectUri = `${window.location.origin}/auth/sso/callback`;

  const resp = await fetch(`${API_BASE}/api/v1/auth/sso/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    }),
  });

  return resp.json();
}
