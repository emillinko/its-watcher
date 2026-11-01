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
    console.log("PAUL四谷 カレンダー詳細確認");
    console.log("==============================");

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
    }

    // 大人2名
    await page.locator(
      "#reservation_num_people_adult"
    ).selectOption("2");

    await page.waitForTimeout(2000);

    // 日付を取得
    const dates = await page.locator(
      "#timetable-body td.wday"
    ).evaluateAll(cells =>
      cells.map((td, index) => ({
        index,
        weekday: td.querySelector(".day-name")?.textContent.trim(),
        day: td.querySelector(".date-num")?.textContent.trim(),
        className: td.className
      }))
    );

    console.log("");
    console.log("===== 日付 =====");
    console.log(JSON.stringify(dates, null, 2));

    // 時間ごとの空席状態を取得
    const rows = await page.locator(
      "tr.timetable-row"
    ).evaluateAll(rows =>
      rows.map(row => ({
        className: row.className,
        html: row.outerHTML
      }))
    );
    
    console.log("");
    console.log("===== 時間行のHTML =====");
    
    for (const row of rows) {
      console.log("");
      console.log("CLASS:", row.className);
      console.log(row.html);
    }

    console.log("");
    console.log("===== 時間ごとの状態 =====");

    for (const row of rows) {
      console.log("");
      console.log("時間:", row.time);

      row.cells.forEach((cell, index) => {
        const date = dates[index];

        if (!date) return;

        console.log(
          `${date.day}日(${date.weekday})`,
          `class=${cell.className}`,
          `text=${cell.text}`
        );
      });
    }

    console.log("");
    console.log("===== 取得件数 =====");
    console.log("日付:", dates.length);
    console.log("時間帯:", rows.length);
    console.log("==============================");

  } catch (error) {
    console.error("❌ ERROR");
    console.error(error);
    process.exitCode = 1;

  } finally {
    await browser.close();
  }
})();
