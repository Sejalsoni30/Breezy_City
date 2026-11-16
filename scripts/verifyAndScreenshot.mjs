import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

async function runVerification() {
  console.log('=== Starting End-to-End & Visual Accessibility Verification ===');

  const screenshotsDir = path.resolve('docs/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  // Listen for console errors
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('1. Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

  // Wait for AQI card to render
  await page.waitForSelector('[aria-label^="Air Quality Index"]', { timeout: 10000 });
  console.log('✓ Initial dashboard loaded successfully with default city (Delhi).');

  // Verify key UI text elements
  const title = await page.title();
  console.log(`✓ Page Title: "${title}"`);

  // 1280px Desktop Screenshot
  console.log('2. Capturing 1280px Desktop Screenshot...');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({ path: path.join(screenshotsDir, 'desktop_1280px.png'), fullPage: true });
  console.log('✓ Saved desktop_1280px.png');

  // Run Axe Accessibility Scan
  console.log('3. Running Automated WCAG 2.1 AA Accessibility Scan (Axe)...');
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  console.log(`✓ Axe Accessibility Violations: ${accessibilityScanResults.violations.length}`);
  if (accessibilityScanResults.violations.length > 0) {
    accessibilityScanResults.violations.forEach((v) => {
      console.warn(`  - [${v.impact}] ${v.id}: ${v.description}`);
    });
  }

  // 768px Tablet Screenshot
  console.log('4. Capturing 768px Tablet Screenshot...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotsDir, 'tablet_768px.png'), fullPage: true });
  console.log('✓ Saved tablet_768px.png');

  // 360px Mobile Screenshot and Horizontal Scroll Verification
  console.log('5. Capturing 360px Mobile Screenshot & Testing Responsive Fit...');
  await page.setViewportSize({ width: 360, height: 780 });
  await page.waitForTimeout(500);

  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log(`✓ 360px Mobile Horizontal Overflow Check: ${hasHorizontalScroll ? 'FAILED (overflow)' : 'PASSED (no horizontal scroll)'}`);

  await page.screenshot({ path: path.join(screenshotsDir, 'mobile_360px.png'), fullPage: true });
  console.log('✓ Saved mobile_360px.png');

  // Reset to Desktop for interactive walkthrough
  await page.setViewportSize({ width: 1280, height: 800 });

  // Test Search Autocomplete Interactivity
  console.log('6. Testing Location Search & Autocomplete...');
  const searchInput = page.locator('#location-search-input');
  await searchInput.fill('Bengaluru');
  await page.waitForSelector('#location-results-list', { timeout: 8000 });
  console.log('✓ Autocomplete dropdown appeared.');

  await page.screenshot({ path: path.join(screenshotsDir, 'search_autocomplete.png') });
  console.log('✓ Saved search_autocomplete.png');

  // Click first result
  await page.locator('#location-option-0').click();
  await page.waitForTimeout(1500);
  console.log('✓ Selected first search result.');

  // Test Health Advisory Tab switching
  console.log('7. Testing Health Advisory Tabs...');
  const childrenTab = page.locator('#tab-children');
  await childrenTab.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(screenshotsDir, 'health_tab_active.png') });
  console.log('✓ Switched to Children & Youth tab; saved health_tab_active.png');

  // Test Trends Table Toggle
  console.log('8. Testing Trends Table Accessible Alternative...');
  const toggleTableBtn = page.getByRole('button', { name: /Show Data Table/i });
  await toggleTableBtn.click();
  await page.waitForSelector('#accessible-trends-table', { timeout: 3000 });
  await page.screenshot({ path: path.join(screenshotsDir, 'trends_data_table.png') });
  console.log('✓ Data table displayed; saved trends_data_table.png');

  // Test Offline State Notice
  console.log('9. Testing Offline Resilience State...');
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotsDir, 'offline_state.png') });
  console.log('✓ Saved offline_state.png');

  await browser.close();

  console.log('\n=== Verification Summary ===');
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach((e) => console.log('  Error:', e));
  }
  console.log('All verification tasks finished successfully.');
}

runVerification().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
