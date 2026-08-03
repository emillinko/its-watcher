```javascript
const { chromium } = require("playwright");

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

  // 今月を含めて3ヶ月
  const today = new Date();

  const targetMonths = [];

  for (let i = 0; i < 3; i++) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth() + i,
      1
    );

    targetMonths.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1
    });
  }

  console.log("チェック対象月:");

  targetMonths.forEach((item) => {
    console.log(
      item.year + "年" +
      String(item.month).padStart(2, "0") +
      "月"
    );
  });

  try {
    for (const hotel of hotels) {

      console.log("================");
      console.log("ホテル:", hotel);

      // トップページ
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000
      });

      // ホテルが表示されるまで待つ
      const hotelLink =
        page.getByText(hotel, {
          exact: true
        }).first();

      await hotelLink.waitFor({
        state: "visible",
        timeout: 30000
      });

      await hotelLink.click();

      // カレンダーが表示されるまで待つ
      const visibleCalendar =
        page.locator('[id^="tcb"]:visible').first();

      await visibleCalendar.waitFor({
        state: "visible",
        timeout: 30000
      });

      // 月取得
      const getVisibleMonth = async () => {
        const calendar =
          page.locator('[id^="tcb"]:visible').first();

        const count = await calendar.count();

        if (count === 0) {
          return null;
        }

        const monthText =
          await calendar
            .locator(".month")
            .first()
            .textContent();

        return monthText
          ? monthText.trim()
          : null;
      };

      let currentMonth =
        await getVisibleMonth();

      console.log(
        "最初の表示月:",
        currentMonth
      );

      // ------------------------------------------
      // 最初の対象月まで移動
      // ------------------------------------------

      const firstTarget = targetMonths[0];

      let safety = 0;

      while (
        currentMonth &&
        !currentMonth.includes(
          `${firstTarget.year}年${String(firstTarget.month).padStart(2, "0")}月`
        ) &&
        safety < 12
      ) {

        const nextButton =
          page.locator(
            'input.next-month:visible'
          ).first();

        await nextButton.waitFor({
          state: "visible",
          timeout: 10000
        });

        await nextButton.click();

        await page
          .locator('[id^="tcb"]:visible')
          .first()
          .waitFor({
            state: "visible",
            timeout: 10000
          });

        currentMonth =
          await getVisibleMonth();

        console.log(
          "移動後:",
          currentMonth
        );

        safety++;
      }

      if (!currentMonth) {
        throw new Error(
          "カレンダーの月を取得できませんでした"
        );
      }

      // ------------------------------------------
      // 3ヶ月チェック
      // ------------------------------------------

      for (
        let monthIndex = 0;
        monthIndex < 3;
        monthIndex++
      ) {

        const target =
          targetMonths[monthIndex];

        console.log("================");

        console.log(
          "月チェック: " +
          target.year + "年" +
          String(target.month).padStart(2, "0") +
          "月"
        );

        const calendar =
          page.locator(
            '[id^="tcb"]:visible'
          ).first();

        await calendar.waitFor({
          state: "visible",
          timeout: 10000
        });

        const monthText =
          await calendar
            .locator(".month")
            .first()
            .textContent();

        console.log(
          "対象月:",
          monthText
            ? monthText.trim()
            : "不明"
        );

        // 日付セル
        const cells =
          calendar.locator(
            'td[data-join-time]'
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

          const statusElement =
            cell.locator(".icon").first();

          const statusCount =
            await statusElement.count();

          if (!date || statusCount === 0) {
            continue;
          }

          const status =
            await statusElement.textContent();

          if (!status) {
            continue;
          }

          const cleanStatus =
            status.trim();

          console.log(
            date,
            cleanStatus
          );

          // ○ または △
          if (
            cleanStatus === "○" ||
            cleanStatus === "△"
          ) {

            allEmpty.push({
              hotel: hotel,
              date: date,
              status: cleanStatus
            });
          }
        }

        // ------------------------------------------
        // 次の月へ
        // ------------------------------------------

        if (monthIndex < 2) {

          const nextButton =
            page.locator(
              'input.next-month:visible'
            ).first();

          await nextButton.waitFor({
            state: "visible",
            timeout: 10000
          });

          await nextButton.click();

          // 次の月のカレンダーが表示されるまで待つ
          await page.waitForTimeout(500);
        }
      }
    }

    // ==========================================
    // 結果
    // ==========================================

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
        "3ヶ月間、空きなし"
      );
    }

  } catch (error) {

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
