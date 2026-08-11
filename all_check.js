const { chromium } = require("playwright");

(async () => {

  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage({
    viewport: {
      width: 1400,
      height: 1200
    }
  });

  const url = process.env.ITS_KENPO_URL;

  try {

    console.log("================");
    console.log("全施設リンク調査");
    console.log("================");

    if (!url) {
      throw new Error(
        "ITS_KENPO_URL が設定されていません"
      );
    }

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    console.log("現在URL:");
    console.log(page.url());

    console.log("================");
    console.log("ページタイトル:");
    console.log(await page.title());

    // ==========================================
    // ページ内の全リンクを取得
    // ==========================================

    const links = page.locator("a");
    const count = await links.count();

    console.log("================");
    console.log("ページ内リンク数:", count);

    // ==========================================
    // 全リンクを表示
    // ==========================================

    for (let i = 0; i < count; i++) {

      const link = links.nth(i);

      const text = (
        await link.innerText().catch(() => "")
      ).trim();

      const href =
        await link.getAttribute("href");

      if (!text && !href) {
        continue;
      }

      console.log("================");
      console.log("LINK:", i);
      console.log("TEXT:", text);
      console.log("HREF:", href);
    }

    console.log("================");
    console.log("全リンク調査終了");

  } catch (error) {

    console.error("================");
    console.error("★★ エラー発生 ★★");
    console.error(error.message);

    process.exitCode = 1;

  } finally {

    await browser.close();
  }

})();
