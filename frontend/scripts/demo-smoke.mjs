// Run only against the disposable local demo, never a production database.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

(async () => {
  const base = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3100';
  if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) {
    throw new Error('This smoke test is restricted to localhost');
  }
  const output = process.env.SMOKE_OUTPUT || '/tmp/smartfactory-smoke';
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.SMOKE_CHROME_PATH ? { executablePath: process.env.SMOKE_CHROME_PATH } : {}),
  });
  const errors = [];
  const failedRequests = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400 && response.url().startsWith('http://127.0.0.1:8100')) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });
    await page.goto(`${base}/login`);
    await page.getByRole('button', { name: 'Explore read-only demo' }).waitFor();
    assert.equal(await page.locator('input[type=email]').inputValue(), '');
    assert.equal(await page.locator('input[type=password]').inputValue(), '');
    await page.getByRole('button', { name: 'Explore read-only demo' }).click();
    await page.waitForURL(`${base}/`);
    await page.getByText('Read-only access. You can explore reports').waitFor();
    await page.waitForLoadState('networkidle');
    // Let chart entrance animations finish before recording visual evidence.
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(output, 'demo-dashboard.png'), fullPage: true });
    for (const route of ['products', 'inventory', 'production-orders', 'work-centers',
      'maintenance', 'quality', 'downtime', 'waste', 'suppliers', 'customers',
      'purchase-orders', 'sales-orders', 'reports', 'alerts', 'notifications', 'forecasting', 'oee']) {
      await page.goto(`${base}/${route}`);
      await page.getByText('Read-only access. You can explore reports').waitFor();
      await page.waitForLoadState('networkidle');
      for (const name of ['Create Record', 'Update Record', 'Edit', 'Delete']) {
        assert.equal(await page.getByRole('button', { name, exact: true }).count(), 0, `${route}: ${name}`);
      }
      if (route === 'products') {
        await page.getByText('Sample Salad 250g', { exact: true }).waitFor();
        await page.screenshot({ path: path.join(output, 'demo-products.png'), fullPage: true });
      }
    }
    for (const route of ['users', 'companies', 'audit-logs', 'ai', 'scheduling', 'register']) {
      await page.goto(`${base}/${route}`);
      await page.getByRole('heading', { name: 'Read-only access' }).waitFor();
    }
    assert.deepEqual(errors, [], 'Browser runtime errors');
    assert.deepEqual(failedRequests, [], 'Unexpected failed API requests');
    await context.close();

    // Expired sessions must reach login without a cookie-triggered redirect loop.
    const expired = await browser.newContext();
    await expired.addCookies([{ name: 'smartfactory_token', value: 'expired-token', url: base }]);
    await expired.addInitScript(() => localStorage.setItem('smartfactory_token', 'expired-token'));
    const expiredPage = await expired.newPage();
    await expiredPage.goto(`${base}/products`);
    await expiredPage.waitForURL(`${base}/login`);
    await expiredPage.getByRole('button', { name: 'Sign In', exact: true }).waitFor();
    await expired.close();
    console.log('PASS: demo login, 18 read pages, hidden write controls, 6 restricted pages, expired-session recovery');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
