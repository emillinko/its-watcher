const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto(
    "REMOVED_ITS_KENPO_URL",
    {
      waitUntil: "domcontentloaded",
      timeout: 60000
    }
  );
  
  await page.waitForTimeout(5000);

  fs.writeFileSync("page.html", await page.content());

  await page.screenshot({ path: "page.png", fullPage: true });

  console.log("saved");

  await browser.close();
})();
