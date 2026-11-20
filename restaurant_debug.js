
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const sakuraUrl =
    "https://as.its-kenpo.or.jp/apply/calendar?s=PT1RTzNnVFBrbG1KbFZuYzAxVFp5Vkhkd0YyWWZWR2JuOTJiblpTWjFKSGQ5a0hkdzFXWg%3D%3D&join_date=";

  try {
    await page.goto(sakuraUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(1500);

    console.log("===== 桜華樓 個室切り替えテスト =====");

    for (let i = 1; i <= 5; i++) {
      const roomName = `桜華樓(ディナー・個室${["①", "②", "③", "④", "⑤"][i - 1]})`;

      console.log(`\n===== ${roomName} =====`);

      const link = page.locator("a").filter({
        hasText: roomName
      }).first();

      if (await link.count() === 0) {
        console.log("切り替えリンクが見つかりません");
        continue;
      }

      await link.click();
      await page.waitForTimeout(1000);

      const rows = await page.locator("tr").evaluateAll(els =>
        els.map(tr => tr.innerText.trim()).filter(Boolean)
      );

      console.log("現在のURL:", page.url());

      const dateRow = rows.find(row => row.includes("日付"));
      const dayRow = rows.find(row => row.includes("曜日"));
      const timeRow = rows.find(row => row.includes("20:00"));

      console.log("日付:", dateRow || "取得できず");
      console.log("曜日:", dayRow || "取得できず");
      console.log("20時:", timeRow || "取得できず");

      if (timeRow) {
        console.log("判定:", /○|△/.test(timeRow) ? "空きあり" : "空きなし");
      }
    }

    console.log("\n===== 個室テスト終了 =====");

  } catch (error) {
    console.error("確認エラー:", error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
