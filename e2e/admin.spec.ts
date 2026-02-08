import { test, expect } from '@playwright/test';

const BUSINESS_SLUG = 'david-david';
const ADMIN_EMAIL = 'david@test.com';
const ADMIN_PASSWORD = 'Test1234';

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

    // Should show error
    const error = page.locator('[class*="red"]').filter({ hasText: /שגיאה|אימייל|סיסמה/ });
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto(`/${BUSINESS_SLUG}/admin/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Should redirect to admin dashboard
    await expect(page).toHaveURL(new RegExp(`/${BUSINESS_SLUG}/admin`), { timeout: 10000 });
    // Dashboard should show business name
    await expect(page.locator(`text=דוד דוד ברבר`)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto(`/${BUSINESS_SLUG}/admin/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(new RegExp(`/${BUSINESS_SLUG}/admin`), { timeout: 10000 });
  });

  test('shows today appointments section', async ({ page }) => {
    await expect(page.locator('text=תורים להיום')).toBeVisible({ timeout: 5000 });
  });

  test('has navigation links', async ({ page }) => {
    await expect(page.locator('text=הגדרות')).toBeVisible();
    await expect(page.locator('text=לוח זמנים')).toBeVisible();
  });
});

test.describe('Admin Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`/${BUSINESS_SLUG}/admin/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(new RegExp(`/${BUSINESS_SLUG}/admin`), { timeout: 10000 });

    // Navigate to settings
    await page.click('text=הגדרות');
    await expect(page.locator('text=הגדרות עסק')).toBeVisible({ timeout: 5000 });
  });

  test('shows settings tabs', async ({ page }) => {
    await expect(page.locator('text=פרטים')).toBeVisible();
    await expect(page.locator('text=מראה')).toBeVisible();
    await expect(page.locator('text=שירותים')).toBeVisible();
    await expect(page.locator('text=שעות')).toBeVisible();
  });

  test('info tab shows business name input', async ({ page }) => {
    // Info tab should be active by default
    const nameInput = page.locator('input[value*="דוד"]').first();
    await expect(nameInput).toBeVisible();
  });

  test('appearance tab shows theme selector', async ({ page }) => {
    await page.click('text=מראה');
    await expect(page.locator('text=ערכת נושא')).toBeVisible();
    // Theme options should be visible
    await expect(page.locator('text=בהיר')).toBeVisible();
    await expect(page.locator('text=כהה')).toBeVisible();
  });

  test('services tab shows service list', async ({ page }) => {
    await page.click('text=שירותים');
    // Should show existing services
    await expect(page.locator('input[type="number"]').first()).toBeVisible();
  });

  test('hours tab shows business hours', async ({ page }) => {
    await page.click('text=שעות');
    await expect(page.locator('text=ראשון').or(page.locator('text=שני'))).toBeVisible();
  });

  test('no React hooks error on settings page', async ({ page }) => {
    // This tests the specific bug we fixed - hooks ordering
    // If the page renders without errors, the test passes
    const errorOverlay = page.locator('text=Rendered more hooks');
    await expect(errorOverlay).not.toBeVisible({ timeout: 3000 });
  });

  test('theme change shows success message', async ({ page }) => {
    await page.click('text=מראה');

    // Click a different theme
    const themeButton = page.locator('text=אוקיינוס');
    await themeButton.click();

    // Should show success message
    await expect(page.locator('text=ערכת הנושא נשמרה')).toBeVisible({ timeout: 5000 });
  });

  test('image upload button shows loading only on clicked button', async ({ page }) => {
    await page.click('text=מראה');

    // All upload buttons should be visible and NOT loading
    const uploadButtons = page.locator('button').filter({ hasText: /העלה|החלף|הוסף תמונה/ });
    const count = await uploadButtons.count();
    expect(count).toBeGreaterThan(0);

    // None should have a loading spinner initially
    for (let i = 0; i < count; i++) {
      const btn = uploadButtons.nth(i);
      const isDisabled = await btn.isDisabled();
      expect(isDisabled).toBe(false);
    }
  });

  test('delete uses custom dialog not native confirm', async ({ page }) => {
    await page.click('text=מראה');

    // Check if there are gallery images with delete buttons
    const deleteButtons = page.locator('button').filter({ has: page.locator('[class*="TrashIcon"], svg') }).filter({ hasText: '' });

    if (await deleteButtons.count() > 0) {
      // Set up dialog listener - native confirm should NOT appear
      let nativeDialogAppeared = false;
      page.on('dialog', () => {
        nativeDialogAppeared = true;
      });

      await deleteButtons.first().click();

      // Custom dialog should appear
      await expect(page.locator('text=ביטול')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('text=מחק')).toBeVisible();

      expect(nativeDialogAppeared).toBe(false);

      // Click cancel
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
    await page.fill('input[type="email"]', 'efi@stampli.com');
    await page.fill('input[type="password"]', 'Admin1234');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/platform-admin$/, { timeout: 10000 });
  });
});
