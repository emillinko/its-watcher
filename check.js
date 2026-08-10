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

  const url = process.env.ITS_KENPO_URL_2;

  try {
    // ==========================================
    // 施設選択ページへ
    // ==========================================

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(2000);

    const vacancyLink = page.getByText(
      "直営・通年・夏季・冬季保養施設(空き照会)",
      { exact: true }
    ).first();

    await vacancyLink.waitFor({
      state: "visible",
      timeout: 30000
    });

    await vacancyLink.click();

    await page.waitForTimeout(2000);

    console.log("================");
    console.log("施設選択ページ:");
    console.log(page.url());

    // ==========================================
    // ラビスタ富士河口湖のリンク取得
    // ==========================================

    const facilityLink = page.locator(
      'a',
      {
        hasText: "ラビスタ富士河口湖"
      }
    ).first();

    await facilityLink.waitFor({
      state: "attached",
      timeout: 30000
    });

    const href =
      await facilityLink.getAttribute("href");

    console.log("================");
    console.log("ラビスタ富士河口湖 HREF:");
    console.log(href);

    if (!href) {
      throw new Error(
        "施設ページのリンクが取得できませんでした"
      );
    }

    // ==========================================
    // 施設ページへ直接移動
    // ==========================================

    const facilityUrl =
      new URL(href, page.url()).href;

    console.log("================");
    console.log("施設ページへ移動:");
    console.log(facilityUrl);

    await page.goto(facilityUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    // ==========================================
    // ページ情報
    // ==========================================

    console.log("================");
    console.log("実際のURL:");
    console.log(page.url());

    console.log("================");
    console.log("タイトル:");
    console.log(await page.title());

    console.log("================");
    console.log("HTML length:");
    console.log((await page.content()).length);

    // ==========================================
    // ページ本文
    // ==========================================

    console.log("================");
    console.log("ページ内容:");

    const text =
      await page.locator("body").innerText();

    console.log(text.slice(0, 15000));

    // ==========================================
    // カレンダー関連の要素を調査
    // ==========================================

    console.log("================");
    console.log("カレンダー候補");

    const calendars =
      page.locator('[id^="tcb"]');

    console.log(
      "tcb要素数:",
      await calendars.count()
    );

    for (
      let i = 0;
      i < await calendars.count();
      i++
    ) {
      const calendar =
        calendars.nth(i);

      console.log(
        "ID:",
        await calendar.getAttribute("id")
      );

      console.log(
        "表示:",
        await calendar.isVisible().catch(() => false)
      );
    }

    // ==========================================
    // ○ △ × を探す
    // ==========================================

    console.log("================");
    console.log("空き状況記号");

    const bodyText = text;

    console.log(
      "○ の数:",
      (bodyText.match(/○/g) || []).length
    );

    console.log(
      "△ の数:",
      (bodyText.match(/△/g) || []).length
    );

    console.log(
      "× の数:",
      (bodyText.match(/×/g) || []).length
    );

  } catch (error) {

    console.error("================");
    console.error("エラー発生");
    console.error(error.message);

    process.exitCode = 1;

  } finally {

    await browser.close();

  }
})();
