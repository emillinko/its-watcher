
const { chromium } = require("playwright");

const START_URL =
  "https://as.its-kenpo.or.jp/apply/calendar?s=PT1nTjNnVFBrbG1KbFZuYzAxVFp5Vkhkd0YyWWZWR2JuOTJiblpTWjFKSGQ5a0hkdzFXWg%3D%3D&join_date=2027-01-04";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("response", response => {
    if (response.url().includes("its-kenpo.or.jp")) {
      console.log("通信:", response.status(), response.url());
    }
  });

  try {
    console.log("===== アルファーロ直接アクセス =====");

    await page.goto(START_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    console.log("タイトル:", await page.title());
    console.log("URL:", page.url());

    console.log("\n===== 画面テキスト =====");
    console.log((await page.locator("body").innerText()).slice(0, 10000));

    console.log("\n===== カレンダーHTML =====");
    const tables = await page.locator("table").evaluateAll(els =>
      els.map(el => el.outerHTML)
    );
    console.log(JSON.stringify(tables, null, 2));

    console.log("\n===== 20:00の要素 =====");
    const targets = await page.locator("body *").evaluateAll(els =>
      els.filter(el =>
        el.children.length === 0 &&
        (el.innerText || "").trim().includes("20:00")
      ).map(el => el.outerHTML)
    );
    console.log(JSON.stringify(targets, null, 2));

  } catch (error) {
    console.error("デバッグエラー:", error);
  } finally {
    await browser.close();
  }
})();
