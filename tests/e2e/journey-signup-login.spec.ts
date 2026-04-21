/**
 * Journey test — full sign-up → sign-in → /study
 *
 * Gap this closes: UC-01 and UC-02 test the two flows in isolation, so a
 * user whose sign-up succeeds but whose first sign-in then crashes would
 * never be caught. This test chains both and asserts the happy path lands
 * on /study cleanly with no Next.js dev error overlay and no JSON.parse
 * runtime errors along the way.
 */
import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';
import { Client } from 'pg';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/jeanmonnet';

function watchRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (/SyntaxError|TypeError|ReferenceError|Uncaught|not valid JSON/i.test(text)) {
        errors.push(`[console.error] ${text}`);
      }
    }
  });
  return errors;
}

async function expectNoNextErrorOverlay(page: Page) {
  const overlay = await page.evaluate(() => {
    const portal = document.querySelector('nextjs-portal');
    if (!portal) return null;
    const root = (portal as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
    const dlg = root?.querySelector('[data-nextjs-dialog]');
    return dlg ? (dlg.textContent ?? '').slice(0, 600) : null;
  });
  expect(overlay, overlay ? `Next.js overlay:\n${overlay}` : undefined).toBeNull();
}

const uniqueEmail = () => `journey_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@example.com`;

test.describe('Journey · sign-up → sign-in → /study', () => {
  const createdEmails: string[] = [];

  test.afterAll(async () => {
    if (!createdEmails.length) return;
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    try {
      await client.query(`DELETE FROM users WHERE email = ANY($1)`, [createdEmails]);
    } finally {
      await client.end();
    }
  });

  test('new user registers, signs in, lands on /study with no runtime errors or overlay', async ({ page }) => {
    const runtimeErrors = watchRuntimeErrors(page);
    const email = uniqueEmail();
    const password = 'SecurePass1!';
    createdEmails.push(email);

    // ── Sign up ─────────────────────────────────────────────────
    await page.goto('/sign-up');
    await page.getByLabel('First name').fill('Journey');
    await page.getByLabel('Last name').fill('Tester');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.waitForURL('**/sign-in', { timeout: 10000 });
    await expectNoNextErrorOverlay(page);

    // ── Sign in ─────────────────────────────────────────────────
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForURL('**/study', { timeout: 12000 });
    await page.waitForLoadState('networkidle');
    // Give startTransition microtasks time to settle after navigation.
    await page.waitForTimeout(1500);

    // ── Assert clean landing page ───────────────────────────────
    await expect(page).toHaveURL(/\/study(?!\/)/);
    await expect(page.getByText(/select subject/i)).toBeVisible({ timeout: 8000 });
    await expectNoNextErrorOverlay(page);
    expect(
      runtimeErrors,
      `Journey leaked runtime errors:\n${runtimeErrors.join('\n')}`
    ).toEqual([]);

    // ── Session cookie must be set ──────────────────────────────
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (c) => c.name.includes('session') || c.name.includes('better-auth')
    );
    expect(sessionCookie, 'Expected a Better Auth session cookie after login').toBeDefined();
  });

  test('sign-up with a duplicate email keeps the form mounted (no blank page)', async ({ page }) => {
    const runtimeErrors = watchRuntimeErrors(page);
    const email = uniqueEmail();
    const password = 'SecurePass1!';
    createdEmails.push(email);

    // First registration succeeds.
    await page.goto('/sign-up');
    await page.getByLabel('First name').fill('Dup');
    await page.getByLabel('Last name').fill('User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.waitForURL('**/sign-in', { timeout: 10000 });

    // Second registration with the same email → error toast, form stays.
    await page.goto('/sign-up');
    await page.getByLabel('First name').fill('Dup');
    await page.getByLabel('Last name').fill('User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();

    // Form must still be visible — no blank page.
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible({ timeout: 8000 });
    await expect(
      page.locator('[data-state="open"]').filter({ hasText: /already|taken|exist|registered|error/i })
    ).toBeVisible({ timeout: 8000 });

    await expectNoNextErrorOverlay(page);
    expect(runtimeErrors, `leaks:\n${runtimeErrors.join('\n')}`).toEqual([]);
  });
});
