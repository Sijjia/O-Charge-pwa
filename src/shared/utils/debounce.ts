/**
 * Debounce utility - delays function execution until after wait time has elapsed
 * since the last invocation.
 *
 * Use cases:
 * - Search input: Wait for user to stop typing
 * - Window resize: Wait for user to finish resizing
 * - Auto-save: Wait for user to stop editing
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns Debounced function
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
/* eslint-enable @typescript-eslint/no-explicit-any */
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Throttle utility - limits function execution to at most once per wait period.
 * The function is executed immediately on first call, then subsequent calls are
 * throttled until wait time has passed.
 *
 * Use cases:
 * - Scroll handlers: Limit scroll event processing
 * - Slider changes: Limit state updates during dragging
 * - Mouse move: Limit expensive position calculations
 *
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to throttle
 * @returns Throttled function
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
/* eslint-enable @typescript-eslint/no-explicit-any */
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    // Clear any pending timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (timeSinceLastCall >= wait) {
      // Execute immediately if enough time has passed
      lastCallTime = now;
      func(...args);
    } else {
      // Schedule execution for the remaining time
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        func(...args);
        timeoutId = null;
      }, wait - timeSinceLastCall);
    }
  };
}
