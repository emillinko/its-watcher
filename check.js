const { chromium } = require('playwright');

(async () => {

  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  await page.goto(
    "REMOVED_ITS_KENPO_URL",
    {
      waitUntil: "networkidle",
      timeout: 60000
    }
  );

  console.log("Title:", await page.title());

//  console.log(await page.content().substring(0, 1000));
  const html = await page.content();
  console.log(html.substring(0, 1000));

  await browser.close();

})();
