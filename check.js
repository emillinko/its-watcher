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

  // ==========================================
  // 今月を含めて3ヶ月を自動計算
  // ==========================================

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

  console.log("================");
  console.log("チェック対象月:");

  targetMonths.forEach((item) => {
    console.log(
      item.year +
      "年" +
      String(item.month).padStart(2, "0") +
      "月"
    );
  });

  try {

    // ==========================================
    // ホテルごとにチェック
    // ==========================================

    for (const hotel of hotels) {

      console.log("================");
      console.log("ホテル:", hotel);

      // ----------------------------------------
      // トップページへ
      // ----------------------------------------

      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000
      });

      // ----------------------------------------
      // ホテルを探す
      // ----------------------------------------

      const hotelLink =
        page.getByText(hotel, {
          exact: true
        }).first();

      await hotelLink.waitFor({
        state: "visible",
        timeout: 30000
      });

      await hotelLink.click();

      // ----------------------------------------
      // カレンダーが表示されるまで待つ
      // ----------------------------------------

      const calendarLocator =
        page.locator('[id^="tcb"]:visible').first();

      await calendarLocator.waitFor({
        state: "visible",
        timeout: 30000
      });

      // ----------------------------------------
      // 現在表示されている月を取得
      // ----------------------------------------

      const getVisibleMonth = async () => {

        const calendar =
          page.locator('[id^="tcb"]:visible').first();

        const count =
          await calendar.count();

        if (count === 0) {
          return null;
        }

        const monthText =
          await calendar
            .locator(".month")
            .first()
            .textContent();

        if (!monthText) {
          return null;
        }

        return monthText.trim();
      };

      let currentMonth =
        await getVisibleMonth();

      console.log(
        "最初の表示月:",
        currentMonth
      );

      // ==========================================
      // 最初の対象月まで移動
      // ==========================================

      const firstTarget =
        targetMonths[0];

      let targetMonthText =
        firstTarget.year +
        "年" +
        String(firstTarget.month).padStart(2, "0") +
        "月";

      let safety = 0;

      while (
        currentMonth &&
        !currentMonth.includes(
          targetMonthText
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

        // カレンダーが表示されるまで待つ
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

      if (
        !currentMonth.includes(
          targetMonthText
        )
      ) {

        throw new Error(
          "最初の対象月まで移動できませんでした"
        );

      }

      // ==========================================
      // 3ヶ月チェック
      // ==========================================

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
          target.year +
          "年" +
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

        // ========================================
        // 日付と空き状況を取得
        // ========================================

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

          const statusElement =
            cell.locator(".icon").first();

          const statusCount =
            await statusElement.count();

          if (
            !date ||
            statusCount === 0
          ) {
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

          // --------------------------------------
          // ○ または △だけ保存
          // --------------------------------------

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

          // 次のカレンダーが表示されるまで少し待つ
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
// ======================================== // Discord通知 // ======================================== const webhookUrl = process.env.DISCORD_WEBHOOK_URL; if (!webhookUrl) { console.log( "DISCORD_WEBHOOK_URL が設定されていません" ); } else { let message = "🚨 **ITS健保 空き発見！**\n\n"; allEmpty.forEach((item) => { message += "🏨 " + item.hotel + "\n" + "📅 " + item.date + "\n" + "空き状況: " + item.status + "\n\n"; }); message += "○ = 空きあり\n" + "△ = 残りわずか\n\n" + "🔗 **予約サイトはこちら**\n" + url; const response = await fetch( webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: message }) } ); if (response.ok) { console.log( "Discord通知成功！" ); } else { console.log( "Discord通知失敗:", response.status ); console.log( await response.text() ); } }

})();
