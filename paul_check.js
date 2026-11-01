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
    console.log("PAUL四谷 カレンダー構造調査");
    console.log("================================");

    await page.goto(URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(4000);

    // お知らせ同意
    const agreement = page.getByText(
      "「お店からのお知らせ」を読み、内容を理解して同意する",
      { exact: true }
    );

    if (await agreement.count() > 0) {
      await agreement.first().click();
      await page.waitForTimeout(1000);
      console.log("▶ お知らせ同意");
    }

    // 大人2名
    await page.locator(
      "#reservation_num_people_adult"
    ).selectOption("2");

    await page.waitForTimeout(1000);
    console.log("▶ 大人2名");

    // 現行3,080円メニュー
    const menu = page.locator(
      "#reservation_orders_attributes_1_is_group_order"
    );

    await menu.check({ force: true });
    await page.waitForTimeout(2500);

    console.log(
      "▶ 3,080円メニュー選択:",
      await menu.isChecked()
    );

    // --------------------------------------------------
    // カレンダー本体
    // --------------------------------------------------

    console.log("");
    console.log("========== カレンダー本体 ==========");

    const calendar = page.locator("#timetable-body");

    if (await calendar.count() === 0) {
      console.log("⚠ #timetable-body が見つかりません");
    } else {
      const calendarHtml = await calendar.evaluate(
        el => el.outerHTML
      );

      console.log(calendarHtml);
    }

    // --------------------------------------------------
    // 日付セル
    // --------------------------------------------------

    console.log("");
    console.log("========== 日付セル ==========");

    const dates = await page.locator(
      "#timetable-body td.wday"
    ).evaluateAll(cells =>
      cells.map((td, index) => ({
        index,
        text: td.textContent.trim(),
        html: td.innerHTML,
        className: td.className
      }))
    );

    console.log(
      JSON.stringify(dates, null, 2)
    );

    // --------------------------------------------------
    // 時間行
    // --------------------------------------------------

    console.log("");
    console.log("========== 時間行 ==========");

    const rows = await page.locator(
      "tr.timetable-row"
    ).evaluateAll(rows =>
      rows.map((row, rowIndex) => ({
        rowIndex,
        className: row.className,
        html: row.outerHTML
      }))
    );

    console.log(
      JSON.stringify(rows, null, 2)
    );

    // --------------------------------------------------
    // 週送りボタン
    // --------------------------------------------------

    console.log("");
    console.log("========== 週送りボタン ==========");

    const buttons = await page.locator(
      ".next_prev_btn"
    ).evaluateAll(elements =>
      elements.map((el, index) => ({
        index,
        tag: el.tagName,
        className: el.className,
        text: el.textContent.trim(),
        href: el.getAttribute("href"),
        data: Array.from(el.attributes).reduce(
          (obj, attr) => {
            obj[attr.name] = attr.value;
            return obj;
          },
          {}
        )
      }))
    );

    console.log(
      JSON.stringify(buttons, null, 2)
    );

    console.log("");
    console.log("================================");
    console.log("調査終了");

  } catch (error) {
    console.error("");
    console.error("❌ ERROR");
    console.error(error);
    process.exitCode = 1;

  } finally {
    await browser.close();
  }
})();
