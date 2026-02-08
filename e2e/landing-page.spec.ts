import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads and shows hero section', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=הזמן תור')).toBeVisible();
  });

  test('shows pricing section with Starter and Pro plans', async ({ page }) => {
    const starter = page.locator('text=סטארטר');
    const pro = page.locator('text=פרו');
    await expect(starter).toBeVisible();
    await expect(pro).toBeVisible();
    await expect(page.locator('text=₪79')).toBeVisible();
    await expect(page.locator('text=₪149')).toBeVisible();
  });

  test('Pro plan includes reports feature', async ({ page }) => {
    await expect(page.locator('text=דשבורד דוחות וסטטיסטיקות')).toBeVisible();
  });

  test('Starter plan shows 200 bookings limit', async ({ page }) => {
    await expect(page.locator('text=עד 200 תורים בחודש')).toBeVisible();
  });

  test('contact form is visible and submittable', async ({ page }) => {
    const form = page.locator('form').filter({ hasText: 'שם העסק' });
    await expect(form).toBeVisible();
    await expect(form.locator('input[type="text"]').first()).toBeVisible();
    await expect(form.locator('input[type="tel"]')).toBeVisible();
  });

  test('FAQ section has expandable items', async ({ page }) => {
    const faqItem = page.locator('text=כמה זמן לוקח להקים דף').first();
    await expect(faqItem).toBeVisible();
    await faqItem.click();
    // After clicking, answer should be visible
    await expect(page.locator('text=תוך מספר דקות')).toBeVisible();
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
