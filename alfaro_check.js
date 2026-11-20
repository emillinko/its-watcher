
const { chromium } = require("playwright");
const fs = require("fs");

const BASE_URL =
  "https://as.its-kenpo.or.jp/apply/calendar?s=PT1nTjNnVFBrbG1KbFZuYzAxVFp5Vkhkd0YyWWZWR2JuOTJiblpTWjFKSGQ5a0hkdzFXWg%3D%3D";

const HISTORY_FILE = "alfaro_notified.json";
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL_PRIVATE;

const FACILITY_ID = 876;
const TARGET_TIME = "20:00";
const CHECK_DAYS = 90;

function jstDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const get = type => parts.find(p => p.type === type).value;

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getMonday(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - ((day + 6) % 7));
  return date.toISOString().slice(0, 10);
}

function getWeekday(dateString) {
  return ["日", "月", "火", "水", "木", "金", "土"][
    new Date(`${dateString}T00:00:00Z`).getUTCDay()
  ];
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${year}/${month}/${day}`;
}

function makeCalendarUrl(dateString) {
  const url = new URL(BASE_URL);
  url.searchParams.set("join_date", getMonday(dateString));
  return url.toString();
}

function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }

  try {
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    console.log("通知履歴を読み込めません。新規履歴として開始します。");
    return [];
  }
}

async function sendDiscord(messages) {
  if (!WEBHOOK_URL) {
    throw new Error("DISCORD_WEBHOOK_URL_PRIVATE が設定されていません");
  }

  // Discordの文字数制限を考慮して分割送信
  const chunks = [];
  let current = "**🍽️ アル・ファーロ（ディナー）新規空き情報**\n";

  for (const message of messages) {
    if (current.length + message.length > 1700) {
      chunks.push(current);
      current = "**🍽️ アル・ファーロ（ディナー）新規空き情報（続き）**\n";
    }
    current += message + "\n";
  }

  if (current.trim()) {
    chunks.push(current);
  }

  for (const content of chunks) {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      throw new Error(
        `Discord通知失敗: ${response.status} ${await response.text()}`
      );
    }
  }
}

(async () => {
  const today = jstDateString();
  const endDate = addDays(today, CHECK_DAYS);

  console.log("===== アルファーロ空きチェック開始 =====");
  console.log("基準日:", today);
  console.log("確認期限:", endDate);
  console.log("対象時間:", TARGET_TIME);

  const notified = loadHistory();
  const notifiedSet = new Set(notified);

  const found = [];
  const newSlots = [];

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();

    const startMonday = getMonday(today);
    const startUrl = new URL(BASE_URL);
    startUrl.searchParams.set("join_date", startMonday);

    console.log("開始URL:", startUrl.toString());

    await page.goto(startUrl.toString(), {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(2000);

    const pageText = await page.locator("body").innerText();

    if (!pageText.includes("アル・ファーロ(ディナー)")) {
      throw new Error("アルファーロのディナーカレンダーを確認できません");
    }

    let previousFirstDate = "";
    let weekCount = 0;

    while (weekCount < 16) {
      weekCount++;

      const cells = await page.locator(
        `td[data-join-time][data-use-time="${TARGET_TIME}"]`
      ).evaluateAll(els =>
        els.map(el => ({
          date: el.getAttribute("data-join-time"),
          time: el.getAttribute("data-use-time"),
          status: el.innerText.trim()
        }))
      );

      if (cells.length === 0) {
        throw new Error("20:00のカレンダーセルが見つかりません");
      }

      const firstDate = cells[0].date;

      if (!firstDate) {
        throw new Error("カレンダーの日付を取得できません");
      }

      if (firstDate === previousFirstDate) {
        throw new Error("週送り後も日付が変わっていません");
      }

      previousFirstDate = firstDate;

      console.log(`\n===== 第${weekCount}週 =====`);
      console.log("週開始日:", firstDate);

      for (const cell of cells) {
        if (!cell.date || cell.time !== TARGET_TIME) continue;

        // 今日より前、90日より先は対象外
        if (cell.date < today || cell.date > endDate) continue;

        // 土日を除外
        const weekday = getWeekday(cell.date);
        if (weekday === "土" || weekday === "日") continue;

        console.log(
          `${cell.date} (${weekday}) ${cell.time} ${cell.status}`
        );

        if (cell.status !== "○" && cell.status !== "△") continue;

        const key = `${cell.date}_${cell.time}`;

        found.push(key);

        if (!notifiedSet.has(key)) {
          newSlots.push({
            key,
            date: cell.date,
            weekday,
            status: cell.status,
            url: makeCalendarUrl(cell.date)
          });
        }
      }

      // 90日先まで確認したら終了
      if (firstDate > endDate) break;

      const nextButton = page.locator("#nextWeek");

      if (!(await nextButton.count())) {
        throw new Error("次週ボタンが見つかりません");
      }

      const oldDate = firstDate;

      await nextButton.click();

      await page.waitForFunction(
        old => {
          const cell = document.querySelector(
            `td[data-use-time="${TARGET_TIME}"][data-join-time]`
          );
          return cell && cell.getAttribute("data-join-time") !== old;
        },
        oldDate,
        { timeout: 15000 }
      );
    }

    if (weekCount >= 16) {
      throw new Error("週送り上限に達しました。確認が完了していません");
    }

    console.log("\n===== チェック結果 =====");
    console.log("空き取得数:", found.length);
    console.log("新規空き数:", newSlots.length);

    if (newSlots.length === 0) {
      console.log("新しい空きはありません。通知なし。");
      return;
    }

    const messages = newSlots.map(slot =>
      `📅 ${formatDate(slot.date)}（${slot.weekday}）20:00〜 ${slot.status}\n` +
      `🔗 [カレンダーを開く](${slot.url})`
    );

    console.log("\n===== Discord通知 =====");
    await sendDiscord(messages);

    console.log("Discord通知成功！");

    // 通知成功後に履歴を保存
    for (const slot of newSlots) {
      notifiedSet.add(slot.key);
    }

    fs.writeFileSync(
      HISTORY_FILE,
      JSON.stringify([...notifiedSet].sort(), null, 2),
      "utf8"
    );

    console.log("通知履歴の保存に成功しました！");
    console.log("今回の新規通知:", newSlots.length);

  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error("===== アルファーロチェックエラー =====");
  console.error(error);
  process.exit(1);
});
