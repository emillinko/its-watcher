const { chromium } = require("playwright");

const URL = "https://www.tablecheck.com/ja/shops/paul-yotsuya/reserve";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo"
  });

  try {
    console.log("PAUL四谷 空席チェック");
    console.log("==============================");

    await page.goto(URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(4000);

    const agreement = page.getByText(
      "「お店からのお知らせ」を読み、内容を理解して同意する",
      { exact: true }
    );

    if (await agreement.count() > 0) {
      await agreement.first().click();
      await page.waitForTimeout(1000);
    }

    await page.locator(
      "#reservation_num_people_adult"
    ).selectOption("2");

    await page.waitForTimeout(1000);

    await page.locator(
      "#reservation_orders_attributes_1_is_group_order"
    ).check({ force: true });

    await page.waitForTimeout(2000);

    const info = await page.evaluate(() => {
      const data = Reserve.sanitizedFormData();

      return {
        token: data.authenticity_token,
        requestData: OnlineAvailability.requestData()
      };
    });

    console.log("大人: 2名");
    console.log("メニュー: モーニングビュッフェ");

    const result = await page.evaluate(async (info) => {
      const params = new URLSearchParams();
      const order = info.requestData.reservation.orders_attributes[0];

      params.append("authenticity_token", info.token);
      params.append(
        "reservation[num_people_adult]",
        info.requestData.reservation.num_people_adult
      );
      params.append(
        "reservation[num_people_baby]",
        info.requestData.reservation.num_people_baby || ""
      );
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

      const apiUrl =
        "/ja/shops/paul-yotsuya/available/timetable?" +
        params.toString();

      const response = await fetch(apiUrl, {
        credentials: "same-origin"
      });

      return {
        status: response.status,
        data: await response.json()
      };
    }, info);

    console.log("");
    console.log("========== API結果 ==========");

    console.log(
      JSON.stringify(result, null, 2)
    );

    console.log("");
    console.log("========== 空席だけ ==========");

    const slots =
      result.data &&
      result.data.data &&
      result.data.data.slots
        ? result.data.data.slots
        : {};

    let count = 0;

    for (const date in slots) {
      const times = slots[date];

      for (const epoch in times) {
        const slot = times[epoch];

        if (
          slot.available === true &&
          slot.meal === "breakfast"
        ) {
          const d = new Date(Number(epoch) * 1000);

          const dateText =
            new Intl.DateTimeFormat("ja-JP", {
              timeZone: "Asia/Tokyo",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              weekday: "short"
            }).format(d);

          const timeText =
            new Intl.DateTimeFormat("ja-JP", {
              timeZone: "Asia/Tokyo",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false
            }).format(d);

          console.log(
            dateText + " " + timeText + " ← 空きあり"
          );

          count++;
        }
      }
    }

    if (count === 0) {
      console.log("空きなし");
    }

    console.log("");
    console.log("==============================");
    console.log("チェック終了");

  } catch (error) {
    console.error("ERROR");
    console.error(error);
    process.exitCode = 1;
  }

  await browser.close();
})();
