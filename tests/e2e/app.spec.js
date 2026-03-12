import { test, expect } from '@playwright/test';

// Skip onboarding by setting localStorage before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('tf_onboarded', '1');
  });
});

// ── 1. App loads ─────────────────────────────────────────────────────────────

test('app loads and shows marketplace', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: 'Get paid' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View Details' }).first()).toBeVisible();
});

// ── 2. Mode switching ────────────────────────────────────────────────────────

test('can switch between Earner and Hirer modes', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Switch to Hire' });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await page.waitForTimeout(300);
  await expect(page.getByRole('button', { name: 'Switch to Work' })).toBeVisible();
});

// ── 3. Marketplace → Project Detail ──────────────────────────────────────────

test('clicking View Details navigates to project detail', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'View Details' }).first().click();
  await expect(page.getByRole('heading', { name: 'Project Overview' })).toBeVisible({ timeout: 5000 });
});

// ── 4. Contract flow ─────────────────────────────────────────────────────────

test('can initiate contract and reach contract view', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'View Details' }).first().click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Initiate Contract' }).click();
  await page.waitForTimeout(300);
  // Confirm modal appears — click Confirm
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.waitForTimeout(500);
  // Contract step tracker shows "PROTOCOL" as first step
  await expect(page.locator('text=PROTOCOL').first()).toBeVisible({ timeout: 5000 });
});

// ── 5. Trust Passport modal ──────────────────────────────────────────────────

test('Trust Passport modal opens from profile avatar', async ({ page }) => {
  await page.goto('/');
  // Click the outer avatar div (has onClick) — span inside overflow-hidden can't be clicked directly
  await page.locator('nav .w-9.h-9.rounded-full.cursor-pointer').click();
  await expect(page.locator('text=/Performance Metrics|Behavior Signals/i').first()).toBeVisible({ timeout: 5000 });
});

// ── 6. Wallet view ───────────────────────────────────────────────────────────

test('wallet view loads and shows balance', async ({ page }) => {
  await page.goto('/');
  // Wallet div has title="Open Wallet"
  await page.locator('[title="Open Wallet"]').click();
  await expect(page.locator('text=Net Liquidity').first()).toBeVisible({ timeout: 5000 });
});

// ── 7. Command Center ────────────────────────────────────────────────────────

test('command center opens', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Command Center' }).click();
  await expect(page.locator('text=Active Operations').first()).toBeVisible({ timeout: 5000 });
});

// ── 8. Cmd+K opens command palette ───────────────────────────────────────────

test('Cmd+K opens command palette', async ({ page }) => {
  await page.goto('/');
  await page.locator('body').click(); // ensure page has focus
  await page.keyboard.press('Meta+k');
  await expect(page.getByPlaceholder('Type a command...')).toBeVisible({ timeout: 5000 });
});
