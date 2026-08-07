import { defineConfig, devices } from '@playwright/test';
import { resolveBaseUrl } from './utils/env-resolver';

const { baseUrl, source } = resolveBaseUrl();

// Printed once at config-load time so every run makes it obvious which
// environment/base URL was actually selected and where it came from.
// eslint-disable-next-line no-console
console.log(`[env-resolver] Running against: ${baseUrl}  (source: ${source})`);

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: baseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
