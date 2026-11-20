
const { chromium } = require("playwright");

const ALFARO_URL =
  "https://as.its-kenpo.or.jp/apply/calendar2?a_s=876&s_c=11&join_date=2027/01/04";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1200 }
  });

  try {
    const baseUrl = process.env.ITS_KENPO_URL;

    if (!baseUrl) {
      throw new Error("ITS_KENPO_URL が設定されていません");
    }

    console.log("===== ホテルと同じ入口からアクセス =====");

    await page.goto(baseUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(1500);

    console.log("入口タイトル:", await page.title());
    console.log("入口URL:", page.url());

    console.log("\n===== アルファーロへ移動 =====");

    await page.goto(ALFARO_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    console.log("タイトル:", await page.title());
    console.log("URL:", page.url());

    const body = await page.locator("body").innerText()
      .catch(() => "");

    console.log("本文先頭:", body.slice(0, 1500));

    console.log(
      "Cloudflare表示:",
      /Checking your browser|Verify you are human|人間であることを確認|Cloudflare/i.test(body)
    );

    console.log("\n===== テーブル =====");

    const rows = await page.locator("tr").evaluateAll(els =>
      els.map(el => el.innerText.trim()).filter(Boolean)
    );

    console.log(JSON.stringify(rows, null, 2));

    console.log("\n===== 20時の行 =====");
    console.log(rows.find(row => row.includes("20:00")) || "20時の行なし");

  } catch (error) {
    console.error("確認エラー:", error.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
