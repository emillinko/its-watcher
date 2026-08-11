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
    console.log("ITS健保へアクセス");

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    console.log(
      "現在URL:",
      page.url()
    );

    console.log(
      "タイトル:",
      await page.title()
    );

    // ==========================================
    // ページ内容
    // ==========================================

    const text =
      await page.locator("body").innerText();

    console.log("================");
    console.log("ページ内容:");

    console.log(
      text.slice(0, 10000)
    );

    // ==========================================
    // 施設名を探す
    // ==========================================

    const hotels = [
      "フルーツパーク富士屋ホテル",
      "ラビスタ富士河口湖"
    ];

    console.log("================");
    console.log("指定施設チェック");

    for (const hotel of hotels) {

      const count =
        await page.getByText(
          hotel,
          {
            exact: true
          }
        ).count();

      console.log(
        hotel,
        "=>",
        count
      );
    }

    // ==========================================
    // すべてのリンクを調査
    // ==========================================

    console.log("================");
    console.log("リンク調査");

    const links =
      page.locator("a");

    const linkCount =
      await links.count();

    console.log(
      "リンク数:",
      linkCount
    );

    for (
      let i = 0;
      i < linkCount;
      i++
    ) {

      const link =
        links.nth(i);

      const linkText = (
        await link.innerText()
          .catch(() => "")
      ).trim();

      const href =
        await link.getAttribute("href");

      if (
        linkText.includes("ホテル") ||
        linkText.includes("ラビスタ") ||
        linkText.includes("富士") ||
        linkText.includes("ヴィレッジ")
      ) {

        console.log(
          "TEXT:",
          linkText
        );

        console.log(
          "HREF:",
          href
        );

        console.log(
          "----------------"
        );
      }
    }

    console.log("================");
    console.log(
      "施設リンク調査終了"
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
