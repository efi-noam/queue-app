import { test, expect } from '@playwright/test';

const BUSINESS_SLUG = 'david-david';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'test@test.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Test1234';

test.describe('Admin Login', () => {
  test('shows login form', async ({ page }) => {
    await page.goto(`/${BUSINESS_SLUG}/admin/login`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('rejects wrong credentials', async ({ page }) => {
    await page.goto(`/${BUSINESS_SLUG}/admin/login`);
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    const error = page.locator('[class*="red"]').first();
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto(`/${BUSINESS_SLUG}/admin/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(new RegExp(`/${BUSINESS_SLUG}/admin`), { timeout: 10000 });
  });
});

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/${BUSINESS_SLUG}/admin/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(new RegExp(`/${BUSINESS_SLUG}/admin`), { timeout: 10000 });
  });

  test('shows dashboard content', async ({ page }) => {
    // Dashboard shows "תורים היום" (not "תורים להיום")
    await expect(page.locator('text=תורים היום')).toBeVisible({ timeout: 5000 });
  });

  test('has navigation links to settings and schedule', async ({ page }) => {
    // Use .first() since "הגדרות" appears in multiple places
    await expect(page.locator('text=הגדרות').first()).toBeVisible();
    await expect(page.locator('text=לוח זמנים').first()).toBeVisible();
  });
});

test.describe('Admin Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/${BUSINESS_SLUG}/admin/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(new RegExp(`/${BUSINESS_SLUG}/admin`), { timeout: 10000 });

    await page.locator('text=הגדרות').first().click();
    await expect(page.locator('text=הגדרות עסק')).toBeVisible({ timeout: 5000 });
  });

  test('shows settings tabs', async ({ page }) => {
    await expect(page.locator('text=פרטים')).toBeVisible();
    await expect(page.locator('text=מראה')).toBeVisible();
    await expect(page.locator('text=שירותים')).toBeVisible();
    await expect(page.locator('text=שעות')).toBeVisible();
  });

  test('info tab shows business name input', async ({ page }) => {
    const nameInput = page.locator('input[value*="דוד"]').first();
    await expect(nameInput).toBeVisible();
  });

  test('appearance tab shows theme selector', async ({ page }) => {
    await page.click('text=מראה');
    await expect(page.locator('text=ערכת נושא')).toBeVisible();
    await expect(page.locator('text=בהיר')).toBeVisible();
    await expect(page.locator('text=כהה')).toBeVisible();
  });

  test('services tab shows service list', async ({ page }) => {
    await page.click('text=שירותים');
    await expect(page.locator('input[type="number"]').first()).toBeVisible();
  });

  test('hours tab shows business hours', async ({ page }) => {
    await page.click('text=שעות');
    // Use .first() since there are multiple day labels
    await expect(page.locator('text=ראשון').first()).toBeVisible();
  });

  test('no React hooks error on settings page', async ({ page }) => {
    const errorOverlay = page.locator('text=Rendered more hooks');
    await expect(errorOverlay).not.toBeVisible({ timeout: 3000 });
  });

  test('theme change shows success message', async ({ page }) => {
    await page.click('text=מראה');
    const themeButton = page.locator('text=אוקיינוס');
    await themeButton.click();
    await expect(page.locator('text=ערכת הנושא נשמרה')).toBeVisible({ timeout: 5000 });
  });

  test('image upload buttons are not loading initially', async ({ page }) => {
    await page.click('text=מראה');
    const uploadButtons = page.locator('button').filter({ hasText: /העלה|החלף|הוסף תמונה/ });
    const count = await uploadButtons.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const btn = uploadButtons.nth(i);
      const isDisabled = await btn.isDisabled();
      expect(isDisabled).toBe(false);
    }
  });

  test('delete service uses custom dialog not native confirm', async ({ page }) => {
    await page.click('text=שירותים');

    // Find a delete button (trash icon)
    const deleteButton = page.locator('button[class*="red"]').first();
    if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      let nativeDialogAppeared = false;
      page.on('dialog', () => { nativeDialogAppeared = true; });

      await deleteButton.click();

      // Custom dialog should appear with cancel/delete buttons
      await expect(page.locator('text=ביטול')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('text=מחק')).toBeVisible();
      expect(nativeDialogAppeared).toBe(false);

      // Click cancel to dismiss
      await page.click('text=ביטול');
    }
  });
});

test.describe('Platform Admin', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/platform-admin/login');
    await expect(page.locator('text=Queue Platform')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('successful login shows dashboard', async ({ page }) => {
    await page.goto('/platform-admin/login');
    await page.fill('input[type="email"]', process.env.TEST_PLATFORM_EMAIL || 'admin@test.com');
    await page.fill('input[type="password"]', process.env.TEST_PLATFORM_PASSWORD || 'Test1234');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/platform-admin$/, { timeout: 10000 });
  });
});
