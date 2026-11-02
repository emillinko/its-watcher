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
    console.log("PAUL四谷 日付クリック時の変化確認");
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
    const menu = page.locator(
      "#reservation_orders_attributes_1_is_group_order"
    );

    await menu.check({ force: true });

    await page.waitForTimeout(2500);

    console.log("▶ 初期状態取得");

    // --------------------------------
    // 日付セルのHTML
    // --------------------------------

    const saturday = page.locator(
      "#timetable-body td.wday-6"
    ).first();

    if (await saturday.count() === 0) {
      throw new Error("土曜日が見つかりません");
    }

    console.log("");
    console.log("土曜日セルHTML:");
    console.log(
      await saturday.evaluate(el => el.outerHTML)
    );

    // --------------------------------
    // クリック前の主要要素
    // --------------------------------

    async function snapshot(label) {
      console.log("");
      console.log("========== " + label + " ==========");

      const info = await page.evaluate(() => {
        const selectors = [
          "#timetable-body",
          "#timetable-body",
          ".timetable",
          ".reservation-time",
          ".time-list",
          ".times",
          ".slot",
          "[class*='timetable']",
          "[class*='time']"
        ];

        const result = {};

        for (const selector of selectors) {
          const elements =
            document.querySelectorAll(selector);

          result[selector] = Array.from(elements)
            .slice(0, 30)
            .map(el => ({
              tag: el.tagName,
              id: el.id,
              className: el.className,
              text: el.innerText?.trim().slice(0, 300),
              display:
                window.getComputedStyle(el).display,
              visibility:
                window.getComputedStyle(el).visibility
            }));
        }

        return result;
      });

      console.log(
        JSON.stringify(info, null, 2)
      );
    }

    await snapshot("クリック前");

    // --------------------------------
    // リクエスト監視
    // --------------------------------

    const requests = [];

    page.on("request", request => {
      const url = request.url();

      if (
        request.resourceType() === "xhr" ||
        request.resourceType() === "fetch"
      ) {
        requests.push({
          method: request.method(),
          url
        });
      }
    });

    // --------------------------------
    // 土曜日クリック
    // --------------------------------

    console.log("");
    console.log("▶ 土曜日クリック");

    await saturday.click();

    // AJAXなどが終わるのを待つ
    await page.waitForTimeout(5000);

    // --------------------------------
    // クリック後
    // --------------------------------

    await snapshot("クリック後");

    // --------------------------------
    // リクエスト一覧
    // --------------------------------

    console.log("");
    console.log("========== クリック時の通信 ==========");

    console.log(
      JSON.stringify(
        requests,
        null,
        2
      )
    );

    // --------------------------------
    // timetable row
    // --------------------------------

    console.log("");
    console.log("========== timetable rows ==========");

    const rows = await page.locator(
      "tr.timetable-row"
    ).evaluateAll(rows =>
      rows.map(row => ({
        className: row.className,
        display:
          window.getComputedStyle(row).display,
        visibility:
          window.getComputedStyle(row).visibility,
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
