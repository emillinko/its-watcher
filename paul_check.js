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
    console.log("PAUL四谷 空席API解析");
    console.log("================================");

    // 通信監視を最初から設定
    page.on("request", request => {
      if (
        request.resourceType() === "xhr" ||
        request.resourceType() === "fetch"
      ) {
        console.log("");
        console.log(">>> REQUEST");
        console.log("METHOD:", request.method());
        console.log("URL:", request.url());

        const postData = request.postData();
        if (postData) {
          console.log("POST DATA:", postData);
        }
      }
    });

    page.on("response", async response => {
      const url = response.url();

      if (
        url.includes("/available") ||
        response.request().resourceType() === "xhr" ||
        response.request().resourceType() === "fetch"
      ) {
        console.log("");
        console.log("<<< RESPONSE");
        console.log("STATUS:", response.status());
        console.log("URL:", url);

        try {
          const text = await response.text();

          if (text.length < 10000) {
            console.log("BODY:");
            console.log(text);
          } else {
            console.log(
              "BODY:",
              text.substring(0, 10000)
            );
            console.log("（長いため途中まで）");
          }
        } catch (e) {
          console.log("BODY取得失敗:", e.message);
        }
      }
    });

    // --------------------------------
    // ページ
    // --------------------------------

    await page.goto(URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(4000);

    // --------------------------------
    // お知らせ同意
    // --------------------------------

    const agreement = page.getByText(
      "「お店からのお知らせ」を読み、内容を理解して同意する",
      { exact: true }
    );

    if (await agreement.count() > 0) {
      console.log("▶ お知らせ同意");
      await agreement.first().click();
      await page.waitForTimeout(1000);
    }

    // --------------------------------
    // 大人2名
    // --------------------------------

    console.log("▶ 大人2名");

    await page.locator(
      "#reservation_num_people_adult"
    ).selectOption("2");

    await page.waitForTimeout(1500);

    // --------------------------------
    // 現在のモーニングビュッフェ
    // --------------------------------

    console.log("▶ モーニングビュッフェ選択");

    const menu = page.locator(
      "#reservation_orders_attributes_1_is_group_order"
    );

    await menu.check({ force: true });

    await page.waitForTimeout(3000);

    // --------------------------------
    // 現在のフォーム状態
    // --------------------------------

    console.log("");
    console.log("========== フォーム情報 ==========");

    const formData = await page.evaluate(() => {
      const oa = window.OnlineAvailability;

      return {
        startAtEpoch:
          typeof ReserveForm !== "undefined"
            ? ReserveForm.startAtEpoch()
            : null,

        numPeople:
          typeof ReserveForm !== "undefined"
            ? ReserveForm.num_people()
            : null,

        sanitizedFormData:
          typeof Reserve !== "undefined"
            ? Reserve.sanitizedFormData()
            : null,

        requestData:
          oa && typeof oa.requestData === "function"
            ? oa.requestData()
            : null,

        requestUrl:
          oa && typeof oa.requestUrl === "function"
            ? oa.requestUrl()
            : null
      };
    });

    console.log(
      JSON.stringify(formData, null, 2)
    );

    // --------------------------------
    // 土曜日の情報
    // --------------------------------

    console.log("");
    console.log("========== 土曜日 ==========");

    const saturday = page.locator(
      "#timetable-body td.wday-6"
    ).first();

    console.log(
      "土曜日:",
      await saturday.innerText()
    );

    // --------------------------------
    // OnlineAvailability.check()
    // --------------------------------

    console.log("");
    console.log("========== 空席チェック ==========");

    console.log(
      "OnlineAvailability.check() を実行"
    );

    const checkResult = await page.evaluate(() => {
      if (
        window.OnlineAvailability &&
        typeof window.OnlineAvailability.check === "function"
      ) {
        return window.OnlineAvailability.check();
      }

      return "OnlineAvailability.check() がありません";
    });

    console.log(
      "check() result:",
      checkResult
    );

    // AJAX完了待ち
    await page.waitForTimeout(5000);

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
