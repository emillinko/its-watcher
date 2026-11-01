
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
    console.log("PAUL四谷 メニュー確認");
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

    // メニュー一覧
    const menus = await page.locator(
      "label.order.menu-item-order-btn"
    ).evaluateAll(labels =>
      labels.map(label => {
        const checkbox = label.querySelector("input");

        return {
          text: label.innerText.trim(),
          checkboxId: checkbox?.id,
          checked: checkbox?.checked,
          disabled: checkbox?.disabled
        };
      })
    );

    console.log("");
    console.log("===== メニュー一覧 =====");
    console.log(JSON.stringify(menus, null, 2));

    // 時間行の状態
    const rows = await page.locator(
      "tr.timetable-row"
    ).evaluateAll(rows =>
      rows.map(row => ({
        className: row.className,
        time: row.querySelector(".time-left")?.textContent.trim(),
        cellCount: row.querySelectorAll("td").length,
        html: row.outerHTML
      }))
    );

    console.log("");
    console.log("===== 時間行 =====");
    console.log(JSON.stringify(rows, null, 2));

  } catch (error) {
    console.error("ERROR:", error);
    process.exitCode = 1;

  } finally {
    await browser.close();
  }
})();
