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
    console.log("PAUL四谷 カレンダーJavaScript解析");
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
    }

    // 大人2名
    await page.locator(
      "#reservation_num_people_adult"
    ).selectOption("2");

    await page.waitForTimeout(1500);

    // 3,080円メニュー
    await page.locator(
      "#reservation_orders_attributes_1_is_group_order"
    ).check({ force: true });

    await page.waitForTimeout(2500);

    // --------------------------------
    // 土曜日セル
    // --------------------------------

    const saturday = page.locator(
      "#timetable-body td.wday-6"
    ).first();

    if (await saturday.count() === 0) {
      throw new Error("土曜日セルが見つかりません");
    }

    console.log("▶ 土曜日:", await saturday.innerText());

    // --------------------------------
    // 土曜日セルの親要素を調査
    // --------------------------------

    console.log("");
    console.log("========== 土曜日周辺HTML ==========");

    const surroundingHTML =
      await saturday.evaluate(el => {
        let parent = el;

        for (let i = 0; i < 4 && parent; i++) {
          parent = parent.parentElement;
        }

        return parent?.outerHTML || "";
      });

    console.log(surroundingHTML);

    // --------------------------------
    // 土曜日セルに設定されている属性
    // --------------------------------

    console.log("");
    console.log("========== 土曜日属性 ==========");

    const attributes =
      await saturday.evaluate(el =>
        Array.from(el.attributes).map(attr => ({
          name: attr.name,
          value: attr.value
        }))
      );

    console.log(
      JSON.stringify(attributes, null, 2)
    );

    // --------------------------------
    // timetable関連のscriptを探す
    // --------------------------------

    console.log("");
    console.log("========== timetable関連script ==========");

    const scripts = await page.locator("script").allTextContents();

    const matched = scripts.filter(text =>
      /timetable|next-week|wday|not_available|reservation/i.test(text)
    );

    console.log("該当script数:", matched.length);

    matched.forEach((text, index) => {
      console.log("");
      console.log("----- script", index, "-----");
      console.log(text.slice(0, 15000));
    });

    // --------------------------------
    // 土曜日クリック
    // --------------------------------

    console.log("");
    console.log("▶ 土曜日クリック");

    await saturday.click();

    await page.waitForTimeout(3000);

    console.log("");
    console.log("========== クリック後 ==========");

    const rows =
      await page.locator(
        "tr.timetable-row"
      ).evaluateAll(rows =>
        rows.map(row => ({
          className: row.className,
          display:
            window.getComputedStyle(row).display,
          time:
            row.querySelector(
              "th.time-left"
            )?.textContent.trim(),
          cells:
            Array.from(
              row.querySelectorAll("td")
            ).map((td, index) => ({
              index,
              className: td.className,
              text: td.textContent.trim()
            }))
        }))
      );

    console.log(
      JSON.stringify(rows, null, 2)
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
