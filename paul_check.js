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
    console.log("PAUL四谷 土曜日選択後の時間帯確認");
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

    // 現在のモーニングビュッフェ 3,080円
    const menu = page.locator(
      "#reservation_orders_attributes_1_is_group_order"
    );

    await menu.check({ force: true });

    await page.waitForTimeout(2500);

    console.log(
      "▶ 3,080円メニュー選択:",
      await menu.isChecked()
    );

    // --------------------------------
    // 土曜日のセルを取得
    // --------------------------------

    const saturday = page.locator(
      "#timetable-body td.wday-6"
    ).first();

    console.log("");
    console.log("土曜日セル数:", await saturday.count());

    if (await saturday.count() === 0) {
      throw new Error("土曜日のセルが見つかりません");
    }

    console.log(
      "土曜日:",
      await saturday.innerText()
    );

    // 土曜日をクリック
    console.log("▶ 土曜日をクリック");

    await saturday.click();

    await page.waitForTimeout(3000);

    // --------------------------------
    // 選択後の状態
    // --------------------------------

    console.log("");
    console.log("========== 土曜日選択後 ==========");

    const selected = await page.locator(
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

    console.log(
      JSON.stringify(selected, null, 2)
    );

    // --------------------------------
    // 時間帯を取得
    // --------------------------------

    const rows = await page.locator(
      "tr.timetable-row"
    ).evaluateAll(rows =>
      rows.map((row, rowIndex) => ({
        rowIndex,
        className: row.className,

        timeLeft: row.querySelector(
          "th.time-left"
        )?.textContent.trim(),

        timeRight: row.querySelector(
          "th.time-right"
        )?.textContent.trim(),

        cells: Array.from(
          row.querySelectorAll("td")
        ).map((td, cellIndex) => ({
          cellIndex,
          className: td.className,
          text: td.textContent.trim(),
          html: td.innerHTML
        }))
      }))
    );

    console.log("");
    console.log("========== 時間帯 ==========");

    console.log(
      JSON.stringify(rows, null, 2)
    );

    // --------------------------------
    // 表示されている時間帯だけ
    // --------------------------------

    console.log("");
    console.log("========== 表示されている時間 ==========");

    const visibleRows =
      await page.locator(
        "tr.timetable-row"
      ).evaluateAll(rows =>
        rows
          .filter(row => {
            const style =
              window.getComputedStyle(row);

            return (
              style.display !== "none" &&
              style.visibility !== "hidden"
            );
          })
          .map(row => ({
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

    console.log(
      JSON.stringify(
        visibleRows,
        null,
        2
      )
    );

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
