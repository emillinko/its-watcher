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
        "施設リンクを取得できませんでした"
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

    // ==========================================
    // ページ本文
    // ==========================================

    console.log("================");
    console.log("ページ内容:");

    const text =
      await page.locator("body").innerText();

    console.log(text.slice(0, 10000));

    // ==========================================
    // FORM
    // ==========================================

    console.log("================");
    console.log("FORM");

    const forms = page.locator("form");
    const formCount = await forms.count();

    console.log(
      "フォーム数:",
      formCount
    );

    for (let i = 0; i < formCount; i++) {

      const form = forms.nth(i);

      console.log(
        "FORM",
        i
      );

      console.log(
        "action:",
        await form.getAttribute("action")
      );

      console.log(
        "method:",
        await form.getAttribute("method")
      );

      console.log(
        await form.innerText().catch(() => "")
      );
    }

    // ==========================================
    // INPUT
    // ==========================================

    console.log("================");
    console.log("INPUT");

    const inputs = page.locator("input");
    const inputCount = await inputs.count();

    console.log(
      "input数:",
      inputCount
    );

    for (let i = 0; i < inputCount; i++) {

      const input = inputs.nth(i);

      console.log(
        "INPUT",
        i,
        "type=",
        await input.getAttribute("type"),
        "name=",
        await input.getAttribute("name"),
        "value=",
        await input.getAttribute("value"),
        "id=",
        await input.getAttribute("id"),
        "class=",
        await input.getAttribute("class")
      );
    }

    // ==========================================
    // BUTTON
    // ==========================================

    console.log("================");
    console.log("BUTTON");

    const buttons = page.locator("button");
    const buttonCount = await buttons.count();

    console.log(
      "button数:",
      buttonCount
    );

    for (let i = 0; i < buttonCount; i++) {

      const button = buttons.nth(i);

      console.log(
        "BUTTON",
        i,
        "text=",
        (
          await button.innerText().catch(() => "")
        ).trim(),
        "type=",
        await button.getAttribute("type"),
        "name=",
        await button.getAttribute("name"),
        "value=",
        await button.getAttribute("value"),
        "id=",
        await button.getAttribute("id")
      );
    }

    // ==========================================
    // SELECT
    // ==========================================

    console.log("================");
    console.log("SELECT");

    const selects = page.locator("select");
    const selectCount = await selects.count();

    console.log(
      "select数:",
      selectCount
    );

    for (let i = 0; i < selectCount; i++) {

      const select = selects.nth(i);

      console.log(
        "SELECT",
        i,
        "name=",
        await select.getAttribute("name"),
        "id=",
        await select.getAttribute("id")
      );

      const options =
        select.locator("option");

      const optionCount =
        await options.count();

      for (let j = 0; j < optionCount; j++) {

        const option =
          options.nth(j);

        console.log(
          "  OPTION:",
          (
            await option.innerText().catch(() => "")
          ).trim(),
          "value=",
          await option.getAttribute("value")
        );
      }
    }

    // ==========================================
    // ページ内HTMLの先頭部分
    // ==========================================

    console.log("================");
    console.log("HTML確認");

    const html =
      await page.content();

    console.log(
      html.slice(0, 20000)
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
