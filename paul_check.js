
const { chromium } = require("playwright");

const URL =
  "https://www.tablecheck.com/ja/shops/paul-yotsuya/reserve";

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return y + "-" + m + "-" + d;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getTokyoDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const values = {};

  for (const part of parts) {
    values[part.type] = part.value;
  }

  return new Date(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day)
  );
}

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage({
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo"
  });

  try {
    console.log("PAUL四谷 モーニングビュッフェ空席チェック");
    console.log("====================================");

    const today = getTokyoDate();

    const firstDayNextMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      1
    );

    const endDate = new Date(
      today.getFullYear(),
      today.getMonth() + 2,
      0
    );

    const todayText = formatDate(today);
    const endText = formatDate(endDate);

    console.log("対象期間: " + todayText + " ～ " + endText);
    console.log("人数: 大人2名");
    console.log("対象: 土日・モーニングビュッフェ");
    console.log("");

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

    const order =
      info.requestData.reservation.orders_attributes[0];

    const allSlots = {};
    const requestDates = [];

    let queryDate = new Date(today);

    while (queryDate <= endDate) {
      requestDates.push(formatDate(queryDate));
      queryDate = addDays(queryDate, 7);
    }

    console.log("週ごとの空席情報を取得します");
    console.log("");

    for (let i = 0; i < requestDates.length; i++) {
      const requestDate = requestDates[i];

      console.log("取得中: " + requestDate);

      const result = await page.evaluate(async (params) => {
        const query = new URLSearchParams();

        query.append(
          "authenticity_token",
          params.token
        );

        query.append(
          "reservation[num_people_adult]",
          params.adult
        );

        query.append(
          "reservation[num_people_baby]",
          params.baby
        );

        query.append(
          "reservation[orders_attributes][0][menu_item_id]",
          params.menuId
        );

        query.append(
          "reservation[orders_attributes][0][is_group_order]",
          params.groupOrder
        );

        query.append(
          "reservation[start_date]",
          params.startDate
        );

        const apiUrl =
          "/ja/shops/paul-yotsuya/available/timetable?" +
          query.toString();

        const response = await fetch(apiUrl, {
          credentials: "same-origin"
        });

        const data = await response.json();

        return {
          status: response.status,
          data: data
        };
      }, {
        token: info.token,
        adult: info.requestData.reservation.num_people_adult,
        baby:
          info.requestData.reservation.num_people_baby || "",
        menuId: order.menu_item_id,
        groupOrder: order.is_group_order,
        startDate: requestDate
      });

      if (result.status !== 200) {
        console.log(
          "APIエラー: HTTP " + result.status
        );
        continue;
      }

      const slots =
        result.data &&
        result.data.data &&
        result.data.data.slots
          ? result.data.data.slots
          : {};

      console.log(
        "  返却日: " +
        (result.data.queried_date || "不明") +
        " / 日付数: " +
        Object.keys(slots).length
      );

      for (const date in slots) {
        if (date < todayText || date > endText) {
          continue;
        }

        const dateParts = date.split("-");

        const dateObject = new Date(
          Number(dateParts[0]),
          Number(dateParts[1]) - 1,
          Number(dateParts[2])
        );

        const day = dateObject.getDay();

        if (day !== 0 && day !== 6) {
          continue;
        }

        for (const epoch in slots[date]) {
          const slot = slots[date][epoch];

          if (slot.meal !== "breakfast") {
            continue;
          }

          const key = date + "_" + epoch;

          allSlots[key] = {
            date: date,
            epoch: Number(epoch),
            available: slot.available === true
          };
        }
      }
    }

    console.log("");
    console.log("========== 空席結果 ==========");

    const results = Object.values(allSlots);

    results.sort((a, b) => {
      return a.epoch - b.epoch;
    });

    let availableCount = 0;

    for (const slot of results) {
      if (!slot.available) {
        continue;
      }

      const d = new Date(slot.epoch * 1000);

      const dateText = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "short"
      }).format(d);

      const timeText = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(d);

      console.log(
        dateText + " " + timeText + " ← 空きあり"
      );

      availableCount++;
    }

    if (availableCount === 0) {
      console.log("空きは見つかりませんでした");
    }

    console.log("");
    console.log("取得した朝食枠数: " + results.length);
    console.log("空席数: " + availableCount);
    console.log("====================================");
    console.log("チェック終了");

  } catch (error) {
    console.error("ERROR");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
