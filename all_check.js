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

    // ==========================================
    // ITS健保トップへ
    // ==========================================

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(2000);

    console.log("最初のURL:");
    console.log(page.url());

    // ==========================================
    // 空き照会ページへ
    // ==========================================

    const vacancyLink = page.getByText(
      "直営・通年・夏季・冬季保養施設(空き照会)",
      {
        exact: true
      }
    ).first();

    await vacancyLink.waitFor({
      state: "visible",
      timeout: 30000
    });

    console.log("================");
    console.log("空き照会ページへ移動");

    await vacancyLink.click();

    await page.waitForTimeout(3000);

    console.log("現在URL:");
    console.log(page.url());

    console.log("================");
    console.log("ページタイトル:");
    console.log(await page.title());

    // ==========================================
    // 施設リンク取得
    // ==========================================

    const links = page.locator("a");

    const count =
      await links.count();

    console.log("================");
    console.log(
      "ページ内リンク数:",
      count
    );

    let facilityCount = 0;

    for (
      let i = 0;
      i < count;
      i++
    ) {

      const link =
        links.nth(i);

      const text = (
        await link.innerText()
          .catch(() => "")
      ).trim();

      const href =
        await link.getAttribute("href");

      if (!text || !href) {
        continue;
      }

      // 施設関連リンクだけ表示
      if (
        href.includes("/apply_service/")
      ) {

        facilityCount++;

        console.log("================");
        console.log(
          "施設:",
          text
        );

        console.log(
          "URL:",
          new URL(
            href,
            page.url()
          ).href
        );
      }
    }

    console.log("================");
    console.log(
      "施設リンク数:",
      facilityCount
    );

    console.log("================");
    console.log(
      "全施設リンク調査終了"
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
