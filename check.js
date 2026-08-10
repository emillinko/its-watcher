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

    await page.goto(facilityUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    console.log("================");
    console.log("施設ページタイトル:");
    console.log(await page.title());

    console.log("================");
    console.log("ページ内容:");

    const text =
      await page.locator("body").innerText();

    console.log(text.slice(0, 10000));

    // ==========================================
    // 申込対象サービスのリンクを調査
    // ==========================================

    console.log("================");
    console.log("申込対象サービスのリンク");

    const links = page.locator("a");
    const count = await links.count();

    console.log(
      "リンク数:",
      count
    );

    for (let i = 0; i < count; i++) {

      const link = links.nth(i);

      const linkText = (
        await link.innerText().catch(() => "")
      ).trim();

      const linkHref =
        await link.getAttribute("href");

      if (
        linkText &&
        linkHref
      ) {
        console.log(
          "TEXT:",
          linkText
        );

        console.log(
          "HREF:",
          linkHref
        );

        console.log(
          "----------------"
        );
      }
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
