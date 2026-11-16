import { chromium } from 'playwright';
import path from 'path';

async function captureAdvancedFeatures() {
  const screenshotsDir = path.resolve('docs/screenshots');

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

  // 1. Capture AI Health Assistant component
  const aiSection = page.locator('section[aria-labelledby="ai-advisory-title"]');
  await aiSection.waitFor({ timeout: 5000 });
  await aiSection.screenshot({ path: path.join(screenshotsDir, 'ai_health_assistant.png') });
  console.log('✓ Saved ai_health_assistant.png');

  // 2. Click Asthma profile in AI assistant and screenshot
  const asthmaBtn = aiSection.locator('button', { hasText: 'Asthma' });
  await asthmaBtn.click();
  await page.waitForTimeout(600);
  await aiSection.screenshot({ path: path.join(screenshotsDir, 'ai_health_assistant_asthma.png') });
  console.log('✓ Saved ai_health_assistant_asthma.png');

  // 3. Capture Historical Trends component
  const trendsSection = page.locator('section[aria-labelledby="historical-trends-title"]');
  await trendsSection.waitFor({ timeout: 5000 });
  await trendsSection.screenshot({ path: path.join(screenshotsDir, 'historical_trends_analytics.png') });
  console.log('✓ Saved historical_trends_analytics.png');

  // 4. Switch Historical Trends to 30 days
  const thirtyDayBtn = trendsSection.locator('button', { hasText: 'Past 30 Days' });
  await thirtyDayBtn.click();
  await page.waitForTimeout(600);
  await trendsSection.screenshot({ path: path.join(screenshotsDir, 'historical_trends_30days.png') });
  console.log('✓ Saved historical_trends_30days.png');

  // 5. Capture Neighborhood Air Quality Heatmap component
  const mapSection = page.locator('section[aria-labelledby="map-section-title"]');
  await mapSection.waitFor({ timeout: 6000 });
  await page.waitForTimeout(1000); // allow Leaflet tiles to load
  await mapSection.screenshot({ path: path.join(screenshotsDir, 'neighborhood_heatmap.png') });
  console.log('✓ Saved neighborhood_heatmap.png');

  // 6. Click a marker to trigger popup on map
  const markerPin = mapSection.locator('.custom-aqi-pin').first();
  if (await markerPin.count() > 0) {
    await markerPin.click();
    await page.waitForTimeout(500);
    await mapSection.screenshot({ path: path.join(screenshotsDir, 'neighborhood_heatmap_popup.png') });
    console.log('✓ Saved neighborhood_heatmap_popup.png');
  }

  await browser.close();
  console.log('=== All advanced feature screenshots captured successfully ===');
}

captureAdvancedFeatures().catch((err) => {
  console.error('Failed to capture screenshots:', err);
  process.exit(1);
});
