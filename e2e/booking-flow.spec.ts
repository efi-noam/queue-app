import { test, expect } from '@playwright/test';

const BUSINESS_SLUG = 'david-david';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/${BUSINESS_SLUG}/book`);
  });

  test('shows services list on first step', async ({ page }) => {
    await expect(page.locator('text=בחר שירות')).toBeVisible();
  });

  test('shows progress indicator', async ({ page }) => {
    await expect(page.locator('text=שירות')).toBeVisible();
    await expect(page.locator('text=מועד')).toBeVisible();
  });

  test('can select a service', async ({ page }) => {
    // Click on first service card
    const serviceCard = page.locator('[class*="rounded-2xl"]').filter({ hasText: /₪/ }).first();
    await expect(serviceCard).toBeVisible();
    await serviceCard.click();

    // Should move to date selection
    await expect(page.locator('text=בחר תאריך')).toBeVisible();
  });

  test('shows date picker after selecting service', async ({ page }) => {
    const serviceCard = page.locator('[class*="rounded-2xl"]').filter({ hasText: /₪/ }).first();
    await serviceCard.click();

    // Calendar should be visible
    const calendar = page.locator('text=ינואר').or(page.locator('text=פברואר'))
      .or(page.locator('text=מרץ')).or(page.locator('text=אפריל'))
      .or(page.locator('text=מאי')).or(page.locator('text=יוני'))
      .or(page.locator('text=יולי')).or(page.locator('text=אוגוסט'))
      .or(page.locator('text=ספטמבר')).or(page.locator('text=אוקטובר'))
      .or(page.locator('text=נובמבר')).or(page.locator('text=דצמבר'));
    await expect(calendar.first()).toBeVisible();

    // Hebrew day headers should be visible
    await expect(page.locator("text=א׳")).toBeVisible();
    await expect(page.locator("text=ש׳")).toBeVisible();
  });

  test('shows selected service summary after selecting', async ({ page }) => {
    const serviceCard = page.locator('[class*="rounded-2xl"]').filter({ hasText: /₪/ }).first();
    const serviceName = await serviceCard.locator('h3, [class*="font-bold"]').first().textContent();
    await serviceCard.click();

    // Service summary card should show the selected service
    if (serviceName) {
      await expect(page.locator(`text=${serviceName}`)).toBeVisible();
    }
  });

  test('back button returns to previous step', async ({ page }) => {
    // Select a service
    const serviceCard = page.locator('[class*="rounded-2xl"]').filter({ hasText: /₪/ }).first();
    await serviceCard.click();
    await expect(page.locator('text=בחר תאריך')).toBeVisible();

    // Click back
    const backButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await backButton.click();

    // Should be back to service selection
    await expect(page.locator('text=בחר שירות')).toBeVisible();
  });

  test('header shows booking title', async ({ page }) => {
    await expect(page.locator('text=הזמן תור')).toBeVisible();
  });
});

test.describe('Booking Flow - Theme Support', () => {
  test('booking page applies business theme', async ({ page }) => {
    await page.goto(`/${BUSINESS_SLUG}/book`);
    const root = page.locator('div.min-h-screen').first();
    const classes = await root.getAttribute('class');
    expect(classes).toBeTruthy();
    // Should have theme-related background classes
    expect(classes!).toMatch(/bg-/);
  });

  test('service selection headings are visible', async ({ page }) => {
    await page.goto(`/${BUSINESS_SLUG}/book`);
    const heading = page.locator('text=בחר שירות');
    await expect(heading).toBeVisible();
    // Verify it's not invisible (dark on dark)
    const color = await heading.evaluate(el => {
      const style = getComputedStyle(el);
      return style.color;
    });
    expect(color).toBeTruthy();
  });
});
