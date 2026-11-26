
const { chromium } = require("playwright");
const fs = require("fs");

const START_URL =
  "https://as.its-kenpo.or.jp/apply/calendar?s=PT1RTzNnVFBrbG1KbFZuYzAxVFp5Vkhkd0YyWWZWR2JuOTJiblpTWjFKSGQ5a0hkdzFXWg%3D%3D&join_date=";

// 通知に載せるカレンダーURL
const CALENDAR_URL = START_URL;

const ROOMS = [
  { name: "個室①", id: "879" },
  { name: "個室②", id: "880" },
  { name: "個室③", id: "881" },
  { name: "個室④", id: "882" },
  { name: "個室⑤", id: "883" }
];

const HISTORY_FILE = "sakura_notified.json";
const WEBHOOK = process.env.DISCORD_WEBHOOK_URL_PRIVATE;

function japanDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function addDays(dateString, days) {
  const d = new Date(`${dateString}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isWeekday(dateString) {
  const day = new Date(`${dateString}T00:00:00Z`).getUTCDay();
  return day >= 1 && day <= 5;
}

function weekdayJa(dateString) {
  return [
    "日", "月", "火", "水", "木", "金", "土"
  ][new Date(`${dateString}T00:00:00Z`).getUTCDay()];
}

function loadHistory() {
  try {
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data;
    }

    return {};
  } catch {
    return {};
  }
}

async function sendDiscord(message) {
  const response = await fetch(WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content: message
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Discord通知失敗: ${response.status} ${detail}`
    );
  }

  console.log("Discord通知成功");
}

async function getVisibleCalendarDates(page) {
  return await page.locator(
    'td[data-join-time][data-use-time="20:00"]:visible'
  ).evaluateAll(els =>
    els.map(el => ({
      date: el.getAttribute("data-join-time"),
      status: el.innerText.trim()
    }))
  );
}

async function getVisibleNextButton(page, roomId) {
  const selector =
    `input#nextWeek:visible[onclick*="toNextWeek(${roomId},"]`;

  const button = page.locator(selector);

  if (await button.count() > 0) {
    return button.first();
  }

  return null;
}

async function checkRoom(page, room) {
  console.log(`\n===== ${room.name} =====`);

  const tab = page.locator(`#link-${room.id}`);

  if (!(await tab.count())) {
    throw new Error(`${room.name} のタブが見つかりません`);
  }

  await tab.click();
  await page.waitForTimeout(1200);

  const today = japanDate();
  const limit = addDays(today, 90);

  const results = new Map();
  const visitedWeeks = new Set();
  let completed = false;

  for (let week = 0; week < 16; week++) {
    const cells = await getVisibleCalendarDates(page);

    if (!cells.length) {
      throw new Error(
        `${room.name}: 表示中の20時カレンダーがありません`
      );
    }

    const dates = cells
      .map(cell => cell.date)
      .filter(Boolean)
      .sort();

    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    if (!firstDate || !lastDate) {
      throw new Error(`${room.name}: 日付を取得できません`);
    }

    if (visitedWeeks.has(firstDate)) {
      throw new Error(
        `${room.name}: 同じ週を再取得しました (${firstDate})`
      );
    }

    visitedWeeks.add(firstDate);

    let weekAvailable = 0;

    for (const cell of cells) {
      if (
        cell.date &&
        cell.date >= today &&
        cell.date <= limit &&
        isWeekday(cell.date) &&
        ["○", "△"].includes(cell.status)
      ) {
        results.set(cell.date, {
          room: room.name,
          date: cell.date,
          status: cell.status
        });

        weekAvailable++;
      }
    }

    console.log(
      `${room.name}: ${firstDate} ～ ${lastDate}` +
      ` / 今週の空き ${weekAvailable}件` +
      ` / 累計 ${results.size}件`
    );

    if (lastDate >= limit) {
      console.log(`${room.name}: 90日先まで確認完了`);
      completed = true;
      break;
    }

    const nextButton = await getVisibleNextButton(
      page,
      room.id
    );

    if (!nextButton) {
      throw new Error(
        `${room.name}: 表示中の次週ボタンがありません`
      );
    }

    const onclick = await nextButton.getAttribute("onclick");
    console.log(`${room.name}: 次週操作 ${onclick}`);

    await nextButton.evaluate(el => el.click());

    try {
      await page.waitForFunction(
        (previousDate) => {
          const cells = [
            ...document.querySelectorAll(
              'td[data-join-time][data-use-time="20:00"]'
            )
          ].filter(el =>
            el.offsetWidth > 0 && el.offsetHeight > 0
          );

          const dates = cells
            .map(el => el.getAttribute("data-join-time"))
            .filter(Boolean);

          return dates.length > 0 &&
            !dates.includes(previousDate);
        },
        firstDate,
        { timeout: 10000 }
      );
    } catch {
      throw new Error(
        `${room.name}: 次週への切り替えを確認できませんでした`
      );
    }

    await page.waitForTimeout(400);
  }

  if (!completed) {
    throw new Error(
      `${room.name}: 90日先まで確認できなかったため通知処理を中止します`
    );
  }

  return [...results.values()];
}

(async () => {
  if (!process.env.ITS_KENPO_URL) {
    throw new Error("ITS_KENPO_URL が設定されていません");
  }

  if (!WEBHOOK) {
    throw new Error(
      "DISCORD_WEBHOOK_URL_PRIVATE が設定されていません"
    );
  }

  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();
  const history = loadHistory();

  try {
    console.log("桜華樓 本番チェック開始");

    const today = japanDate();
    const limit = addDays(today, 90);

    console.log(`基準日: ${today}`);
    console.log(`確認期限: ${limit}`);

    await page.goto(process.env.ITS_KENPO_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(1500);

    await page.goto(START_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(2500);

    const allAvailable = [];

    for (const room of ROOMS) {
      const slots = await checkRoom(page, room);
      allAvailable.push(...slots);
    }

    console.log("\n===== 空き状況 =====");
    console.log(`取得した空き: ${allAvailable.length}件`);

    const newSlots = allAvailable.filter(slot => {
      const key = `${slot.room}|${slot.date}|20:00`;
      return !history[key];
    });

    console.log(`新しく出た空き: ${newSlots.length}件`);

    if (newSlots.length === 0) {
      console.log("新しい空きはありません");
      return;
    }

    // アル・ファーロと統一した通知形式
    // 部屋ごとの日付指定カレンダーリンク付き
    const lines = newSlots.map(slot => {
      const calendarUrl = `${CALENDAR_URL}${slot.date}`;
      const date = slot.date.replace(/-/g, "/");

      return (
        `**桜華樓（${slot.room}）新規空き情報** 📅 ${date}（${weekdayJa(slot.date)}）20:00〜 ${slot.status}\n` +
        `[${slot.room}のカレンダーを開く](${calendarUrl})`
      );
    });

    const message = lines.join("\n\n");

    await sendDiscord(message);

    // 通知成功後に履歴を保存
    for (const slot of newSlots) {
      const key = `${slot.room}|${slot.date}|20:00`;

      history[key] = {
        status: slot.status,
        notifiedAt: new Date().toISOString()
      };
    }

    fs.writeFileSync(
      HISTORY_FILE,
      JSON.stringify(history, null, 2)
    );

    console.log("通知履歴保存完了");
    console.log("桜華樓 本番チェック終了");

  } catch (error) {
    console.error("桜華樓チェックエラー:", error);
    process.exitCode = 1;

  } finally {
    await browser.close();
  }
})();
