
const { chromium } = require("playwright");
const fs = require("fs");

const URL =
  "https://www.tablecheck.com/ja/shops/paul-yotsuya/reserve";

const HISTORY_FILE = "paul_notified.json";

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

function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }

  const saved = JSON.parse(
    fs.readFileSync(HISTORY_FILE, "utf8")
  );

  if (!Array.isArray(saved.slots)) {
    throw new Error("通知履歴の形式が正しくありません");
  }

  return saved.slots;
}

function saveHistory(keys) {
  const data = {
    updated_at: new Date().toISOString(),
    slots: keys
  };

  fs.writeFileSync(
    HISTORY_FILE,
    JSON.stringify(data, null, 2) + "\n",
    "utf8"
  );
}

function formatSlot(slot) {
  const date = new Date(slot.epoch * 1000);

  const dateText = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  }).format(date);

  const timeText = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);

  return dateText + " " + timeText;
}

async function sendDiscord(slots) {
  const privateWebhook =
    process.env.DISCORD_WEBHOOK_URL_PRIVATE;

  if (!privateWebhook) {
    throw new Error(
      "DISCORD_WEBHOOK_URL_PRIVATE が設定されていません"
    );
  }

  const reservationUrl =
    "https://www.tablecheck.com/ja/shops/paul-yotsuya/reserve";

  const lines = [
    "🟢 **PAUL四谷 モーニングビュッフェに新しい空席！**",
    "大人2名",
    ""
  ];

  for (const slot of slots) {
    lines.push("・" + formatSlot(slot));
  }

  lines.push("");
  lines.push(
    "🔗 **[予約ページを開く](" + reservationUrl + ")**"
  );
  lines.push(reservationUrl);

  const response = await fetch(privateWebhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content: lines.join("\n")
    })
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      "Discord通知エラー: HTTP " +
      response.status +
      " " +
      body
    );
  }

  console.log("Discord通知成功！");
}

(async () => {
  let browser = null;

  try {
    console.log("PAULスクリプト開始");

    console.log("ブラウザ起動開始");

    browser = await chromium.launch({
      headless: true
    });

    console.log("ブラウザ起動成功");

    const page = await browser.newPage({
      locale: "ja-JP",
      timezoneId: "Asia/Tokyo"
    });

    console.log("TableCheckに接続します");

    await page.goto(URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    console.log("ページ読み込み成功");

    await page.waitForTimeout(4000);

    const agreement = page.getByText(
      "「お店からのお知らせ」を読み、内容を理解して同意する",
      { exact: true }
    );

    if (await agreement.count() > 0) {
      console.log("お知らせの同意をクリックします");

      await agreement.first().click();
      await page.waitForTimeout(1000);
    }

    console.log("人数を2名に設定します");

    await page.locator(
      "#reservation_num_people_adult"
    ).selectOption("2");

    await page.waitForTimeout(1000);

    console.log("モーニングビュッフェを選択します");

    await page.locator(
      "#reservation_orders_attributes_1_is_group_order"
    ).check({ force: true });

    await page.waitForTimeout(2000);

    console.log("予約情報を取得します");

    const info = await page.evaluate(() => {
      const data = Reserve.sanitizedFormData();

      return {
        token: data.authenticity_token,
        requestData: OnlineAvailability.requestData()
      };
    });

    const order =
      info.requestData.reservation.orders_attributes[0];

    if (!order || !order.menu_item_id) {
      throw new Error("モーニングビュッフェのメニュー情報を取得できません");
    }

    const today = getTokyoDate();

    const endDate = new Date(
      today.getFullYear(),
      today.getMonth() + 2,
      0
    );

    const todayText = formatDate(today);
    const endText = formatDate(endDate);

    console.log("");
    console.log("====================================");
    console.log("PAUL四谷 モーニングビュッフェ空席チェック");
    console.log("対象期間: " + todayText + " ～ " + endText);
    console.log("人数: 大人2名");
    console.log("対象: 土日・朝食");
    console.log("====================================");

    const allSlots = {};
    const requestDates = [];

    let queryDate = new Date(today);

    while (queryDate <= endDate) {
      requestDates.push(formatDate(queryDate));
      queryDate = addDays(queryDate, 7);
    }

    console.log("週ごとの空席情報を取得します");
    console.log("取得回数: " + requestDates.length);
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

        let data = {};

        try {
          data = await response.json();
        } catch (error) {
          data = {};
        }

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
        throw new Error(
          "APIエラー: " +
          requestDate +
          " HTTP " +
          result.status
        );
      }

      if (
        !result.data ||
        !result.data.data ||
        !result.data.data.slots
      ) {
        throw new Error(
          "空席データが取得できません: " + requestDate
        );
      }

      const slots = result.data.data.slots;

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
            key: key,
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

    const availableSlots = results.filter((slot) => {
      return slot.available;
    });

    for (const slot of availableSlots) {
      console.log(
        formatSlot(slot) + " ← 空きあり"
      );
    }

    if (availableSlots.length === 0) {
      console.log("空きは見つかりませんでした");
    }

    console.log("");
    console.log("取得した朝食枠数: " + results.length);
    console.log("現在の空席数: " + availableSlots.length);

    console.log("通知履歴を読み込みます");

    const previousKeys = loadHistory();
    const previousSet = new Set(previousKeys);

    const currentKeys = availableSlots.map((slot) => {
      return slot.key;
    });

    const newSlots = availableSlots.filter((slot) => {
      return !previousSet.has(slot.key);
    });

    console.log("通知済みデータ: " + previousKeys.length + "件");
    console.log("新しく出た空席数: " + newSlots.length);

    if (newSlots.length > 0) {
      console.log("新しい空席をDiscordに通知します");

      await sendDiscord(newSlots);
    } else {
      console.log("新しい空席はありません");
    }

    saveHistory(currentKeys);

    console.log("通知履歴を保存しました");
    console.log("====================================");
    console.log("チェック終了");

  } catch (error) {
    console.error("");
    console.error("========== エラー ==========");
    console.error(error);
    console.error("============================");

    process.exitCode = 1;

  } finally {
    if (browser) {
      console.log("ブラウザを終了します");
      await browser.close();
    }
  }
})();
