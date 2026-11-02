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
    console.log("PAUL四谷 土日モーニング空席チェック");
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

    await page.waitForTimeout(1000);

    // 現在のモーニングビュッフェ
    await page.locator(
      "#reservation_orders_attributes_1_is_group_order"
    ).check({ force: true });

    await page.waitForTimeout(2000);

    // フォーム情報取得
    const info = await page.evaluate(() => {
      const data = Reserve.sanitizedFormData();

      return {
        token: data.authenticity_token,
        requestData: OnlineAvailability.requestData()
      };
    });

    console.log("");
    console.log("大人: 2名");
    console.log("メニュー: モーニングビュッフェ");
    console.log("");

    // APIを直接呼び出す
    const result = await page.evaluate(
      async ({ token, requestData }) => {

        const params = new URLSearchParams();

        params.append(
          "authenticity_token",
          token
        );

        params.append(
          "reservation[num_people_adult]",
          requestData.reservation.num_people_adult
        );

        params.append(
          "reservation[num_people_baby]",
          requestData.reservation.num_people_baby || ""
        );

        const order =
          requestData.reservation.orders_attributes[0];

        params.append(
          "reservation[orders_attributes][0][menu_item_id]",
          order.menu_item_id
        );

        params.append(
          "reservation[orders_attributes][0][is_group_order]",
          order.is_group_order
        );

        params.append(
          "reservation[start_date]",
          new Date().toISOString().slice(0, 10)
        );

        const url =
          "/ja/shops/paul-yotsuya/available/timetable?" +
          params.toString();

        const response = await fetch(url, {
          credentials: "same-origin"
        });

        return {
          status: response.status,
          data: await response.json()
        };
      },
      info
    );

    console.log("");
    console.log("========== API結果 ==========");

    console.log(
      JSON.stringify(result, null, 2)
    );

    // 空席だけ抽出
    console.log("");
    console.log("========== 空席だけ ==========");

    const available = [];

    const slots =
      result.data?.data?.slots || {};

    for (const [date, times] of Object.entries(slots)) {

      for (const [epoch, slot] of Object.entries(times)) {

        if (
          slot.available === true &&
          slot.meal === "breakfast"
        ) {
          const dateObj = new Date(
            Number(epoch) * 1000
          );

          const dateText =
            new Intl.DateTimeFormat("ja-JP", {
              timeZone: "Asia/Tokyo",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              weekday: "short"
            }).format(dateObj);

          const timeText =
            new Intl.DateTimeFormat("ja-JP", {
              timeZone: "Asia/Tokyo",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false
            }).format(dateObj);

          available.push({
            date: dateText,
            time: timeText
          });
        }
      }
    }

    if (available.length === 0) {

      console.log("空きなし");

    } else {

      console.log("🎉 空きあり！");

      for (const item of available) {
        console.log(
          item.date + " " + item.time
        );
      }
    }

    console.log("");
    console.log("================================");
    console.log("チェック終了");

  } catch (error) {

    console.error("");
    console.error("❌ ERROR");
    console.error(error);

    process.exitCode = 1;

  } finally {

    await browser.close();

  }
})();
```
