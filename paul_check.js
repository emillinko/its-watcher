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
    console.log("PAUL四谷 日付・時間取得テスト");
    console.log("==============================");

    await page.goto(URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // お知らせ同意
    const agreement = page.getByText(
      "「お店からのお知らせ」を読み、内容を理解して同意する",
      { exact: true }
    );

    if (await agreement.count() > 0) {
      await agreement.first().click();
      await page.waitForTimeout(500);
    }

    // 大人2名
    await page.locator("#reservation_num_people_adult")
      .selectOption("2");

    console.log("▶ 大人2名を選択");

    // 日付入力欄
    const dateInput = page.locator("#reservation_start_date");

    console.log(
      "日付入力欄:",
      await dateInput.count()
    );

    console.log(
      "現在の日付値:",
      await dateInput.inputValue()
    );

    // まずカレンダーを開く
    console.log("▶ 日付欄をクリック");

    await dateInput.click();

    await page.waitForTimeout(1000);

    console.log("");
    console.log("===== カレンダー表示後 =====");

    console.log(
      (await page.locator("body").innerText()).slice(0, 10000)
    );

    console.log("============================");

    // 時間selectの状態
    const timeSelect =
      page.locator("#reservation_start_at_epoch");

    console.log("");
    console.log("===== 時間候補 =====");

    const options =
      await timeSelect.locator("option").evaluateAll(
        options =>
          options.map(o => ({
            text: o.textContent.trim(),
            value: o.value,
            disabled: o.disabled
          }))
      );

    console.log(JSON.stringify(options, null, 2));

    console.log(
      "時間select disabled:",
      await timeSelect.isDisabled()
    );

  } catch (error) {
    console.error("");
    console.error("❌ ERROR");
    console.error(error);
    process.exitCode = 1;

  } finally {
    await browser.close();
  }
})();
