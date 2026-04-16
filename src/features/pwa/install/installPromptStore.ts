// Lightweight store to capture beforeinstallprompt and expose prompt action
// Works alongside the floating InstallPrompt component

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

import { addBreadcrumb, captureMessage } from "@/shared/monitoring/sentry";

type Listener = () => void;

let captured: BeforeInstallPromptEvent | null = null;
const listeners: Listener[] = [];
let initialized = false;
const ignoreError = (_: unknown): void => {
  // noop
};

export function initInstallPromptCapture() {
  if (initialized) return;
  initialized = true;

  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    // @ts-expect-error iOS Safari non-standard
    window.navigator.standalone === true;
  if (isStandalone) return;

  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    captured = e as BeforeInstallPromptEvent;
    try {
      addBreadcrumb({
        category: "pwa",
        message: "beforeinstallprompt",
        level: "info",
      });
    } catch (err) {
      ignoreError(err);
    }
    tryInc("pwa_install_prompt_shown");
    notify();
  });

  window.addEventListener("appinstalled", () => {
    captured = null;
    try {
      addBreadcrumb({
        category: "pwa",
        message: "appinstalled",
        level: "info",
      });
      captureMessage("PWA appinstalled");
    } catch (err) {
      ignoreError(err);
    }
    tryInc("pwa_appinstalled");
    notify();
  });
}

export function canPromptInstall(): boolean {
  return captured != null;
}

export async function promptInstall(): Promise<
  "accepted" | "dismissed" | "unsupported"
> {
  if (!captured) return "unsupported";
  try {
    addBreadcrumb({
      category: "pwa",
      message: "promptInstall:clicked",
      level: "info",
    });
    await captured.prompt();
    const choice = await captured.userChoice;
    // Reuse of the same event is not allowed; drop reference
    captured = null;
    try {
      addBreadcrumb({
        category: "pwa",
        message: `promptInstall:${choice.outcome}`,
        level: "info",
      });
      captureMessage(`PWA install ${choice.outcome}`);
      tryInc(
        choice.outcome === "accepted"
          ? "pwa_install_accepted"
          : "pwa_install_dismissed",
      );
    } catch (err) {
      ignoreError(err);
    }
    notify();
    return choice.outcome;
  } catch {
    captured = null;
    notify();
    return "dismissed";
  }
}

export function subscribe(listener: Listener) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

function notify() {
  for (const l of [...listeners]) {
    try {
      l();
    } catch (err) {
      ignoreError(err);
    }
  }
}

function tryInc(key: string) {
  try {
    const curr = Number(localStorage.getItem(key) || "0");
    localStorage.setItem(key, String(curr + 1));
  } catch (err) {
    ignoreError(err);
  }
}
