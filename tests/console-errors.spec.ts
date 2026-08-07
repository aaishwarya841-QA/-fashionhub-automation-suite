import { test, expect } from '@playwright/test';
import { captureConsoleErrors } from '../utils/console-errors';

/**
 * Test Case 1
 * As a tester, I want to make sure there are no console errors when
 * visiting the FashionHub homepage.
 */
test.describe('Console errors', () => {
  test('homepage should not produce any console or page errors', async ({ page }) => {
    const errors = captureConsoleErrors(page);

    await page.goto('/');
    // Give any lazy/async scripts a moment to run and surface errors.
    await page.waitForLoadState('networkidle');

    expect(
      errors,
      `Expected no console/page errors on homepage but found:\n${errors
        .map((e) => `  [${e.type}] ${e.message}`)
        .join('\n')}`
    ).toHaveLength(0);
  });

  /**
   * The about page ships with an intentional error (per the challenge hint).
   * This test proves the detection mechanism above actually works: it should
   * catch at least one error here, giving us confidence that a clean pass on
   * the homepage test really means "no errors" rather than "listener didn't fire".
   */
  test('about page is used to validate the detection mechanism catches known errors', async ({ page }) => {
    const errors = captureConsoleErrors(page);

    await page.goto('/about.html');
    await page.waitForLoadState('networkidle');

    expect(
      errors.length,
      'Expected the about page\'s known intentional error to be detected, but none were captured. ' +
        'This would indicate the error-capturing mechanism is broken.'
    ).toBeGreaterThan(0);
  });
});
