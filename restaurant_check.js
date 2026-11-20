
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
  const d = new Date(`${dateString}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);

  return d.toISOString().slice(0, 10);
}

// 日付文字列をUTCの暦日として判定する。
// GitHub ActionsがUTCで動いていても日本の曜日と一致する。
function isWeekday(dateString) {
  const day = new Date(`${dateString}T00:00:00Z`).getUTCDay();
  return day >= 1 && day <= 5;
}

function weekdayJa(dateString) {
  return [
    "日", "月", "火", "水", "木", "金", "土"
  ][new Date(`${dateString}T00:00:00Z`).getUTCDay()];
}

// 表示中のカレンダーだけを取得する
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

// 指定した個室の表示中の次週ボタンを取得
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

  for (let week = 0; week < 16; week++) {
    // 表示中のセルだけを読み取る
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

    // 同じ週を二重に読み取っていないか確認
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

    // 90日先まで到達したら終了
    if (lastDate >= limit) {
      console.log(`${room.name}: 90日先まで確認完了`);
      break;
    }

    // 表示中の個室専用の次週ボタンを取得
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

    // 次週ボタンをクリック
    await nextButton.evaluate(el => el.click());

    // 表示中のカレンダーの日付が変わるまで待機
    try {
      await page.waitForFunction(
        (previousDate, roomId) => {
          const cells = [
            ...document.querySelectorAll(
              'td[data-join-time][data-use-time="20:00"]'
            )
          ].filter(el =>
            el.offsetWidth > 0 &&
            el.offsetHeight > 0
          );

          const dates = cells
            .map(el => el.getAttribute("data-join-time"))
            .filter(Boolean);

          return dates.length > 0 &&
            !dates.includes(previousDate);
        },
        firstDate,
        room.id,
        { timeout: 10000 }
      );
    } catch {
      throw new Error(
        `${room.name}: 次週への切り替えを確認できませんでした`
      );
    }

    await page.waitForTimeout(400);
  }

  return [...results.values()];
}

(async () => {
  if (!process.env.ITS_KENPO_URL) {
    throw new Error("ITS_KENPO_URL が設定されていません");
  }

  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  try {
    console.log("桜華樓 5部屋チェック開始");
    console.log(`基準日: ${japanDate()}`);
    console.log(`確認期限: ${addDays(japanDate(), 90)}`);

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

    console.log("\n===== 最終テスト結果 =====");
    console.log(`取得した空き: ${allResults.length}件`);

    for (const slot of allResults) {
      console.log(
        `${slot.date}（${weekdayJa(slot.date)}）` +
        ` / ${slot.room} / 20:00 / ${slot.status}`
      );
    }

    console.log("\n通知・履歴保存は行っていません");
    console.log("桜華樓 5部屋チェック終了");

  } catch (error) {
    console.error("桜華樓チェックエラー:", error);
    process.exitCode = 1;

  } finally {
    await browser.close();
  }
})();
