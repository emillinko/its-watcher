const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  await page.goto('REMOVED_ITS_KENPO_URL