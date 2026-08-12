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

  console.log("ITS健保 高速チェック2開始");

  try {
    // ==========================================
    // ① トップページは1回だけ開く
    // ==========================================

    const mainPage = await browser.newPage();

    await mainPage.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    console.log("トップページ取得成功");

    // ==========================================
    // ② 施設リンクを全部取得
    // ==========================================

    const links = new Map();

    for (const facility of facilities) {
      const link = mainPage
        .getByText(facility, { exact: true })
        .first();

      if (!await link.count()) {
        console.log(`施設リンクなし: ${facility}`);
        continue;
      }

      const href = await link.getAttribute("href");

      if (href) {
        const fullUrl = new URL(
          href,
          url
        ).href;

        links.set(facility, fullUrl);
      }
    }

    console.log(
      `施設URL取得: ${links.size} / ${facilities.length}`
    );

    await mainPage.close();

    // ==========================================
    // ③ 施設ページを直接チェック
    // ==========================================

    const CONCURRENCY = 6;

    async function checkFacility(facility, facilityUrl) {

      const page = await browser.newPage({
        viewport: {
          width: 1400,
          height: 1200
        }
      });

      try {

        await page.goto(facilityUrl, {
          waitUntil: "domcontentloaded",
          timeout: 60000
        });

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

          const count = await cells.count();

          for (let i = 0; i < count; i++) {

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

          // 次の月
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

            await page.waitForTimeout(100);
          }
        }

      } catch (error) {

        console.log(
          `エラー: ${facility}`,
          error.message
        );

      } finally {

        await page.close();
      }
    }

    // ==========================================
    // ④ 6施設ずつ同時処理
    // ==========================================

    const entries =
      [...links.entries()];

    for (
      let i = 0;
      i < entries.length;
      i += CONCURRENCY
    ) {

      const batch =
        entries.slice(
          i,
          i + CONCURRENCY
        );

      console.log(
        `チェック: ${i + 1}〜${
          Math.min(
            i + CONCURRENCY,
            entries.length
          )
        } / ${entries.length}`
      );

      await Promise.all(
        batch.map(
          ([facility, facilityUrl]) =>
            checkFacility(
              facility,
              facilityUrl
            )
        )
      );
    }

    console.log("================");

    // ==========================================
    // ⑤ 空きなし
    // ==========================================

    if (!results.length) {

      console.log(
        "3ヶ月間、空きなし"
      );

      return;
    }

    // ==========================================
    // ⑥ 空き発見
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

    if (webhook) {

      const response =
        await fetch(webhook, {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            content: message
          })
        });

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

    if (
      lineToken &&
      lineUserId
    ) {

      const response =
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
        response.ok
          ? "LINE通知成功！"
          : `LINE通知失敗: ${response.status}`
      );

    } else {

      console.log(
        "LINE通知設定がありません"
      );
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
