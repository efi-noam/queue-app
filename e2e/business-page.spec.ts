import { test, expect } from '@playwright/test';

const BUSINESS_SLUG = 'david-david';
const BUSINESS_NAME = 'דוד דוד ברבר';

test.describe('Business Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/${BUSINESS_SLUG}`);
  });

  test('loads with correct business name', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(BUSINESS_NAME);
  });

  test('shows business description', async ({ page }) => {
    await expect(page.locator('text=על העסק')).toBeVisible();
  });

  test('shows address', async ({ page }) => {
    // Address is rendered as a link to Google Maps
    await expect(page.locator('a[href*="maps"]').first()).toBeVisible();
  });

  test('shows CTA booking button', async ({ page }) => {
    const bookButton = page.locator('text=הזמן תור עכשיו');
    await expect(bookButton).toBeVisible();
  });

  test('shows phone call button', async ({ page }) => {
    const callButton = page.locator('text=התקשר');
    await expect(callButton).toBeVisible();
  });

  test('shows share button', async ({ page }) => {
    const shareButton = page.locator('text=שתף');
    await expect(shareButton).toBeVisible();
  });

  test('shows gallery section with images', async ({ page }) => {
    const gallery = page.locator('text=גלריה');
    await expect(gallery).toBeVisible();
  });

  test('book button navigates to booking flow', async ({ page }) => {
    await page.click('text=הזמן תור עכשיו');
    await expect(page).toHaveURL(new RegExp(`/${BUSINESS_SLUG}/book`));
  });

  test('nav bar is visible and has correct links', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    await expect(nav.locator('text=דף עסק')).toBeVisible();
    await expect(nav.locator('text=הזמן תור')).toBeVisible();
    await expect(nav.locator('text=התורים שלי')).toBeVisible();
  });
});

test.describe('Business Page - Nav Bar Position', () => {
  test('nav bar stays at bottom after scrolling', async ({ page }) => {
    await page.goto(`/${BUSINESS_SLUG}`);
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Nav should still be visible and at the bottom
    await expect(nav).toBeVisible();
    const box = await nav.boundingBox();
    const viewport = page.viewportSize();
    expect(box).toBeTruthy();
    expect(box!.y + box!.height).toBeGreaterThan(viewport!.height - 5);
  });
});

test.describe('Business Page - Dark Mode', () => {
  test('renders with theme classes', async ({ page }) => {
    await page.goto(`/${BUSINESS_SLUG}`);
    const root = page.locator('div.min-h-screen').first();
    const classes = await root.getAttribute('class');
    expect(classes).toBeTruthy();
    expect(classes!).toMatch(/bg-/);
  });

  test('headings are visible (not dark text on dark bg)', async ({ page }) => {
    await page.goto(`/${BUSINESS_SLUG}`);
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    const color = await h1.evaluate(el => getComputedStyle(el).color);
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      const brightness = (r + g + b) / 3;
      expect(brightness).toBeGreaterThan(100);
    }
  });
});

test.describe('Business Page - 404', () => {
  test('returns 404 for non-existent business', async ({ page }) => {
    const response = await page.goto('/this-business-does-not-exist-12345');
    expect(response?.status()).toBe(404);
  });
});
