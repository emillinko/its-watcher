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
    console.log("ITS_KENPO_URL:");

    console.log(url);

    console.log("================");
    console.log("アクセス開始");

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    console.log("================");
    console.log("実際のURL:");

    console.log(page.url());

    console.log("================");
    console.log("タイトル:");

    console.log(await page.title());

    console.log("================");
    console.log("HTML length:");

    const html =
      await page.content();

    console.log(html.length);

    console.log("================");
    console.log("body:");

    const body =
      await page.locator("body").innerText();

    console.log(
      body.slice(0, 15000)
    );

    console.log("================");
    console.log("施設名検索:");

    const names = [
      "フルーツパーク富士屋ホテル",
      "ラビスタ富士河口湖",
      "草津温泉　ホテルヴィレッジ"
    ];

    for (const name of names) {

      console.log(
        name,
        "=>",
        html.includes(name)
      );
    }

    console.log("================");
    console.log("リンク数:");

    const links =
      page.locator("a");

    console.log(
      await links.count()
    );

    console.log("================");
    console.log(
      "href に apply_service を含むリンク:"
    );

    const applyLinks =
      page.locator(
        'a[href*="apply_service"]'
      );

    const applyCount =
      await applyLinks.count();

    console.log(
      "件数:",
      applyCount
    );

    for (
      let i = 0;
      i < applyCount;
      i++
    ) {

      const link =
        applyLinks.nth(i);

      console.log(
        "TEXT:",
        (
          await link.innerText()
            .catch(() => "")
        ).trim()
      );

      console.log(
        "HREF:",
        await link.getAttribute(
          "href"
        )
      );

      console.log(
        "----------------"
      );
    }

    console.log("================");
    console.log("調査終了");

  } catch (error) {

    console.error("================");
    console.error("エラー:");

    console.error(
      error.message
    );

    process.exitCode = 1;

  } finally {

    await browser.close();
  }

})();
