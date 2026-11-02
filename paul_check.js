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
    console.log("PAUL四谷 土日選択後の時間帯調査");
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
    // 現在の日付
    // --------------------------------------------------

    async function showCalendar(label) {
      console.log("");
      console.log("========== " + label + " ==========");

      const dates = await page.locator(
        "#timetable-body td.wday"
      ).evaluateAll(cells =>
        cells.map((td, index) => ({
          index,
          weekday: td.querySelector(
            ".day-name"
          )?.textContent.trim(),
          day: td.querySelector(
            ".date-num"
          )?.textContent.trim(),
          className: td.className
        }))
      );

      console.log("日付:");
      console.log(
        JSON.stringify(dates, null, 2)
      );

      const rows = await page.locator(
        "tr.timetable-row"
      ).evaluateAll(rows =>
        rows.map((row, rowIndex) => ({
          rowIndex,
          className: row.className,
          time: row.querySelector(
            "th.time-left"
          )?.textContent.trim(),
          cells: Array.from(
            row.querySelectorAll("td")
          ).map((td, index) => ({
            index,
            className: td.className,
            text: td.textContent.trim()
          }))
        }))
      );

      console.log("時間帯:");
      console.log(
        JSON.stringify(rows, null, 2)
      );
    }

    await showCalendar("選択前");

    // --------------------------------------------------
    // 土曜日をクリック
    // --------------------------------------------------

    console.log("");
    console.log("========== 土曜日をクリック ==========");

    const saturday = page.locator(
      "#timetable-body td.wday.wday-6"
    );

    console.log(
      "土曜日セル数:",
      await saturday.count()
    );

    if (await saturday.count() > 0) {

      console.log(
        "土曜日:",
        await saturday.first().innerText()
      );

      await saturday.first().click({
        force: true
      });

      await page.waitForTimeout(2500);

      console.log("▶ 土曜日クリック完了");

      await showCalendar("土曜日選択後");

    } else {
      console.log("⚠ 土曜日セルが見つかりません");
    }

    // --------------------------------------------------
    // 日曜日をクリック
    // --------------------------------------------------

    console.log("");
    console.log("========== 日曜日をクリック ==========");

    const sunday = page.locator(
      "#timetable-body td.wday.wday-0"
    );

    console.log(
      "日曜日セル数:",
      await sunday.count()
    );

    if (await sunday.count() > 0) {

      console.log(
        "日曜日:",
        await sunday.first().innerText()
      );

      await sunday.first().click({
        force: true
      });

      await page.waitForTimeout(2500);

      console.log("▶ 日曜日クリック完了");

      await showCalendar("日曜日選択後");

    } else {
      console.log("⚠ 日曜日セルが見つかりません");
    }

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
