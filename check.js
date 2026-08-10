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
    // 施設選択ページ
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

    // ==========================================
    // ラビスタ富士河口湖
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

    if (!href) {
      throw new Error(
        "ラビスタ富士河口湖のリンクが取得できませんでした"
      );
    }

    const facilityUrl =
      new URL(href, page.url()).href;

    console.log("================");
    console.log("施設ページ:");
    console.log(facilityUrl);

    // ==========================================
    // 施設ページ
    // ==========================================

    await page.goto(facilityUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    console.log("================");
    console.log("タイトル:");
    console.log(await page.title());

    // ==========================================
    // 画面に表示されている全要素を調査
    // ==========================================

    console.log("================");
    console.log("申込対象サービス周辺のHTML");

    const html =
      await page.content();

    const keyword =
      "申込対象サービス";

    const index =
      html.indexOf(keyword);

    console.log(
      "キーワード位置:",
      index
    );

    if (index >= 0) {

      console.log(
        html.substring(
          Math.max(0, index - 5000),
          Math.min(
            html.length,
            index + 10000
          )
        )
      );

    } else {

      console.log(
        "申込対象サービスがHTML内にありません"
      );
    }

    // ==========================================
    // input / button / select / textarea
    // ==========================================

    console.log("================");
    console.log("INPUT / BUTTON / SELECT");

    const elements =
      page.locator(
        "input, button, select, textarea"
      );

    const count =
      await elements.count();

    console.log(
      "対象要素数:",
      count
    );

    for (let i = 0; i < count; i++) {

      const element =
        elements.nth(i);

      console.log(
        "ELEMENT",
        i,
        "tag=",
        await element.evaluate(
          el => el.tagName
        ),
        "type=",
        await element.getAttribute("type"),
        "name=",
        await element.getAttribute("name"),
        "value=",
        await element.getAttribute("value"),
        "id=",
        await element.getAttribute("id"),
        "class=",
        await element.getAttribute("class"),
        "text=",
        (
          await element.innerText().catch(() => "")
        ).trim()
      );
    }

    // ==========================================
    // JavaScript onclick 属性
    // ==========================================

    console.log("================");
    console.log("ONCLICK要素");

    const clickable =
      page.locator("[onclick]");

    const clickableCount =
      await clickable.count();

    console.log(
      "onclick要素数:",
      clickableCount
    );

    for (
      let i = 0;
      i < clickableCount;
      i++
    ) {

      const element =
        clickable.nth(i);

      console.log(
        "ONCLICK",
        i,
        "tag=",
        await element.evaluate(
          el => el.tagName
        ),
        "text=",
        (
          await element.innerText().catch(() => "")
        ).trim(),
        "onclick=",
        await element.getAttribute("onclick")
      );
    }

  } catch (error) {

    console.error("================");
    console.error("エラー発生");
    console.error(error.message);

    process.exitCode = 1;

  } finally {

    await browser.close();

  }
})();
