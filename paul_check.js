const { chromium } = require("playwright");

const URL =
  "https://www.tablecheck.com/ja/shops/paul-yotsuya/reserve";

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage({
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo"
  });

  try {
    console.log("PAUL四谷 TableCheck テスト開始");

    // まず予約ページを開く
    await page.goto(URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    console.log("ページを開きました");
    console.log("Title:", await page.title());

    // TableCheckのJSが動くのを少し待つ
    await page.waitForTimeout(5000);

    // ページ全体のテキストを取得
    const text = await page.locator("body").innerText();

    console.log("");
    console.log("===== PAGE TEXT =====");
    console.log(text);
    console.log("=====================");
    console.log("");

    // ボタン一覧
    const buttons = await page.locator("button").evaluateAll(buttons =>
      buttons.map((button, index) => ({
        index,
        text: (button.innerText || "").trim(),
        ariaLabel: button.getAttribute("aria-label"),
        disabled: button.disabled
      }))
    );

    console.log("===== BUTTONS =====");

    for (const button of buttons) {
      if (
        button.text ||
        button.ariaLabel
      ) {
        console.log(JSON.stringify(button));
      }
    }

    console.log("===================");

  } catch (error) {
    console.error("ERROR:", error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
