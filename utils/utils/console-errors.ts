import { Page } from '@playwright/test';

export interface CapturedError {
  type: 'console.error' | 'pageerror';
  message: string;
}

/**
 * Attaches listeners that record:
 *  - console messages of type "error"
 *  - uncaught exceptions thrown on the page (pageerror)
 *
 * Call this BEFORE navigating, then read the returned array after
 * navigation/interaction is complete.
 */
export function captureConsoleErrors(page: Page): CapturedError[] {
  const errors: CapturedError[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push({ type: 'console.error', message: msg.text() });
    }
  });

  page.on('pageerror', (err) => {
    errors.push({ type: 'pageerror', message: err.message });
  });

  return errors;
}
