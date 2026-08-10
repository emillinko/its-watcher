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
    // ① トップページ
    // ==========================================

    console.log("================");
    console.log("トップページへ");

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    // ==========================================
    // ② 空き照会
    // ==========================================

    console.log("================");
    console.log("空き照会ページへ");

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

    await vacancyLink.click();

    await page.waitForTimeout(3000);

    console.log(
      "現在URL:",
      page.url()
    );

    // ==========================================
    // ③ ラビスタ富士河口湖のリンクを取得
    // ==========================================

    console.log("================");
    console.log("施設リンクを検索");

    const links = page.locator("a");

    const linkCount =
      await links.count();

    console.log(
      "リンク数:",
      linkCount
    );

    let facilityUrl = null;

    for (
      let i = 0;
      i < linkCount;
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

      if (
        text.includes(
          "ラビスタ富士河口湖"
        )
      ) {

        console.log(
          "施設発見:",
          text
        );

        console.log(
          "HREF:",
          href
        );

        if (href) {
          facilityUrl =
            new URL(
              href,
              page.url()
            ).href;
        }

        break;
      }
    }

    if (!facilityUrl) {
      throw new Error(
        "ラビスタ富士河口湖の施設URLが見つかりません"
      );
    }

    console.log("================");
    console.log(
      "施設URL:",
      facilityUrl
    );

    // ==========================================
    // ④ 施設ページ
    // ==========================================

    await page.goto(
      facilityUrl,
      {
        waitUntil: "domcontentloaded",
        timeout: 60000
      }
    );

    await page.waitForTimeout(5000);

    console.log("================");
    console.log(
      "施設ページURL:",
      page.url()
    );

    console.log(
      "タイトル:",
      await page.title()
    );

    // ==========================================
    // ⑤ body確認
    // ==========================================

    const bodyText =
      await page.locator("body").innerText();

    console.log("================");
    console.log("ページ内容:");

    console.log(
      bodyText.slice(0, 5000)
    );

    // ==========================================
    // ⑥ 「申込対象サービス」を探す
    // ==========================================

    console.log("================");
    console.log(
      "申込対象サービスを検索"
    );

    const serviceText =
      page.getByText(
        "申込対象サービス",
        {
          exact: true
        }
      ).first();

    const serviceCount =
      await serviceText.count();

    console.log(
      "見つかった数:",
      serviceCount
    );

    if (serviceCount === 0) {
      throw new Error(
        "申込対象サービスが見つかりません"
      );
    }

    // ==========================================
    // ⑦ タグ情報
    // ==========================================

    console.log("================");
    console.log(
      "申込対象サービスのタグ"
    );

    console.log(
      "TAG:",
      await serviceText.evaluate(
        el => el.tagName
      )
    );

    console.log(
      "CLASS:",
      await serviceText.getAttribute(
        "class"
      )
    );

    console.log(
      "ID:",
      await serviceText.getAttribute(
        "id"
      )
    );

    // ==========================================
    // ⑧ 親要素
    // ==========================================

    console.log("================");
    console.log(
      "親要素HTML"
    );

    const parentHTML =
      await serviceText.evaluate(
        el => {
          let parent =
            el.parentElement;

          return parent
            ? parent.outerHTML
            : "";
        }
      );

    console.log(
      parentHTML.slice(0, 10000)
    );

    // ==========================================
    // ⑨ さらに親
    // ==========================================

    console.log("================");
    console.log(
      "2階層上のHTML"
    );

    const grandParentHTML =
      await serviceText.evaluate(
        el => {
          let parent =
            el.parentElement;

          let grand =
            parent
              ? parent.parentElement
              : null;

          return grand
            ? grand.outerHTML
            : "";
        }
      );

    console.log(
      grandParentHTML.slice(0, 15000)
    );

    // ==========================================
    // ⑩ 3階層上
    // ==========================================

    console.log("================");
    console.log(
      "3階層上のHTML"
    );

    const greatParentHTML =
      await serviceText.evaluate(
        el => {

          let parent =
            el.parentElement;

          let grand =
            parent
              ? parent.parentElement
              : null;

          let great =
            grand
              ? grand.parentElement
              : null;

          return great
            ? great.outerHTML
            : "";
        }
      );

    console.log(
      greatParentHTML.slice(0, 20000)
    );

    // ==========================================
    // ⑪ ページ内のリンクを再調査
    // ==========================================

    console.log("================");
    console.log(
      "現在ページのリンク一覧"
    );

    const pageLinks =
      page.locator("a");

    const pageLinkCount =
      await pageLinks.count();

    console.log(
      "リンク数:",
      pageLinkCount
    );

    for (
      let i = 0;
      i < pageLinkCount;
      i++
    ) {

      const link =
        pageLinks.nth(i);

      const text = (
        await link.innerText()
          .catch(() => "")
      ).trim();

      const href =
        await link.getAttribute("href");

      if (
        text ||
        href
      ) {

        console.log(
          "LINK",
          i,
          "TEXT:",
          text
        );

        console.log(
          "HREF:",
          href
        );
      }
    }

    // ==========================================
    // ⑫ input一覧
    // ==========================================

    console.log("================");
    console.log(
      "INPUT一覧"
    );

    const inputs =
      page.locator("input");

    const inputCount =
      await inputs.count();

    console.log(
      "INPUT数:",
      inputCount
    );

    for (
      let i = 0;
      i < inputCount;
      i++
    ) {

      const input =
        inputs.nth(i);

      console.log(
        JSON.stringify({
          type:
            await input.getAttribute(
              "type"
            ),

          name:
            await input.getAttribute(
              "name"
            ),

          value:
            await input.getAttribute(
              "value"
            ),

          id:
            await input.getAttribute(
              "id"
            ),

          class:
            await input.getAttribute(
              "class"
            ),

          onclick:
            await input.getAttribute(
              "onclick"
            )
        })
      );
    }

    // ==========================================
    // ⑬ 完了
    // ==========================================

    console.log("================");
    console.log(
      "HTML調査完了"
    );

  } catch (error) {

    console.error("================");
    console.error(
      "エラー発生"
    );

    console.error(
      error.message
    );

    process.exitCode = 1;

  } finally {

    await browser.close();

  }

})();
