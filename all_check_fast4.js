const { chromium } = require("playwright");

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

  // ★同時に処理する数
  const CONCURRENCY = 3;

  console.log("ITS健保 高速チェック4開始");
  console.log(`同時チェック: ${CONCURRENCY}施設`);

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

          if (
            date &&
            ["○", "△"].includes(
              cleanStatus
            )
          ) {
            results.push({
              facility,
              date,
              status: cleanStatus
            });
          }
        }

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
    // 空きなし
    // ==========================================

    if (!results.length) {

      console.log(
        "3ヶ月間、空きなし"
      );

      return;
    }

    // ==========================================
    // 空き発見
    // ==========================================

    console.log(
      "★★ 空き発見 ★★"
    );

    results.sort(
      (a, b) =>
        a.date.localeCompare(
          b.date
        )
    );

    let message =
      "🚨 ITS健保 空き発見！\n\n";

    for (const item of results) {

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
    // Discord
    // ==========================================

    const webhook =
      process.env.DISCORD_WEBHOOK_URL;

    if (!webhook) {

      console.log(
        "Discord Webhook未設定"
      );

    } else {

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

      console.log(
        response.ok
          ? "Discord通知成功！"
          : `Discord通知失敗: ${response.status}`
      );
    }

    // ==========================================
    // LINE
    // ==========================================

    const lineToken =
      process.env.LINE_CHANNEL_ACCESS_TOKEN;

    const lineUserId =
      process.env.LINE_USER_ID;

    if (!lineToken || !lineUserId) {

      console.log(
        "LINE通知設定がありません"
      );

    } else {

      const lineResponse =
        await fetch(
          "https://api.line.me/v2/bot/message/push",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              "Authorization":
                `Bearer ${lineToken}`
            },
            body: JSON.stringify({
              to: lineUserId,
              messages: [
                {
                  type: "text",
                  text: message
                }
              ]
            })
          }
        );

      console.log(
        lineResponse.ok
          ? "LINE通知成功！"
          : `LINE通知失敗: ${lineResponse.status}`
      );

      if (!lineResponse.ok) {
        console.log(
          await lineResponse.text()
        );
      }
    }

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
