
const { chromium } = require("playwright");

const START_URL =
  "https://as.its-kenpo.or.jp/apply/calendar?s=PT1RTzNnVFBrbG1KbFZuYzAxVFp5Vkhkd0YyWWZWR2JuOTJiblpTWjFKSGQ5a0hkdzFXWg%3D%3D&join_date=";

const ROOMS = [
  { name: "個室①", id: "879" },
  { name: "個室②", id: "880" },
  { name: "個室③", id: "881" },
  { name: "個室④", id: "882" },
  { name: "個室⑤", id: "883" }
];

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
  return d.toLocaleDateString("en-CA", {
    timeZone: "Asia/Tokyo"
  });
}

function isWeekday(dateString) {
  const day = new Date(`${dateString}T00:00:00+09:00`).getDay();
  return day >= 1 && day <= 5;
}

async function getCalendarDates(page) {
  return await page.locator(
    'td[data-join-time][data-use-time="20:00"]'
  ).evaluateAll(els =>
    els.map(el => ({
      date: el.getAttribute("data-join-time"),
      status: el.innerText.trim()
    }))
  );
}

async function getVisibleNextButton(page, roomId) {
  const button = page.locator(
    `input#nextWeek[onclick*="toNextWeek(${roomId},"]`
  );

  for (let i = 0; i < 10; i++) {
    const count = await button.count();

    for (let j = 0; j < count; j++) {
      const candidate = button.nth(j);

      if (await candidate.isVisible()) {
        return candidate;
      }
    }

    await page.waitForTimeout(300);
  }

  return null;
}

async function checkRoom(page, room) {
  console.log(`\n===== ${room.name} =====`);

  const tab = page.locator(`#link-${room.id}`);

  if (!(await tab.count())) {
    throw new Error(`${room.name} のタブがありません`);
  }

  await tab.click();
  await page.waitForTimeout(1500);

  const today = japanDate();
  const limit = addDays(today, 90);

  const results = new Map();
  const visitedWeeks = new Set();

  for (let week = 0; week < 16; week++) {
    const cells = await getCalendarDates(page);

    if (!cells.length) {
      throw new Error(`${room.name}: カレンダーを取得できません`);
    }

    const dates = cells.map(c => c.date).filter(Boolean);
    const firstDate = dates.sort()[0];
    const lastDate = dates.sort().at(-1);

    if (!firstDate || !lastDate) {
      throw new Error(`${room.name}: 日付を読み取れません`);
    }

    if (visitedWeeks.has(firstDate)) {
      throw new Error(`${room.name}: 週送り後も同じ週です (${firstDate})`);
    }

    visitedWeeks.add(firstDate);

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

    console.log(
      `${room.name}: ${firstDate} ～ ${lastDate} / 空き ${results.size}件`
    );

    if (lastDate >= limit) {
      console.log(`${room.name}: 90日先まで確認完了`);
      break;
    }

    const nextButton = await getVisibleNextButton(page, room.id);

    if (!nextButton) {
      console.log(`${room.name}: 表示中の次週ボタンがありません`);
      break;
    }

    // 次週ボタンのonclickを確認
    const onclick = await nextButton.getAttribute("onclick");
    console.log(`${room.name}: 次週操作 ${onclick}`);

    // 次週へ進む
    await nextButton.evaluate(el => el.click());

    // カレンダーの日付が変わるまで待機
    try {
      await page.waitForFunction(
        (previousDate) => {
          const cells = document.querySelectorAll(
            'td[data-join-time][data-use-time="20:00"]'
          );

          return [...cells].some(
            el => el.getAttribute("data-join-time") !== previousDate
          );
        },
        firstDate,
        { timeout: 10000 }
      );
    } catch {
      throw new Error(
        `${room.name}: 次週への更新を確認できませんでした`
      );
    }

    await page.waitForTimeout(500);
  }

  return [...results.values()];
}

(async () => {
  if (!process.env.ITS_KENPO_URL) {
    throw new Error("ITS_KENPO_URL が設定されていません");
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log("桜華樓 週送りテスト開始");
    console.log(`基準日: ${japanDate()}`);

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

    const allResults = [];

    for (const room of ROOMS) {
      const results = await checkRoom(page, room);
      allResults.push(...results);
    }

    console.log("\n===== テスト結果 =====");
    console.log(`確認した空き: ${allResults.length}件`);

    for (const slot of allResults) {
      console.log(
        `${slot.date} / ${slot.room} / 20:00 / ${slot.status}`
      );
    }

    console.log("通知・履歴保存は行っていません");
    console.log("桜華樓 週送りテスト終了");

  } catch (error) {
    console.error("桜華樓チェックエラー:", error);
    process.exitCode = 1;

  } finally {
    await browser.close();
  }
})();
