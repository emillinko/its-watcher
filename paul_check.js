const { chromium } = require("playwright");

const URL =
  "https://www.tablecheck.com/ja/shops/paul-yotsuya/reserve";

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage({
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo"
  });

  try {
    console.log("PAUL四谷 空席取得テスト");
    console.log("==============================");

    await page.goto(URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    console.log("ページ読み込み完了");

    // --------------------------------------------------
    // ① 「お店からのお知らせ」の同意
    // --------------------------------------------------

    const agreement = page.getByText(
      "「お店からのお知らせ」を読み、内容を理解して同意する",
      { exact: true }
    );

    if (await agreement.count() > 0) {
      console.log("▶ お知らせ同意をクリック");

      await agreement.first().click();

      await page.waitForTimeout(1000);
    }

    // --------------------------------------------------
    // ② 大人2名
    // --------------------------------------------------

    console.log("▶ 大人2名を選択");

    const adult2 = page.getByText("2", { exact: true });

    console.log(
      "「2」の候補数:",
      await adult2.count()
    );

    // 画面上の「大人」付近を調査
    const adults = await page.locator("body").innerText();

    console.log("");
    console.log("===== 現在の画面 =====");
    console.log(adults);
    console.log("=====================");
    console.log("");

    // --------------------------------------------------
    // ③ 「選択する」を探す
    // --------------------------------------------------

    const selectButtons = page.getByText(
      "選択する",
      { exact: true }
    );

    console.log(
      "「選択する」数:",
      await selectButtons.count()
    );

    // --------------------------------------------------
    // ④ HTML上のフォーム要素を調査
    // --------------------------------------------------

    const inputs = await page.locator("input").evaluateAll(inputs =>
      inputs.map((input, index) => ({
        index,
        type: input.type,
        name: input.name,
        value: input.value,
        placeholder: input.placeholder,
        id: input.id,
        ariaLabel: input.getAttribute("aria-label")
      }))
    );

    console.log("");
    console.log("===== INPUTS =====");

    for (const input of inputs) {
      console.log(JSON.stringify(input));
    }

    console.log("==================");

    // --------------------------------------------------
    // ⑤ SELECT要素
    // --------------------------------------------------

    const selects = await page.locator("select").evaluateAll(selects =>
      selects.map((select, index) => ({
        index,
        name: select.name,
        id: select.id,
        value: select.value,
        options: Array.from(select.options).map(o => ({
          text: o.text,
          value: o.value
        }))
      }))
    );

    console.log("");
    console.log("===== SELECTS =====");

    for (const select of selects) {
      console.log(JSON.stringify(select, null, 2));
    }

    console.log("===================");

    // --------------------------------------------------
    // ⑥ ボタン
    // --------------------------------------------------

    const buttons = await page.locator("button").evaluateAll(buttons =>
      buttons.map((button, index) => ({
        index,
        text: (button.innerText || "").trim(),
        type: button.type,
        disabled: button.disabled,
        ariaLabel: button.getAttribute("aria-label")
      }))
    );

    console.log("");
    console.log("===== BUTTONS =====");

    for (const button of buttons) {
      if (
        button.text ||
        button.ariaLabel
      ) {
        console.log(JSON.stringify(button));
      }
    }

    console.log("===================");

    // --------------------------------------------------
    // スクリーンショット
    // --------------------------------------------------

    await page.screenshot({
      path: "paul-debug.png",
      fullPage: true
    });

    console.log("");
    console.log("スクリーンショット保存: paul-debug.png");

  } catch (error) {
    console.error("");
    console.error("❌ ERROR");
    console.error(error);
    process.exitCode = 1;

  } finally {
    await browser.close();
  }
})();
