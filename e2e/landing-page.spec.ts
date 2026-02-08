import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads and shows hero section', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
  });

  test('shows pricing section with Starter and Pro plans', async ({ page }) => {
    await expect(page.locator('text=סטארטר')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'פרו' })).toBeVisible();
    // Prices are rendered inside spans
    await expect(page.locator('span:has-text("₪79")')).toBeVisible();
    await expect(page.locator('span:has-text("₪149")')).toBeVisible();
  });

  test('Pro plan includes reports feature', async ({ page }) => {
    await expect(page.locator('text=דשבורד דוחות וסטטיסטיקות')).toBeVisible();
  });

  test('Starter plan shows 200 bookings limit', async ({ page }) => {
    await expect(page.locator('text=עד 200 תורים בחודש')).toBeVisible();
  });

  test('contact form is visible', async ({ page }) => {
    // Scroll to contact section
    await page.locator('#contact').scrollIntoViewIfNeeded();
    const form = page.locator('form');
    await expect(form.first()).toBeVisible();
    await expect(page.locator('input[placeholder="שם העסק"]')).toBeVisible();
  });

  test('FAQ section has expandable items', async ({ page }) => {
    // Scroll to FAQ section
    await page.locator('#faq').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const faqItem = page.locator('text=כמה זמן לוקח להקים את המערכת?').first();
    await expect(faqItem).toBeVisible();
  });

  test('demo link points to david-david', async ({ page }) => {
    const demoLink = page.locator('a[href="/david-david"]').first();
    await expect(demoLink).toBeVisible();
  });

  test('social proof section shows stats', async ({ page }) => {
    await expect(page.locator('text=עסקים פעילים')).toBeVisible();
    await expect(page.locator('text=תורים שנקבעו')).toBeVisible();
  });
});
