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

    console.log("================");
    console.log("空き照会ページ");

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
    // ラビスタ富士河口湖を探す
    // ==========================================

    console.log("================");
    console.log("施設を探しています");

    const facilityLink = page.locator(
      "a",
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

    await page.waitForTimeout(3000);

    console.log("================");
    console.log("施設ページタイトル:");

    console.log(
      await page.title()
    );

    // ==========================================
    // ページ内容
    // ==========================================

    console.log("================");
    console.log("ページ内容:");

    const bodyText =
      await page.locator("body").innerText();

    console.log(
      bodyText.slice(0, 10000)
    );

    // ==========================================
    // HTML
    // ==========================================

    const html =
      await page.content();

    const keyword =
      "申込対象サービス";

    const keywordIndex =
      html.indexOf(keyword);

    console.log("================");
    console.log(
      "申込対象サービス位置:",
      keywordIndex
    );

    // ==========================================
    // ラビスタ富士河口湖申込を探す
    // ==========================================

    console.log("================");
    console.log(
      "ラビスタ富士河口湖申込を調査"
    );

    const target =
      page.getByText(
        "ラビスタ富士河口湖申込",
        {
          exact: true
        }
      ).first();

    const targetCount =
      await target.count();

    console.log(
      "存在:",
      targetCount
    );

    if (targetCount === 0) {

      console.log(
        "ラビスタ富士河口湖申込が見つかりませんでした"
      );

    } else {

      // ========================================
      // 本体
      // ========================================

      console.log("================");
      console.log("対象要素");

      console.log(
        "TAG:",
        await target.evaluate(
          el => el.tagName
        )
      );

      console.log(
        "TEXT:",
        (
          await target.innerText()
        ).trim()
      );

      console.log(
        "ID:",
        await target.getAttribute("id")
      );

      console.log(
        "CLASS:",
        await target.getAttribute("class")
      );

      console.log(
        "HREF:",
        await target.getAttribute("href")
      );

      console.log(
        "ONCLICK:",
        await target.getAttribute("onclick")
      );

      console.log(
        "TYPE:",
        await target.getAttribute("type")
      );

      console.log(
        "NAME:",
        await target.getAttribute("name")
      );

      console.log(
        "VALUE:",
        await target.getAttribute("value")
      );

      // ========================================
      // 本体HTML
      // ========================================

      console.log("================");
      console.log("対象要素HTML:");

      console.log(
        await target.evaluate(
          el => el.outerHTML
        )
      );

      // ========================================
      // 親要素
      // ========================================

      console.log("================");
      console.log("親要素HTML:");

      console.log(
        await target.evaluate(
          el =>
            el.parentElement
              ? el.parentElement.outerHTML
              : ""
        )
      );

      // ========================================
      // さらに親
      // ========================================

      console.log("================");
      console.log("さらに親のHTML:");

      console.log(
        await target.evaluate(
          el =>
            el.parentElement?.parentElement
              ? el.parentElement.parentElement.outerHTML
              : ""
        )
      );

      // ========================================
      // さらにさらに親
      // ========================================

      console.log("================");
      console.log("さらに上のHTML:");

      console.log(
        await target.evaluate(
          el =>
            el.parentElement
              ?.parentElement
              ?.parentElement
              ? el.parentElement
                  .parentElement
                  .parentElement
                  .outerHTML
              : ""
        )
      );
    }

    // ==========================================
    // INPUT一覧
    // ==========================================

    console.log("================");
    console.log("INPUT一覧");

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
        "INPUT",
        i,
        JSON.stringify({
          type:
            await input.getAttribute("type"),

          name:
            await input.getAttribute("name"),

          value:
            await input.getAttribute("value"),

          id:
            await input.getAttribute("id"),

          class:
            await input.getAttribute("class")
        })
      );
    }

    // ==========================================
    // BUTTON一覧
    // ==========================================

    console.log("================");
    console.log("BUTTON一覧");

    const buttons =
      page.locator("button");

    const buttonCount =
      await buttons.count();

    console.log(
      "BUTTON数:",
      buttonCount
    );

    for (
      let i = 0;
      i < buttonCount;
      i++
    ) {

      const button =
        buttons.nth(i);

      console.log(
        "BUTTON",
        i,
        JSON.stringify({
          text:
            (
              await button.innerText()
                .catch(() => "")
            ).trim(),

          type:
            await button.getAttribute("type"),

          name:
            await button.getAttribute("name"),

          value:
            await button.getAttribute("value"),

          id:
            await button.getAttribute("id"),

          class:
            await button.getAttribute("class")
        })
      );
    }

    // ==========================================
    // ONCLICK一覧
    // ==========================================

    console.log("================");
    console.log("ONCLICK一覧");

    const onclickElements =
      page.locator("[onclick]");

    const onclickCount =
      await onclickElements.count();

    console.log(
      "ONCLICK数:",
      onclickCount
    );

    for (
      let i = 0;
      i < onclickCount;
      i++
    ) {

      const element =
        onclickElements.nth(i);

      const text =
        (
          await element.innerText()
            .catch(() => "")
        ).trim();

      const onclick =
        await element.getAttribute("onclick");

      if (
        text ||
        onclick
      ) {

        console.log(
          "ONCLICK",
          i,
          JSON.stringify({
            tag:
              await element.evaluate(
                el => el.tagName
              ),

            text,

            onclick
          })
        );
      }
    }

    // ==========================================
    // FORM一覧
    // ==========================================

    console.log("================");
    console.log("FORM一覧");

    const forms =
      page.locator("form");

    const formCount =
      await forms.count();

    console.log(
      "FORM数:",
      formCount
    );

    for (
      let i = 0;
      i < formCount;
      i++
    ) {

      const form =
        forms.nth(i);

      console.log(
        "FORM",
        i,
        JSON.stringify({
          action:
            await form.getAttribute("action"),

          method:
            await form.getAttribute("method"),

          id:
            await form.getAttribute("id"),

          class:
            await form.getAttribute("class")
        })
      );
    }

    // ==========================================
    // 完了
    // ==========================================

    console.log("================");
    console.log(
      "調査完了"
    );

  } catch (error) {

    console.error("================");
    console.error("エラー発生");

    console.error(
      error.message
    );

    process.exitCode = 1;

  } finally {

    await browser.close();

  }

})();
```
