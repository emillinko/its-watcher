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

  const hotels = [
    "ラビスタ富士河口湖",
    "フルーツパーク富士屋ホテル"
  ];

  const emptyDays = [];

  try {

    console.log("================");
    console.log("ITS健保チェック開始");

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(2000);

    console.log("現在URL:");
    console.log(page.url());

    // ==========================================
    // 施設ごとにチェック
    // ==========================================

    for (const hotel of hotels) {

      console.log("================");
      console.log("施設:", hotel);

      // いったん元ページへ戻る
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000
      });

      await page.waitForTimeout(1500);

      // apply_service のリンクから施設を探す
      const links =
        page.locator(
          'a[href*="/apply_service/index"]'
        );

      const count =
        await links.count();

      console.log(
        "施設リンク数:",
        count
      );

      let targetLink = null;

      for (let i = 0; i < count; i++) {

        const link = links.nth(i);

        const text = (
          await link.innerText()
            .catch(() => "")
        ).trim();

        if (text === hotel) {

          targetLink = link;
          break;
        }
      }

      if (!targetLink) {

        console.log(
          "施設リンクが見つかりません:",
          hotel
        );

        continue;
      }

      const href =
        await targetLink.getAttribute("href");

      console.log(
        "施設リンク:",
        href
      );

      if (!href) {
        continue;
      }

      const facilityUrl =
        new URL(
          href,
          page.url()
        ).href;

      console.log(
        "施設URL:",
        facilityUrl
      );

      // ==========================================
      // 施設ページへ
      // ==========================================

      await page.goto(facilityUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60000
      });

      await page.waitForTimeout(2500);

      console.log(
        "施設ページ:",
        page.url()
      );

      const body =
        await page.locator("body").innerText();

      console.log(
        body.slice(0, 5000)
      );

      // ==========================================
      // 空き記号を探す
      // ==========================================

      const circles =
        await page
          .locator("text=○")
          .count()
          .catch(() => 0);

      const triangles =
        await page
          .locator("text=△")
          .count()
          .catch(() => 0);

      console.log(
        "○:",
        circles,
        "△:",
        triangles
      );

      // ==========================================
      // カレンダーの日付セル
      // ==========================================

      const cells =
        page.locator(
          'td[data-join-time]'
        );

      const cellCount =
        await cells.count();

      console.log(
        "日付セル数:",
        cellCount
      );

      for (
        let i = 0;
        i < cellCount;
        i++
      ) {

        const cell =
          cells.nth(i);

        const date =
          await cell.getAttribute(
            "data-join-time"
          );

        if (!date) {
          continue;
        }

        const icon =
          cell.locator(".icon").first();

        if (
          await icon.count() === 0
        ) {
          continue;
        }

        const status =
          (
            await icon.innerText()
              .catch(() => "")
          ).trim();

        console.log(
          date,
          status
        );

        if (
          status === "○" ||
          status === "△"
        ) {

          emptyDays.push({
            hotel,
            date,
            status
          });
        }
      }
    }

    // ==========================================
    // 結果
    // ==========================================

    console.log("================");
    console.log("最終結果");

    if (emptyDays.length === 0) {

      console.log(
        "空きなし"
      );

    } else {

      console.log(
        "★★ 空き発見 ★★"
      );

      for (const item of emptyDays) {

        console.log(
          item.hotel,
          item.date,
          item.status
        );
      }
    }

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
