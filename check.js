const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage({
    viewport: { width: 1400, height: 1200 }
  });

  try {
    await page.goto(
      "REMOVED_ITS_KENPO_URL",
      {
        waitUntil: "domcontentloaded",
        timeout: 60000
      }
    );

    // JavaScriptが動くのを待つ
    await page.waitForTimeout(8000);

    // HTML保存
    fs.writeFileSync("page.html", await page.content());

    // スクリーンショット保存
    await page.screenshot({
      path: "page.png",
      fullPage: true
    });

    console.log("Title:", await page.title());

    const html = await page.content();

    console.log("HTML length =", html.length);

    console.log(
      "ホテル名あり？",
      html.includes("フルーツパーク"),
      html.includes("ラビスタ")
    );

    console.log(
      "○△×",
      html.includes("○"),
      html.includes("△"),
      html.includes("×")
    );

    console.log("saved");

  } finally {
    await browser.close();
  }
})();
