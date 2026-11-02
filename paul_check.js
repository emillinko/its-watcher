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
      console.log("▶ お知らせ同意");
      await agreement.first().click();
      await page.waitForTimeout(1000);
    }

    // 大人2名
    console.log("▶ 大人2名");

    await page.locator(
      "#reservation_num_people_adult"
    ).selectOption("2");

    await page.waitForTimeout(1000);

    // モーニングビュッフェ
    console.log("▶ モーニングビュッフェ選択");

    await page.locator(
      "#reservation_orders_attributes_1_is_group_order"
    ).check({
      force: true
    });

    await page.waitForTimeout(2000);

    // フォーム情報
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

    // 空席API
    const result = await page.evaluate(
      async (info) => {
        const params = new URLSearchParams();

        params.append(
          "authenticity_token",
          info.token
        );

        params.append(
          "reservation[num_people_adult]",
          info.requestData.reservation.num_people_adult
        );

        params.append(
          "reservation[num_people_baby]",
          info.requestData.reservation.num_people_baby || ""
        );

        const order =
          info.requestData.reservation.orders_attributes[0];

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

        const json = await response.json();

        return {
          status: response.status,
          json: json
        };
      },
      info
    );

    console.log("");
    console.log("========== API結果 ==========");

    console.log(
      JSON.stringify(
        result,
        null,
        2
      )
    );

    // 空席抽出
    const available = [];

    const slots =
      result.json &&
      result.json.data &&
      result.json.data.slots
        ? result.json.data.slots
        : {};

    for (const date in slots) {
      const times = slots[date];

      for (const epoch in times) {
        const slot = times[epoch];

        if (
          slot.available === true &&
          slot.meal === "breakfast"
        ) {
          const dateObj =
            new Date(
              Number(epoch) * 1000
            );

          const dateText =
            new Intl.DateTimeFormat(
              "ja-JP",
              {
                time
