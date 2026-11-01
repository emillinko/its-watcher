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
    console.log("PAUL四谷 日付選択テスト");
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

    // 日付欄をクリック
    await page.locator("#reservation_start_date").click();

    await page.waitForTimeout(1000);

    console.log("▶ カレンダー表示");

    // カレンダー内の「1」を探す
    const ones = await page.locator(
      ".mbsc-calendar-cell, .mbsc-cal-day, td, button"
    ).evaluateAll(elements =>
      elements
        .map((el, index) => ({
          index,
          tag: el.tagName,
          text: (el.innerText || el.textContent || "").trim(),
          class: el.className,
          id: el.id,
          ariaLabel: el.getAttribute("aria-label"),
          disabled:
            el.disabled ||
            el.getAttribute("aria-disabled") === "true"
        }))
        .filter(x => x.text === "1")
    );

    console.log("");
    console.log("===== 「1」の候補 =====");
    console.log(JSON.stringify(ones, null, 2));
    console.log("======================");

    // カレンダー内のクリック可能な日付を調査
    const dateElements = await page.locator(
      ".mbsc-calendar-cell, .mbsc-cal-day, td, button"
    ).evaluateAll(elements =>
      elements
        .map((el, index) => ({
          index,
          tag: el.tagName,
          text: (el.innerText || el.textContent || "").trim(),
          class: el.className,
          id: el.id,
          ariaLabel: el.getAttribute("aria-label"),
          role: el.getAttribute("role"),
          disabled:
            el.disabled ||
            el.getAttribute("aria-disabled") === "true"
        }))
        .filter(x =>
          /^\d{1,2}$/.test(x.text)
        )
    );

    console.log("");
    console.log("===== 日付要素 =====");
    console.log(JSON.stringify(dateElements, null, 2));
    console.log("====================");

    // 時間selectの状態
    const timeSelect =
      page.locator("#reservation_start_at_epoch");

    console.log("");
    console.log("===== クリック前の時間 =====");

    console.log(
      "disabled:",
      await timeSelect.isDisabled()
    );

    // カレンダー内で最初に見つかった「1」をクリック
    const dateOne = page.locator(
      ".mbsc-calendar-cell, .mbsc-cal-day, td, button"
    ).filter({
      hasText: /^1$/
    }).first();

    console.log(
      "クリック対象「1」:",
      await dateOne.count()
    );

    if (await dateOne.count() > 0) {
      console.log("▶ 「1」をクリック");

      await dateOne.click();

      // TableCheck側の更新を待つ
      await page.waitForTimeout(2000);
    }

    console.log("");
    console.log("===== 日付選択後 =====");

    console.log(
      "選択された日付:",
      await page.locator("#reservation_start_date").inputValue()
    );

    console.log(
      "時間select disabled:",
      await timeSelect.isDisabled()
    );

    const options =
      await timeSelect.locator("option").evaluateAll(
        options =>
          options.map(o => ({
            text: o.textContent.trim(),
            value: o.value,
            disabled: o.disabled
          }))
      );

    console.log("");
    console.log("===== 時間候補 =====");
    console.log(JSON.stringify(options, null, 2));
    console.log("====================");

  } catch (error) {
    console.error("");
    console.error("❌ ERROR");
    console.error(error);
    process.exitCode = 1;

  } finally {
    await browser.close();
  }
})();
