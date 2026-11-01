
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
    console.log("PAUL四谷 週送りカレンダー確認");
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

    await page.waitForTimeout(1500);
    console.log("▶ 大人2名");

    // 3,080円のモーニングビュッフェを選択
    const menu = page.locator(
      "#reservation_orders_attributes_1_is_group_order"
    );

    await menu.check({ force: true });
    await page.waitForTimeout(2500);

    console.log(
      "▶ 3,080円メニュー選択:",
      await menu.isChecked()
    );

    // カレンダー情報を取得する関数
    async function readCalendar(label) {
      console.log("");
      console.log("========== " + label + " ==========");

      const month = await page.locator(
        "th.month"
      ).allTextContents();

      console.log("表示月:", month);

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
      console.log(JSON.stringify(dates, null, 2));

      const rows = await page.locator(
        "tr.timetable-row"
      ).evaluateAll(rows =>
        rows.map(row => ({
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
      console.log(JSON.stringify(rows, null, 2));

      console.log("時間行数:", rows.length);
    }

    // 現在の週
    await readCalendar("現在の週");

    // 次の週へ移動
    const nextButton = page.locator(
      "a.next-week:visible"
    );

    console.log("");
    console.log("次週ボタン数:", await nextButton.count());

    if (await nextButton.count() > 0) {
      await nextButton.first().click();
      await page.waitForTimeout(2500);

      // 次の週
      await readCalendar("次の週");

    } else {
      console.log("⚠ 次週ボタンが見つかりません");
    }

    console.log("");
    console.log("================================");
    console.log("確認終了");

  } catch (error) {
    console.error("");
    console.error("❌ ERROR");
    console.error(error);
    process.exitCode = 1;

  } finally {
    await browser.close();
  }
})();
