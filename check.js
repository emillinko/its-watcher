const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  try {
    await page.goto(
      "REMOVED_ITS_KENPO_URL",
      {
        waitUntil: "domcontentloaded",
        timeout: 30000
      }
    );

    await page.waitForTimeout(5000);

  } catch (e) {
    console.log("goto error:");
    console.log(e.message);
  }

  // ここは必ず実行される
  try {
    fs.writeFileSync("page.html", await page.content());

    await page.screenshot({
      path: "page.png",
      fullPage: true
    });

    console.log("saved");
  } catch (e) {
    console.log("save error:");
    console.log(e.message);
  }

  await browser.close();
})();
