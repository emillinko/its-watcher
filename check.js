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

    // ==========================================
    // ホテルごとにチェック
    // ==========================================

    for (const hotel of hotels) {

      console.log("================");
      console.log("ホテル:", hotel);

      // トップページへ
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000
      });

      await page.waitForTimeout(3000);

      // ホテルをクリック
      const hotelLink =
        page.getByText(hotel, {
          exact: true
        }).first();

      await hotelLink.waitFor({
        state: "visible",
        timeout: 30000
      });

      await hotelLink.click();

      await page.waitForTimeout(5000);

      // ==========================================
      // 現在表示されている月を確認
      // ==========================================

      const getVisibleMonth = async () => {

        const visibleCalendars =
          page.locator(
            '[id^="tcb"]:visible'
          );

        const count =
          await visibleCalendars.count();

        if (count === 0) {
          return null;
        }

        const monthText =
          await visibleCalendars
            .first()
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

      // ==========================================
      // 8月になるまで次月へ進む
      // ==========================================

      let safety = 0;

      while (
        currentMonth &&
        !currentMonth.includes("2026年08月") &&
        safety < 6
      ) {

        const nextButton =
          page.locator(
            'input.next-month:visible'
          ).first();

        const nextCount =
          await nextButton.count();

        if (nextCount === 0) {

          throw new Error(
            "翌月ボタンが見つかりません"
          );

        }

        await nextButton.click();

        await page.waitForTimeout(3000);

        currentMonth =
          await getVisibleMonth();

        console.log(
          "移動後:",
          currentMonth
        );

        safety++;

      }

      if (
        !currentMonth ||
        !currentMonth.includes("2026年08月")
      ) {

        throw new Error(
          "2026年08月のカレンダーまで移動できませんでした"
        );

      }

      // ==========================================
      // 8月・9月・10月をチェック
      // ==========================================

      for (
        let month = 0;
        month < 3;
        month++
      ) {

        console.log("================");
        console.log(
          "月チェック:",
          month + 1
        );

        const visibleCalendars =
          page.locator(
            '[id^="tcb"]:visible'
          );

        const calendarCount =
          await visibleCalendars.count();

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

        const calendar =
          visibleCalendars.first();

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

        // ========================================
        // 日付と空き状況を取得
        // ========================================

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

          const status =
            await cell
              .locator(".icon")
              .textContent();

          if (!date || !status) {
            continue;
          }

          const cleanStatus =
            status.trim();

          console.log(
            date,
            cleanStatus
          );

          // ○ または △だけ保存
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

        // ========================================
        // 次の月へ
        // ========================================

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
        "8月〜10月 空きなし"
      );

    }

    // ==========================================
    // HTML保存
    // ==========================================

    fs.writeFileSync(
      "page.html",
      await page.content()
    );

    console.log("saved");

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
