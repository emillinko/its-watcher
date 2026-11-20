
const { chromium } = require("playwright");
const fs = require("fs");

const START_URL =
  "https://as.its-kenpo.or.jp/apply/calendar?s=PT1RTzNnVFBrbG1KbFZuYzAxVFp5Vkhkd0YyWWZWR2JuOTJiblpTWjFKSGQ5a0hkdzFXWg%3D%3D&join_date=";

const ROOMS = [
  { name: "個室①", id: "879" },
  { name: "個室②", id: "880" },
  { name: "個室③", id: "881" },
  { name: "個室④", id: "882" },
  { name: "個室⑤", id: "883" }
];

const HISTORY_FILE = "sakura_notified.json";
const WEBHOOK = process.env.DISCORD_WEBHOOK_URL_PRIVATE;

// 日本時間の日付
function japanDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function addDays(dateString, days) {
  const d = new Date(`${dateString}T00:00:00+09:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}

function isWeekday(dateString) {
  const d = new Date(`${dateString}T00:00:00+09:00`);
  const day = d.getDay();
  return day >= 1 && day <= 5;
}

function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
  } catch {
    return {};
  }
}

async function sendDiscord(message) {
  const response = await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message })
  });

  if (!response.ok) {
    throw new Error(`Discord通知失敗: ${response.status}`);
  }
}

async function getAvailableSlots(page, room) {
  const tab = page.locator(`#link-${room.id}`);

  if (!(await tab.count())) {
    throw new Error(`${room.name} のタブが見つかりません`);
  }

  await tab.click();
  await page.waitForTimeout(1800);

  const results = new Map();
  const today = japanDate();
  const limit = addDays(today, 90);

  console.log(`--- ${room.name} の確認開始 ---`);

  for (let week = 0; week < 16; week++) {
    const cells = await page.locator(
      'td[data-join-time][data-use-time="20:00"]'
    ).evaluateAll(els =>
      els.map(el => ({
        date: el.getAttribute("data-join-time"),
        time: el.getAttribute("data-use-time"),
        status: el.innerText.trim()
      }))
    );

    if (!cells.length) {
      throw new Error(`${room.name}: 20時のカレンダーが取得できません`);
    }

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
      }
    }

    const dates = cells.map(c => c.date).filter(Boolean);
    const lastDate = dates.sort().at(-1);

    console.log(
      `${room.name}: ${lastDate || "日付不明"} まで確認 / 空き ${results.size}件`
    );

    if (lastDate && lastDate >= limit) {
      break;
    }

    const nextButton = page.locator(
      ".next-week, input[value*='次の週'], button:has-text('次の週'), a:has-text('次の週')"
    ).first();

    if (!(await nextButton.count())) {
      throw new Error(
        `${room.name}: 次の週へ進むボタンが見つかりません。確認を中断しました`
      );
    }

    await nextButton.click();
    await page.waitForTimeout(1000);
  }

  return [...results.values()];
}

(async () => {
  if (!process.env.ITS_KENPO_URL) {
    throw new Error("ITS_KENPO_URL が設定されていません");
  }

  if (!WEBHOOK) {
    throw new Error("DISCORD_WEBHOOK_URL_PRIVATE が設定されていません");
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const history = loadHistory();

  try {
    console.log("桜華樓チェック開始");

    // ホテル監視と同じITS健保入口からアクセス
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
      const slots = await getAvailableSlots(page, room);
      allAvailable.push(...slots);
    }

    console.log(`取得した空き: ${allAvailable.length}件`);

    const newSlots = allAvailable.filter(slot => {
      const key = `${slot.room}|${slot.date}|20:00`;
      return !history[key];
    });

    console.log(`新しく出た空き: ${newSlots.length}件`);

    if (newSlots.length > 0) {
      const lines = newSlots.map(slot =>
        `・${slot.date}（${["日", "月", "火", "水", "木", "金", "土"][new Date(`${slot.date}T00:00:00+09:00`).getDay()]}）20:00 / ${slot.room} / ${slot.status}`
      );

      const message =
        `【ITS健保 桜華樓 空き通知】\n` +
        `平日20:00・個室の空きが出ました！\n` +
        lines.join("\n");

      await sendDiscord(message);

      // Discord通知成功後に履歴へ記録
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

      console.log("Discord通知成功・履歴保存完了");
    } else {
      console.log("新しい空きはありません");
    }
  } catch (error) {
    console.error("桜華樓チェックエラー:", error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
