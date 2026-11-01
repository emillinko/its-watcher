
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
    console.log("PAUL四谷 メニュー選択テスト");
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

    // メニューの周辺HTMLを確認
    const menuDetails = await page.locator(
      "label.order.menu-item-order-btn"
    ).evaluateAll(labels =>
      labels.map(label => ({
        text: label.innerText.trim(),
        parentHTML: label.parentElement?.parentElement?.outerHTML
      }))
    );

    console.log("");
    console.log("===== メニュー詳細 =====");
    console.log(JSON.stringify(menuDetails, null, 2));

    // 2番目のメニューを選択
    const secondMenu = page.locator(
      "#reservation_orders_attributes_1_is_group_order"
    );

    if (await secondMenu.count() > 0) {
      await secondMenu.check({ force: true });
      console.log("");
      console.log("▶ 2番目のメニューを選択");
    } else {
      console.log("2番目のメニューが見つかりません");
    }

    await page.waitForTimeout(3000);

    // 選択状態
    console.log(
      "2番目のメニュー選択状態:",
      await secondMenu.isChecked()
    );

    // 日付
    const dates = await page.locator(
      "#timetable-body td.wday"
    ).evaluateAll(cells =>
      cells.map(td => ({
        weekday: td.querySelector(".day-name")?.textContent.trim(),
        day: td.querySelector(".date-num")?.textContent.trim(),
        className: td.className
      }))
    );

    console.log("");
    console.log("===== 日付 =====");
    console.log(JSON.stringify(dates, null, 2));

    // 時間行
    const rows = await page.locator(
      "tr.timetable-row"
    ).evaluateAll(rows =>
      rows.map(row => ({
        className: row.className,
        html: row.outerHTML
      }))
    );

    console.log("");
    console.log("===== メニュー選択後の時間行 =====");

    for (const row of rows) {
      console.log("");
      console.log(row.html);
    }

    console.log("");
    console.log("==============================");

  } catch (error) {
    console.error("ERROR:", error);
    process.exitCode = 1;

  } finally {
    await browser.close();
  }
})();
