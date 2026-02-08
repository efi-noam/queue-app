import { test, expect } from '@playwright/test';

const BUSINESS_SLUG = 'david-david';

test.describe('Customer Authentication Flow', () => {
  test('new customer sees phone input first', async ({ page }) => {
    await page.goto(`/${BUSINESS_SLUG}/book`);

    // Select service
    const serviceCard = page.locator('[class*="rounded-2xl"]').filter({ hasText: /₪/ }).first();
    await serviceCard.click();

    // Select a date (first available)
    await page.waitForTimeout(500);
    const availableDay = page.locator('button:not([disabled])').filter({ hasText: /^\d+$/ }).first();
    if (await availableDay.isVisible()) {
      await availableDay.click();

      // Wait for time slots
      await page.waitForTimeout(1000);

      // Select first available time
      const timeSlot = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first();
      if (await timeSlot.isVisible()) {
        await timeSlot.click();

        // For non-logged-in user, should show auth flow with phone input
        await expect(page.locator('input[type="tel"]')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('my appointments page redirects to login when not logged in', async ({ page }) => {
    await page.goto(`/${BUSINESS_SLUG}/my-appointments`);
    // When not logged in, the page redirects to login page
    await expect(page).toHaveURL(new RegExp(`/${BUSINESS_SLUG}/login`), { timeout: 10000 });
    // Login page should show phone input
    await expect(page.locator('input[type="tel"]')).toBeVisible();
  });
});

test.describe('Customer Login Page', () => {
  test('shows phone input', async ({ page }) => {
    await page.goto(`/${BUSINESS_SLUG}/login`);
    await expect(page.locator('input[type="tel"]')).toBeVisible();
  });
});
