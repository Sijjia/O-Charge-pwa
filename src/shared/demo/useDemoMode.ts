/**
 * Hook для проверки и управления demo-режимом
 * Demo mode активируется через sessionStorage (из SandboxPage)
 */

import { useState, useEffect, useCallback } from "react";

const DEMO_KEY = "demo_mode";
const DEMO_ROLE_KEY = "demo_role";

const DEMO_EVENT = "demo-mode-changed";

export function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState(
    () => import.meta.env['VITE_DEMO_MODE'] === 'true' || sessionStorage.getItem(DEMO_KEY) === "true",
  );
  const [demoRole, setDemoRole] = useState<string | null>(
    () => sessionStorage.getItem(DEMO_ROLE_KEY),
  );

  useEffect(() => {
    const sync = () => {
      setIsDemoMode(import.meta.env['VITE_DEMO_MODE'] === 'true' || sessionStorage.getItem(DEMO_KEY) === "true");
      setDemoRole(sessionStorage.getItem(DEMO_ROLE_KEY));
    };
    window.addEventListener(DEMO_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DEMO_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const enableDemo = useCallback((role: "client" | "partner" | "admin") => {
    sessionStorage.setItem(DEMO_KEY, "true");
    sessionStorage.setItem(DEMO_ROLE_KEY, role);
    setIsDemoMode(true);
    setDemoRole(role);
    window.dispatchEvent(new CustomEvent(DEMO_EVENT, { detail: { mode: true, role } }));
  }, []);

  const disableDemo = useCallback(() => {
    sessionStorage.removeItem(DEMO_KEY);
    sessionStorage.removeItem(DEMO_ROLE_KEY);
    setIsDemoMode(false);
    setDemoRole(null);
    window.dispatchEvent(new CustomEvent(DEMO_EVENT, { detail: { mode: false } }));
  }, []);

  return { isDemoMode, demoRole, enableDemo, disableDemo };
}

/** Imperative check (for use outside React) */
export function isDemoModeActive(): boolean {
  if (import.meta.env['VITE_DEMO_MODE'] === 'true') return true;
  try {
    return sessionStorage.getItem(DEMO_KEY) === "true";
  } catch {
    return false;
  }
}
