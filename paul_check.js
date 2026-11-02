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
    console.log("PAUL四谷 OnlineAvailability解析");
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

    // 現在のモーニングビュッフェ
    await page.locator(
      "#reservation_orders_attributes_1_is_group_order"
    ).check({ force: true });

    await page.waitForTimeout(2500);

    // --------------------------------
    // OnlineAvailability の状態
    // --------------------------------

    console.log("");
    console.log("========== OnlineAvailability ==========");

    const oa = await page.evaluate(() => {
      const obj = window.OnlineAvailability;

      if (!obj) {
        return {
          exists: false
        };
      }

      return {
        exists: true,
        keys: Object.keys(obj),
        properties: Object.getOwnPropertyNames(obj),
        isShow: obj.isShow,
        autoAccept: obj.autoAccept
      };
    });

    console.log(
      JSON.stringify(oa, null, 2)
    );

    // --------------------------------
    // windowにある関連オブジェクト
    // --------------------------------

    console.log("");
    console.log("========== 関連オブジェクト ==========");

    const globals = await page.evaluate(() => {
      return Object.keys(window)
        .filter(key =>
          /availability|timetable|reserve|calendar|date/i.test(key)
        )
        .sort();
    });

    console.log(
      JSON.stringify(globals, null, 2)
    );

    // --------------------------------
    // JavaScriptファイル一覧
    // --------------------------------

    console.log("");
    console.log("========== JavaScriptファイル ==========");

    const jsFiles = await page.locator(
      'script[src]'
    ).evaluateAll(scripts =>
      scripts.map(script => script.src)
    );

    console.log(
      JSON.stringify(jsFiles, null, 2)
    );

    // --------------------------------
    // 土曜日クリック
    // --------------------------------

    const saturday = page.locator(
      "#timetable-body td.wday-6"
    ).first();

    console.log("");
    console.log(
      "土曜日:",
      await saturday.innerText()
    );

    console.log("▶ 土曜日クリック");

    await saturday.click();

    await page.waitForTimeout(3000);

    // --------------------------------
    // クリック後のOnlineAvailability
    // --------------------------------

    console.log("");
    console.log(
      "========== クリック後 OnlineAvailability =========="
    );

    const after = await page.evaluate(() => {
      const obj = window.OnlineAvailability;

      if (!obj) {
        return {
          exists: false
        };
      }

      const result = {
        exists: true,
        keys: Object.keys(obj),
        properties: Object.getOwnPropertyNames(obj)
      };

      for (const key of Object.keys(obj)) {
        try {
          const value = obj[key];

          if (
            typeof value !== "function" &&
            typeof value !== "object"
          ) {
            result[key] = value;
          }
        } catch (e) {
          result[key] = "[error]";
        }
      }

      return result;
    });

    console.log(
      JSON.stringify(after, null, 2)
    );

    // --------------------------------
    // timetableのhidden状態
    // --------------------------------

    console.log("");
    console.log(
      "========== timetable =========="
    );

    const rows = await page.locator(
      "tr.timetable-row"
    ).evaluateAll(rows =>
      rows.map(row => ({
        time:
          row.querySelector(
            "th.time-left"
          )?.textContent.trim(),

        className: row.className,

        display:
          window.getComputedStyle(row).display,

        cells:
          Array.from(
            row.querySelectorAll("td")
          ).map((td, index) => ({
            index,
            className: td.className,
            text: td.textContent.trim(),
            html: td.innerHTML
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
