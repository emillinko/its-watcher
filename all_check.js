```javascript
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

  // 今の check.js と同じURLを使用
  const url = process.env.ITS_KENPO_URL;

  try {

    console.log("================");
    console.log("全施設チェック準備");
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

    await page.waitForTimeout(2000);

    console.log(
      "現在URL:",
      page.url()
    );

    console.log(
      "タイトル:",
      await page.title()
    );

    // ==========================================
    // ページ内の施設リンクを取得
    // ==========================================

    console.log("================");
    console.log("施設リンクを検索");

    const links = page.locator(
      'a[href*="/apply_service/index"]'
    );

    const count =
      await links.count();

    console.log(
      "施設リンク数:",
      count
    );

    const facilities = [];

    for (
      let i = 0;
      i < count;
      i++
    ) {

      const link =
        links.nth(i);

      const name = (
        await link.innerText()
          .catch(() => "")
      ).trim();

      const href =
        await link.getAttribute("href");

      if (!name || !href) {
        continue;
      }

      const facilityUrl =
        new URL(
          href,
          page.url()
        ).href;

      facilities.push({
        name,
        url: facilityUrl
      });
    }

    // ==========================================
    // 結果表示
    // ==========================================

    console.log("================");
    console.log(
      "取得した施設数:",
      facilities.length
    );

    console.log("================");

    for (const facility of facilities) {

      console.log(
        "施設:",
        facility.name
      );

      console.log(
        "URL:",
        facility.url
      );

      console.log(
        "----------------"
      );
    }

    console.log("================");
    console.log(
      "全施設リンク取得完了"
    );

  } catch (error) {

    console.error("================");
    console.error(
      "★★ エラー発生 ★★"
    );

    console.error(
      error.message
    );

    process.exitCode = 1;

  } finally {

    await browser.close();
  }

})();
```
