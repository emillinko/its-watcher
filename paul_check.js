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
    console.log("PAUL四谷 土日空席チェック");
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

    console.log("▶ 大人2名");
    console.log("");

    // カレンダーの実データを取得
    const result = await page.locator("#timetable-body").evaluate(() => {

      const header = document.querySelector(
        "tr:not(.timetable-row):not(.timetable-fake-row)"
      );

      if (!header) {
        return {
          error: "カレンダーのヘッダーが見つかりません"
        };
      }

      const dayCells = Array.from(
        document.querySelectorAll(
          "tr#timetable-body td.wday"
        )
      );

      const dates = dayCells.map(td => ({
        weekday: td.querySelector(".day-name")?.textContent.trim(),
        day: td.querySelector(".date-num")?.textContent.trim(),
        closed: td.classList.contains("day-closed")
      }));

      // 時間ごとの行
      const timeRows = Array.from(
        document.querySelectorAll(
          "tr.timetable-row:not(.timetable-fake-row)"
        )
      );

      const times = timeRows.map(row => {
        const time =
          row.querySelector(".time-left")?.textContent.trim();

        const cells = Array.from(
          row.querySelectorAll("td")
        );

        return {
          time,
          cells: cells.map(td => ({
            available:
              !td.classList.contains("not_available") &&
              !td.classList.contains("closed"),
            className: td.className,
            text: td.textContent.trim()
          }))
        };
      });

      return {
        dates,
        times
      };
    });

    console.log("===== カレンダー解析 =====");

    if (result.error) {
      console.log(result.error);
      return;
    }

    console.log(
      "日付:",
      JSON.stringify(result.dates, null, 2)
    );

    console.log(
      "時間:",
      JSON.stringify(result.times, null, 2)
    );

    console.log("==========================");

    // ------------------------------------------
    // 土日だけ空席を抽出
    // ------------------------------------------

    const available = [];

    for (let i = 0; i < result.dates.length; i++) {

      const date = result.dates[i];

      // 土曜・日曜のみ
      if (
        date.weekday !== "土" &&
        date.weekday !== "日"
      ) {
        continue;
      }

      // day-closed は除外
      if (date.closed) {
        continue;
      }

      for (const time of result.times) {

        if (!time.time) continue;

        const cell = time.cells[i];

        if (!cell) continue;

        if (cell.available) {
          available.push({
            day: date.day,
            weekday: date.weekday,
            time: time.time
          });
        }
      }
    }

    console.log("");
    console.log("===== 🎉 空席候補 =====");

    if (available.length === 0) {
      console.log("現在、土日の空席候補はありません。");
    } else {
      for (const item of available) {
        console.log(
          `${item.day}日（${item.weekday}） ${item.time}`
        );
      }
    }

    console.log("======================");

  } catch (error) {

    console.error("");
    console.error("❌ ERROR");
    console.error(error);
    process.exitCode = 1;

  } finally {

    await browser.close();

  }
})();
