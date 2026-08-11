```javascript
const { chromium } = require("playwright");

(async () => {

  const url = process.env.ITS_KENPO_URL;

  console.log("================");
  console.log("ITS健保チェック開始");

  console.log(
    "URL設定あり:",
    !!url
  );

  if (!url) {
    console.error("================");
    console.error(
      "★★ ITS_KENPO_URL が設定されていません ★★"
    );
    console.error(
      "GitHub Actions の Secrets を確認してください"
    );

    process.exit(1);
  }

  console.log("URL設定OK");

  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage({
    viewport: {
      width: 1400,
      height: 1200
    }
  });

  const hotels = [
    "フルーツパーク富士屋ホテル",
    "ラビスタ富士河口湖"
  ];

  const allEmpty = [];

  try {

    console.log("================");
    console.log("アクセス先:");
    console.log(url);

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(2000);

    console.log("================");
    console.log("実際のURL:");
    console.log(page.url());

    console.log("================");
    console.log("ページタイトル:");
    console.log(await page.title());

    // ==========================================
    // 施設ごとにチェック
    // ==========================================

    for (const hotel of hotels) {

      console.log("================");
      console.log("施設:", hotel);

      // 元ページへ戻る
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000
      });

      await page.waitForTimeout(1500);

      // 施設リンクを探す
      const links = page.locator(
        'a[href*="/apply_service/index"]'
      );

      const linkCount = await links.count();

      console.log(
        "施設リンク数:",
        linkCount
      );

      let facilityUrl = null;

      for (let i = 0; i < linkCount; i++) {

        const link = links.nth(i);

        const text = (
          await link.innerText()
            .catch(() => "")
        ).trim();

        if (text === hotel) {

          const href =
            await link.getAttribute("href");

          if (href) {
            facilityUrl =
              new URL(
                href,
                page.url()
              ).href;
          }

          break;
        }
      }

      if (!facilityUrl) {

        console.log(
          "施設リンクが見つかりません:",
          hotel
        );

        continue;
      }

      console.log(
        "施設URL:",
        facilityUrl
      );

      // ==========================================
      // 施設ページへ
      // ==========================================

      await page.goto(facilityUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60000
      });

      await page.waitForTimeout(2500);

      console.log(
        "施設ページURL:",
        page.url()
      );

      // ==========================================
      // カレンダー取得
      // ==========================================

      const calendar =
        page.locator(
          '[id^="tcb"]:visible'
        ).first();

      const calendarExists =
        await calendar.count();

      console.log(
        "カレンダー:",
        calendarExists > 0
          ? "あり"
          : "なし"
      );

      if (calendarExists === 0) {
        console.log(
          "カレンダーが見つからないためスキップ"
        );
        continue;
      }

      // ==========================================
      // 今月を含む3ヶ月
      // ==========================================

      for (
        let monthIndex = 0;
        monthIndex < 3;
        monthIndex++
      ) {

        console.log("----------------");

        const monthText =
          await calendar
            .locator(".month")
            .first()
            .textContent()
            .catch(() => "");

        console.log(
          "チェック月:",
          monthText
            ? monthText.trim()
            : "不明"
        );

        const cells =
          calendar.locator(
            'td[data-join-time]'
          );

        const cellCount =
          await cells.count();

        console.log(
          "日付セル数:",
          cellCount
        );

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

          const icon =
            cell.locator(".icon").first();

          if (
            !date ||
            await icon.count() === 0
          ) {
            continue;
          }

          const status = (
            await icon.innerText()
              .catch(() => "")
          ).trim();

          console.log(
            date,
            status
          );

          if (
            status === "○" ||
            status === "△"
          ) {

            allEmpty.push({
              hotel: hotel,
              date: date,
              status: status
            });
          }
        }

        // 次の月へ
        if (monthIndex < 2) {

          const nextButton =
            page.locator(
              'input.next-month:visible'
            ).first();

          if (
            await nextButton.count() === 0
          ) {

            console.log(
              "次月ボタンが見つかりません"
            );

            break;
          }

          await nextButton.click();

          await page.waitForTimeout(700);
        }
      }
    }

    // ==========================================
    // 最終結果
    // ==========================================

    console.log("================");
    console.log("最終結果");

    if (allEmpty.length === 0) {

      console.log(
        "3ヶ月間、空きなし"
      );

    } else {

      console.log(
        "★★ 空き発見 ★★"
      );

      for (const item of allEmpty) {

        console.log(
          item.hotel,
          item.date,
          item.status
        );
      }

      // ========================================
      // Discord通知
      // ========================================

      const webhookUrl =
        process.env.DISCORD_WEBHOOK_URL;

      if (!webhookUrl) {

        console.log(
          "DISCORD_WEBHOOK_URL が設定されていません"
        );

      } else {

        let message =
          "🚨 **ITS健保 空き発見！**\n\n";

        for (const item of allEmpty) {

          message +=
            "🏨 " +
            item.hotel +
            "\n" +
            "📅 " +
            item.date +
            "\n" +
            "空き状況: " +
            item.status +
            "\n\n";
        }

        message +=
          "○ = 空きあり\n" +
          "△ = 残りわずか\n\n" +
          "🔗 予約サイト:\n" +
          url;

        const response =
          await fetch(
            webhookUrl,
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

        } else {

          console.log(
            "Discord通知失敗:",
            response.status
          );

          console.log(
            await response.text()
          );
        }
      }
    }

  } catch (error) {

    console.error("================");
    console.error(
      "★★ エラー発生 ★★"
    );

    console.error(
      error.message
    );

    process.exitCode = 1;

  } finally {

    await browser.close();
  }

})();
```
