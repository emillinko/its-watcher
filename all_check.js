const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1200 }
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

  const now = new Date();
  const results = [];

  const months = [...Array(3)].map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, "0")}月`;
  });

  console.log("ITS健保 全施設チェック開始");

  try {
    for (const facility of facilities) {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000
      });

      const link = page.getByText(facility, { exact: true }).first();

      if (!await link.isVisible().catch(() => false)) {
        continue;
      }

      await link.click();
      await page.waitForTimeout(500);

      for (let m = 0; m < 3; m++) {
        const calendar = page.locator('[id^="tcb"]:visible').first();

        if (!await calendar.count()) break;

        const cells = calendar.locator("td[data-join-time]");

        for (let i = 0; i < await cells.count(); i++) {
          const cell = cells.nth(i);
          const date = await cell.getAttribute("data-join-time");
          const status = await cell.locator(".icon").first().textContent().catch(() => "");

          if (date && ["○", "△"].includes(status?.trim())) {
            results.push({
              facility,
              date,
              status: status.trim()
            });
          }
        }

        if (m < 2) {
          const next = page.locator('input.next-month:visible').first();

          if (!await next.count()) break;

          await next.click();
          await page.waitForTimeout(300);
        }
      }
    }

    console.log("================");

    if (!results.length) {
      console.log("3ヶ月間、空きなし");
      return;
    }

    console.log("★★ 空き発見 ★★");

    let message = "🚨 **ITS健保 空き発見！**\n\n";

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

    const webhook = process.env.DISCORD_WEBHOOK_URL;

    if (!webhook) {
      console.log("Discord Webhook未設定");
      return;
    }

    const response = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
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

  } catch (error) {
    console.error("エラー:", error.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
