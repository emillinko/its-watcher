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
    // トップ
    // ==========================================

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(2000);

    // ==========================================
    // 空き照会
    // ==========================================

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

    const href =
      await facilityLink.getAttribute("href");

    if (!href) {
      throw new Error(
        "施設リンクが取得できませんでした"
      );
    }

    const facilityUrl =
      new URL(href, page.url()).href;

    console.log("================");
    console.log("施設URL:");
    console.log(facilityUrl);

    await page.goto(facilityUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    // ==========================================
    // HTML取得
    // ==========================================

    const html =
      await page.content();

    const keyword =
      "申込対象サービス";

    const index =
      html.indexOf(keyword);

    console.log("================");
    console.log(
      "申込対象サービス位置:",
      index
    );

    if (index < 0) {
      throw new Error(
        "申込対象サービスが見つかりません"
      );
    }

    // 前後3000文字だけ
    const section =
      html.substring(
        Math.max(0, index - 3000),
        Math.min(
          html.length,
          index + 5000
        )
      );
console.log("================");
console.log("申込対象サービス周辺の要素");

const serviceElements = page.locator(
  'input, button, select, a, label, div, li'
);

const elementCount = await serviceElements.count();

for (let i = 0; i < elementCount; i++) {
  const el = serviceElements.nth(i);

  const text = (
    await el.innerText().catch(() => "")
  ).trim();

  if (
    text &&
    text.includes("申込")
  ) {
    console.log(
      "TAG:",
      await el.evaluate(el => el.tagName)
    );

    console.log(
      "TEXT:",
      text
    );

    console.log(
      "HTML:",
      await el.evaluate(el => el.outerHTML)
    );

    console.log("----------------");
  }
}

    // ==========================================
    // FORM
    // ==========================================

    console.log("================");
    console.log("FORM情報");

    const forms =
      page.locator("form");

    const formCount =
      await forms.count();

    console.log(
      "FORM数:",
      formCount
    );

    for (let i = 0; i < formCount; i++) {

      const form =
        forms.nth(i);

      console.log(
        "FORM",
        i,
        "action:",
        await form.getAttribute("action"),
        "method:",
        await form.getAttribute("method")
      );
    }

    // ==========================================
    // INPUT
    // ==========================================

    console.log("================");
    console.log("INPUT情報");

    const inputs =
      page.locator("input");

    const inputCount =
      await inputs.count();

    console.log(
      "INPUT数:",
      inputCount
    );

    for (let i = 0; i < inputCount; i++) {

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
    // BUTTON
    // ==========================================

    console.log("================");
    console.log("BUTTON情報");

    const buttons =
      page.locator("button");

    const buttonCount =
      await buttons.count();

    console.log(
      "BUTTON数:",
      buttonCount
    );

    for (let i = 0; i < buttonCount; i++) {

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
    // SELECT
    // ==========================================

    console.log("================");
    console.log("SELECT情報");

    const selects =
      page.locator("select");

    const selectCount =
      await selects.count();

    console.log(
      "SELECT数:",
      selectCount
    );

    for (let i = 0; i < selectCount; i++) {

      const select =
        selects.nth(i);

      console.log(
        "SELECT",
        i,
        JSON.stringify({
          name:
            await select.getAttribute("name"),
          id:
            await select.getAttribute("id"),
          class:
            await select.getAttribute("class")
        })
      );

      const options =
        select.locator("option");

      const optionCount =
        await options.count();

      for (let j = 0; j < optionCount; j++) {

        const option =
          options.nth(j);

        console.log(
          "OPTION",
          j,
          JSON.stringify({
            text:
              (
                await option.innerText()
                  .catch(() => "")
              ).trim(),
            value:
              await option.getAttribute("value")
          })
        );
      }
    }

    // ==========================================
    // onclick
    // ==========================================

    console.log("================");
    console.log("ONCLICK情報");

    const onclicks =
      page.locator("[onclick]");

    const onclickCount =
      await onclicks.count();

    console.log(
      "ONCLICK数:",
      onclickCount
    );

    for (let i = 0; i < onclickCount; i++) {

      const element =
        onclicks.nth(i);

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

  } catch (error) {

    console.error("================");
    console.error("エラー発生");
    console.error(error.message);

    process.exitCode = 1;

  } finally {

    await browser.close();

  }
})();
