const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const url = process.env.ITS_KENPO_URL;

  const facilities = [
    "トスラブ箱根ビオーレ",
    "トスラブ箱根和奏林",
    "トスラブ館山ルアーナ",
    "草津温泉　ホテルヴィレッジ",
    "ホテルハーヴェスト那須",
    "ホテルハーヴェスト斑尾",
    "ブルーベリーヒル勝浦",
    "ホテルハーヴェスト伊東",
    "ホテル琵琶レイクオーツカ",
    "ホテル日航プリンセス京都",
    "ホテルハーヴェスト南紀田辺",
    "ホテルハーヴェスト旧軽井沢",
    "ホテルハーヴェスト京都鷹峯",
    "日光千姫物語",
    "ホテルハーヴェスト有馬六彩",
    "伊香保温泉 ホテル天坊",
    "和倉温泉 あえの風",
    "ラビスタ富士河口湖",
    "リソルの森",
    "ホテルハーヴェスト浜名湖",
    "鳴子温泉　湯元　吉祥",
    "ホテルオークラ東京ベイ",
    "熱海後楽園ホテル",
    "ラビスタ横須賀観音崎テラス",
    "ゆふいん山水館",
    "ラビスタ熱海テラス",
    "ホテルハーヴェスト鬼怒川",
    "鎌倉パークホテル",
    "蓼科東急ホテル",
    "NASPAニューオータニ",
    "定山渓 ゆらく草庵",
    "NAGU 勝浦",
    "プレジャーリゾート伊豆赤沢温泉　赤沢温泉ホテル",
    "軽井沢マリオットホテル",
    "高山グリーンホテル",
    "アオアヲナルトリゾート",
    "ホテル日航アリビラ",
    "グランドメルキュール伊勢志摩",
    "スパリゾートハワイアンズモノリスタワー",
    "フルーツパーク富士屋ホテル"
  ];

  const results = [];

  const CONCURRENCY = 3;

  // ==========================================
  // 通知済みデータ読み込み
  // ==========================================

  const notifiedFile = "notified.json";

  let notified = {};

  try {
    if (fs.existsSync(notifiedFile)) {
      notified = JSON.parse(
        fs.readFileSync(notifiedFile, "utf8")
      );
    }
  } catch (error) {
    console.log("⚠ notified.json 読み込み失敗");
    notified = {};
  }

  console.log("ITS健保 高速チェック4開始");
  console.log(`同時チェック: ${CONCURRENCY}施設`);
  console.log(
    `通知済みデータ: ${Object.keys(notified).length}件`
  );

  // ==========================================
  // 施設チェック
  // ==========================================

  async function checkFacility(facility) {
    const page = await browser.newPage({
      viewport: {
        width: 1400,
        height: 1200
      }
    });

    const start = Date.now();

    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000
      });

      const link = page
        .getByText(facility, {
          exact: true
        })
        .first();

      if (!await link.isVisible().catch(() => false)) {
        console.log(`⚠ 施設なし: ${facility}`);
        return;
      }

      await link.click();

      await page.waitForTimeout(500);

      // 3ヶ月チェック
      for (let m = 0; m < 3; m++) {

        const calendar = page
          .locator('[id^="tcb"]:visible')
          .first();

        if (!await calendar.count()) {
          break;
        }

        const cells = calendar.locator(
          "td[data-join-time]"
        );

        const cellCount = await cells.count();

        for (let i = 0; i < cellCount; i++) {

          const cell = cells.nth(i);

          const date =
            await cell.getAttribute(
              "data-join-time"
            );

          const status =
            await cell
              .locator(".icon")
              .first()
              .textContent()
              .catch(() => "");

          const cleanStatus =
            status?.trim();

          // ○ または △ のみ取得
          if (
            date &&
            ["○", "△"].includes(cleanStatus)
          ) {
            results.push({
              facility,
              date,
              status: cleanStatus
            });
          }
        }

        // 次の月へ
        if (m < 2) {

          const next = page
            .locator(
              'input.next-month:visible'
            )
            .first();

          if (!await next.count()) {
            break;
          }

          await next.click();

          await page.waitForTimeout(300);
        }
      }

      const seconds =
        (Date.now() - start) / 1000;

      console.log(
        `✓ ${facility} ${seconds.toFixed(1)}秒`
      );

    } catch (error) {

      console.log(
        `✕ ${facility}: ${error.message}`
      );

    } finally {

      await page.close();
    }
  }

  try {

    // ==========================================
    // 3施設ずつ並列処理
    // ==========================================

    for (
      let i = 0;
      i < facilities.length;
      i += CONCURRENCY
    ) {

      const batch =
        facilities.slice(
          i,
          i + CONCURRENCY
        );

      console.log(
        `--- ${i + 1}〜${Math.min(
          i + CONCURRENCY,
          facilities.length
        )} / ${facilities.length} ---`
      );

      await Promise.all(
        batch.map(
          facility =>
            checkFacility(facility)
        )
      );
    }

    console.log("================");

    // ==========================================
    // 現在空きがあるキー
    // ==========================================

    const currentKeys = new Set();

    for (const item of results) {

      const key =
        `${item.facility}|${item.date}`;

      currentKeys.add(key);
    }

    // ==========================================
    // 空きがなくなったものを通知済みから削除
    // ==========================================

    for (const key of Object.keys(notified)) {

      if (!currentKeys.has(key)) {

        delete notified[key];

        console.log(
          `↩ 空き終了: ${key}`
        );
      }
    }

    // ==========================================
    // 空きなし
    // ==========================================

    if (!results.length) {

      fs.writeFileSync(
        notifiedFile,
        JSON.stringify(
          notified,
          null,
          2
        ),
        "utf8"
      );

      console.log(
        "3ヶ月間、空きなし"
      );

      return;
    }

    // ==========================================
    // 新しい空きだけ抽出
    // ==========================================

    const newResults = [];

    for (const item of results) {

      const key =
        `${item.facility}|${item.date}`;

      if (!notified[key]) {

        notified[key] = {
          discord: false,
          line: false,
          status: item.status
        };

        newResults.push(item);

      } else {

        console.log(
          `既通知: ${item.facility} ${item.date} ${item.status}`
        );
      }
    }

    // ==========================================
    // 新しい空きなし
    // ==========================================

    if (!newResults.length) {

      fs.writeFileSync(
        notifiedFile,
        JSON.stringify(
          notified,
          null,
          2
        ),
        "utf8"
      );

      console.log(
        "新しい空きなし → 通知しません"
      );

      return;
    }

    // ==========================================
    // 新しい空き発見
    // ==========================================

    console.log(
      "★★ 新しい空き発見 ★★"
    );

    newResults.sort(
      (a, b) =>
        a.date.localeCompare(
          b.date
        )
    );

    let message =
      "🚨 ITS健保 新しい空き発見！\n\n";

    for (const item of newResults) {

      console.log(
        item.facility,
        item.date,
        item.status
      );

      message +=
        `🏨 ${item.facility}\n` +
        `📅 ${item.date}\n` +
        `空き状況: ${item.status}\n\n`;
    }

    message +=
      "○ = 空きあり\n" +
      "△ = 残りわずか\n\n" +
      "🔗 " + url;

    // ==========================================
    // Discord通知
    // ==========================================

    const webhook =
      process.env.DISCORD_WEBHOOK_URL;

    if (!webhook) {

      console.log(
        "Discord Webhook未設定"
      );

    } else {

      const discordResults =
        newResults.filter(item => {

          const key =
            `${item.facility}|${item.date}`;

          return !notified[key].discord;
        });

      if (discordResults.length) {

        const response =
          await fetch(
            webhook,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json"
              },
              body: JSON.stringify({
                content: message
              })
            }
          );

        if (response.ok) {

          console.log(
            "Discord通知成功！"
          );

          for (const item of discordResults) {

            const key =
              `${item.facility}|${item.date}`;

            notified[key].discord = true;
          }

        } else {

          console.log(
            `Discord通知失敗: ${response.status}`
          );
        }
      }
    }

    // ==========================================
    // LINE 一斉送信
    // ==========================================

    const lineToken =
      process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!lineToken) {

      console.log(
        "LINE_CHANNEL_ACCESS_TOKEN が設定されていません"
      );

    } else {

      // LINE未通知の新しい空きだけ対象
      const lineResults =
        newResults.filter(item => {

          const key =
            `${item.facility}|${item.date}`;

          return !notified[key].line;
        });

      if (lineResults.length) {

        console.log(
          "LINE友だち全員へ一斉送信します"
        );

        const lineResponse =
          await fetch(
            "https://api.line.me/v2/bot/message/broadcast",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                "Authorization":
                  `Bearer ${lineToken}`
              },
              body: JSON.stringify({
                messages: [
                  {
                    type: "text",
                    text: message
                  }
                ]
              })
            }
          );

        if (lineResponse.ok) {

          console.log(
            "LINE一斉通知成功！"
          );

          for (const item of lineResults) {

            const key =
              `${item.facility}|${item.date}`;

            notified[key].line = true;
          }

        } else {

          console.log(
            `LINE一斉通知失敗: ${lineResponse.status}`
          );

          console.log(
            await lineResponse.text()
          );
        }
      }
    }

    // ==========================================
    // 通知済み保存
    // ==========================================

    fs.writeFileSync(
      notifiedFile,
      JSON.stringify(
        notified,
        null,
        2
      ),
      "utf8"
    );

    console.log(
      `通知済みデータ保存: ${Object.keys(notified).length}件`
    );

  } catch (error) {

    console.error(
      "エラー:",
      error.message
    );

    process.exitCode = 1;

  } finally {

    await browser.close();
  }
})();
