const { chromium } = require("playwright");
const fs = require("fs");

(async () => {

  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage({
    viewport: {
      width: 1400,
      height: 1200
    }
  });

  const url =
    "REMOVED_ITS_KENPO_URL";

  const hotels = [
    "フルーツパーク富士屋ホテル",
    "ラビスタ富士河口湖"
  ];

  const allEmpty = [];

  try {

    for (const hotel of hotels) {

      console.log("================");
      console.log("ホテル:", hotel);

      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000
      });

      await page.waitForTimeout(3000);

      await page.getByText(hotel, {
        exact: true
      }).click();

      await page.waitForTimeout(5000);

      // 7月から8月へ
      console.log("7月 → 8月へ移動");

      const firstNextButton =
        page.locator(
          'input.next-month:visible'
        ).first();

      await firstNextButton.click();

      await page.waitForTimeout(3000);

      // 8月・9月・10月
      for (let month = 0; month < 3; month++) {

        console.log("================");
        console.log(
          "月チェック:",
          month + 1
        );

        const calendar =
          page.locator(
            '[id^="tcb"]:visible'
          );

        const calendarCount =
          await calendar.count();

        console.log(
          "表示カレンダー数:",
          calendarCount
        );

        if (calendarCount === 0) {

          console.log(
            "カレンダーが見つかりません"
          );

          break;
        }

        const html =
          await calendar
            .first()
            .innerHTML();

        const cells =
          html.match(
            /<td[^>]*data-join-time="([^"]+)"[\s\S]*?<span class="icon">(.*?)<\/span>[\s\S]*?<\/td>/g
          );

        if (cells) {

          cells.forEach((cell) => {

            const date =
              cell.match(
                /data-join-time="([^"]+)"/
              );

            const status =
              cell.match(
                /<span class="icon">(.*?)<\/span>/
              );

            if (date && status) {

              const dateValue =
                date[1];

              const statusValue =
                status[1];

              console.log(
                dateValue,
                statusValue
              );

              if (
                statusValue === "○" ||
                statusValue === "△"
              ) {

                allEmpty.push({
                  hotel: hotel,
                  date: dateValue,
                  status: statusValue
                });

              }

            }

          });

        }

        // 8月→9月→10月
        if (month < 2) {

          const nextButton =
            page.locator(
              'input.next-month:visible'
            ).first();

          await nextButton.click();

          await page.waitForTimeout(3000);
        }

      }

    }

    console.log("================");

    if (allEmpty.length > 0) {

      console.log(
        "★★ 空き発見 ★★"
      );

      allEmpty.forEach((item) => {

        console.log(
          item.hotel,
          item.date,
          item.status
        );

      });

      ```javascript
// Discord通知
const webhookUrl =
  process.env.DISCORD_WEBHOOK_URL;

if (!webhookUrl) {

  console.log(
    "DISCORD_WEBHOOK_URL が設定されていません"
  );

} else {

  let message =
    "🚨 **ITS健保 空き発見！**\n\n";

  allEmpty.forEach((item) => {

    message +=
      "🏨 " + item.hotel + "\n" +
      "📅 " + item.date + "\n" +
      "空き状況: " + item.status + "\n\n";

  });

  message +=
    "○ = 空きあり\n" +
    "△ = 残りわずか\n\n" +
    "🔗 **予約サイト:**\n" +
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


    } else {

      console.log(
        "8月〜10月 空きなし"
      );

    }

    fs.writeFileSync(
      "page.html",
      await page.content()
    );

    console.log("saved");

  } catch (error) {

    console.error(
      "★★ エラー発生 ★★"
    );

    console.error(error);

    process.exitCode = 1;

  } finally {

    await browser.close();

  }

})();
```
