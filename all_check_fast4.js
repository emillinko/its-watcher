const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const url = process.env.ITS_KENPO_URL;

  // ==========================================
  // 監視する施設
  // ==========================================

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

  // ==========================================
  // Discordプライベート通知対象ホテル
  // ==========================================

  const DISCORD_FACILITIES = [
    "ラビスタ富士河口湖",
    "ラビスタ熱海テラス",
    "軽井沢マリオットホテル",
    "プレジャーリゾート伊豆赤沢温泉　赤沢温泉ホテル"
  ];

  // ==========================================
  // 同時チェック数
  // ==========================================

  const CONCURRENCY = 3;

  const results = [];

  // ==========================================
  // 通知済みデータ
  // ==========================================

  const notifiedFile = "notified.json";

  let notified = {};

  try {
    if (fs.existsSync(notifiedFile)) {
      notified = JSON.parse(
        fs.readFileSync(
          notifiedFile,
          "utf8"
        )
      );
    }
  } catch (error) {
    console.log(
      "⚠ notified.json 読み込み失敗"
    );

    notified = {};
  }

  console.log(
    "ITS健保 高速チェック4開始"
  );

  console.log(
    `同時チェック: ${CONCURRENCY}施設`
  );

  console.log(
    `通知済みデータ: ${Object.keys(notified).length}件`
  );

  console.log(
    "Discord通知対象ホテル:"
  );

  for (const facility of DISCORD_FACILITIES) {
    console.log(
      `  ・${facility}`
    );
  }

  console.log(
    "Discord通知対象曜日: 金・土・日"
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

      await page.goto(
        url,
        {
          waitUntil: "domcontentloaded",
          timeout: 60000
        }
      );

      const link = page
        .getByText(
          facility,
          {
            exact: true
          }
        )
        .first();

      if (
        !await link
          .isVisible()
          .catch(() => false)
      ) {

        console.log(
          `⚠ 施設なし: ${facility}`
        );

        return;
      }

      await link.click();

      await page.waitForTimeout(500);

      // ========================================
      // 3ヶ月チェック
      // ========================================

      for (let m = 0; m < 3; m++) {

        const calendar = page
          .locator(
            '[id^="tcb"]:visible'
          )
          .first();

        if (
          !await calendar.count()
        ) {
          break;
        }

        const cells =
          calendar.locator(
            "td[data-join-time]"
          );

        const cellCount =
          await cells.count();

        for (
          let i = 0;
          i < cellCount;
          i++
        ) {

          const cell =
            cells.nth(i);

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

          // ○ と △ を取得
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

        // ======================================
        // 次の月
        // ======================================

        if (m < 2) {

          const next =
            page
              .locator(
                'input.next-month:visible'
              )
              .first();

          if (
            !await next.count()
          ) {
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

    console.log(
      "================"
    );

    // ==========================================
    // 現在空きがあるキー
    // ==========================================

    const currentKeys =
      new Set();

    for (const item of results) {

      const key =
        `${item.facility}|${item.date}`;

      currentKeys.add(key);
    }

    // ==========================================
    // 空きがなくなったものを削除
    // ==========================================

    for (
      const key of Object.keys(notified)
    ) {

      if (
        !currentKeys.has(key)
      ) {

        delete notified[key];

        console.log(
          `↩ 空き終了: ${key}`
        );
      }
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

    if (
      !newResults.length
    ) {

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

    // ==========================================
    // 曜日
    // ==========================================

    const weekdays = [
      "日",
      "月",
      "火",
      "水",
      "木",
      "金",
      "土"
    ];

    // ==========================================
    // Discord用フィルター
    //
    // ・指定4ホテル
    // ・金曜日
    // ・土曜日
    // ・日曜日
    // ==========================================

    const privateResults =
      newResults.filter(item => {

        // 指定ホテル以外は除外
        if (
          !DISCORD_FACILITIES.includes(
            item.facility
          )
        ) {
          return false;
        }

        const dateObj =
          new Date(
            `${item.date}T00:00:00`
          );

        const day =
          dateObj.getDay();

        // 金=5
        // 土=6
        // 日=0
        return [
          0,
          5,
          6
        ].includes(day);
      });

    // ==========================================
    // Discordプライベート通知
    // ==========================================

    const privateWebhook =
      process.env
        .DISCORD_WEBHOOK_URL_PRIVATE;

    if (!privateWebhook) {

      console.log(
        "DISCORD_WEBHOOK_URL_PRIVATE 未設定"
      );

    } else if (
      !privateResults.length
    ) {

      console.log(
        "Discordプライベート通知対象の新しい空きなし"
      );

    } else {

      console.log(
        "★★ Discordプライベート通知 ★★"
      );

      let message =
        "🚨 ITS健保 新しい空き！\n\n";

      for (
        const item of privateResults
      ) {

        const dateObj =
          new Date(
            `${item.date}T00:00:00`
          );

        const weekday =
          weekdays[
            dateObj.getDay()
          ];

        console.log(
          `Discord: ${item.facility} ${item.date}（${weekday}） ${item.status}`
        );

        message +=
          `🏨 ${item.facility}\n` +
          `📅 ${item.date}（${weekday}） 空き状況: ${item.status}\n\n`;
      }

      const response =
        await fetch(
          privateWebhook,
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
          "Discordプライベート通知成功！"
        );

      } else {

        console.log(
          `Discordプライベート通知失敗: ${response.status}`
        );

        console.log(
          await response.text()
        );
      }
    }

    // ==========================================
    // 通知済みデータ保存
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
