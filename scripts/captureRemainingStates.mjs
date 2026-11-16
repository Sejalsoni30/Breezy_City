import { chromium } from 'playwright';
import path from 'path';

async function captureRemainingStates() {
  const screenshotsDir = path.resolve('docs/screenshots');

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  // 1. Loading state (intercept /api/air-quality and delay response)
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await page.route('**/api/air-quality*', async (route) => {
    // Hold response to capture loading skeleton
    await new Promise((r) => setTimeout(r, 2000));
    await route.continue();
  });

  await page.goto('http://localhost:3001');
  await page.waitForSelector('[aria-busy="true"]', { timeout: 3000 });
  await page.screenshot({ path: path.join(screenshotsDir, 'loading_state.png') });
  console.log('✓ Saved loading_state.png');

  // 2. Error state (simulate 500 server error)
  const errPage = await context.newPage();
  await errPage.route('**/api/air-quality*', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'InternalServerError', message: 'Simulated atmospheric upstream service outage.' })
    });
  });

  await errPage.goto('http://localhost:3001');
  await errPage.waitForSelector('[role="alert"]', { timeout: 3000 });
  await errPage.screenshot({ path: path.join(screenshotsDir, 'error_state.png') });
  console.log('✓ Saved error_state.png');

  // 3. Geolocation denied state
  const geoPage = await context.newPage();
  await geoPage.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  // Grant no geolocation (denied by default in headless without permissions)
  const geoBtn = geoPage.locator('button', { hasText: 'Use My Location' });
  await geoBtn.click();
  await geoPage.waitForTimeout(800);
  await geoPage.screenshot({ path: path.join(screenshotsDir, 'no_permission_state.png') });
  console.log('✓ Saved no_permission_state.png');

  await browser.close();
  console.log('✓ All resilience and permission state screenshots captured.');
}

captureRemainingStates().catch(console.error);
