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
    console.log("PAUL四谷 空席取得処理解析");
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

    await page.waitForTimeout(3000);

    // --------------------------------
    // OnlineAvailability の詳細
    // --------------------------------

    console.log("");
    console.log("========== OnlineAvailability 詳細 ==========");

    const details = await page.evaluate(() => {
      const oa = window.OnlineAvailability;

      if (!oa) {
        return {
          exists: false
        };
      }

      const result = {
        exists: true,
        requestUrl: null,
        shop: null,
        liveRequest: null
      };

      try {
        result.requestUrl =
          typeof oa.requestUrl === "function"
            ? oa.requestUrl.toString()
            : oa.requestUrl;
      } catch (e) {
        result.requestUrl = "[error]";
      }

      try {
        result.shop = oa.shop;
      } catch (e) {
        result.shop = "[error]";
      }

      try {
        result.liveRequest = oa.liveRequest;
      } catch (e) {
        result.liveRequest = "[error]";
      }

      return result;
    });

    console.log(
      JSON.stringify(details, null, 2)
    );

    // --------------------------------
    // 関数の中身を取得
    // --------------------------------

    console.log("");
    console.log("========== requestData ==========");

    const functions = await page.evaluate(() => {
      const oa = window.OnlineAvailability;

      const names = [
        "check",
        "isRequiredDataPresent",
        "requestData",
        "sendRequestForSameDay",
        "sendRequestForOtherDay",
        "sendRequest",
        "requestUrl",
        "handleClosedDay",
        "displayMessage"
      ];

      const result = {};

      for (const name of names) {
        try {
          result[name] =
            typeof oa[name] === "function"
              ? oa[name].toString()
              : oa[name];
        } catch (e) {
          result[name] = "[error]";
        }
      }

      return result;
    });

    console.log(
      JSON.stringify(functions, null, 2)
    );

    // --------------------------------
    // Network監視
    // --------------------------------

    console.log("");
    console.log("========== 空席取得通信 ==========");

    const requests = [];

    page.on("request", request => {
      const type = request.resourceType();

      if (
        type === "xhr" ||
        type === "fetch"
      ) {
        requests.push({
          method: request.method(),
          url: request.url(),
          postData: request.postData()
        });
      }
    });

    // --------------------------------
    // 土曜日クリック
    // --------------------------------

    const saturday = page.locator(
      "#timetable-body td.wday-6"
    ).first();

    console.log(
      "土曜日:",
      await saturday.innerText()
    );

    console.log("▶ 土曜日クリック");

    await saturday.click();

    await page.waitForTimeout(5000);

    console.log("");
    console.log(
      "========== クリック後の通信 =========="
    );

    console.log(
      JSON.stringify(
        requests,
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
