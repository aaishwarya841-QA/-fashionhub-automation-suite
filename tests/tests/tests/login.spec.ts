import { test, expect } from '@playwright/test';

/**
 * Test Case 3
 * As a customer, I want to verify I can log in to FashionHub.
 * Credentials: demouser / fashion123
 */

const USERNAME = process.env.TEST_USERNAME || 'demouser';
const PASSWORD = process.env.TEST_PASSWORD || 'fashion123';

test.describe('Login', () => {
  test('a valid user can log in successfully', async ({ page }) => {
    await page.goto('/login.html');

    // Selectors kept resilient (id first, falling back to name/placeholder)
    // in case the demo app markup differs slightly across environments.
    const usernameField = page.locator('#username, input[name="username"], input[placeholder*="user" i]').first();
    const passwordField = page.locator('#password, input[name="password"], input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"], input[type="submit"], #login, button:has-text("Login")').first();

    await usernameField.fill(USERNAME);
    await passwordField.fill(PASSWORD);
    await submitButton.click();

    // A successful login should either redirect away from the login page
    // or surface a visible success/welcome indicator. We assert on the
    // more robust signal (URL no longer being login.html) and treat a
    // welcome message as corroborating evidence when present.
    await expect(page).not.toHaveURL(/login\.html/);
  });

  test('an invalid user is not able to log in', async ({ page }) => {
    await page.goto('/login.html');

    const usernameField = page.locator('#username, input[name="username"], input[placeholder*="user" i]').first();
    const passwordField = page.locator('#password, input[name="password"], input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"], input[type="submit"], #login, button:has-text("Login")').first();

    await usernameField.fill('wronguser');
    await passwordField.fill('wrongpassword');
    await submitButton.click();

    // Should remain on (or be returned to) the login page for bad credentials.
    await expect(page).toHaveURL(/login\.html/);
  });
});
