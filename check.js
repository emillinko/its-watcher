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

  const url = process.env.ITS_KENPO_URL;

  // ==========================================
  // 今月を含めて3ヶ月
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

  for (const item of targetMonths) {

    console.log(
      item.year +
      "年" +
      String(item.month).padStart(2, "0") +
      "月"
    );
  }

  // ==========================================
  // 空き情報
  // ==========================================

  const allEmpty = [];

  try {

    // ==========================================
    // ① 施設一覧ページ
    // ==========================================

    console.log("================");
    console.log("施設一覧ページへ");

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(2000);

    // ==========================================
    // ② 施設リンクを全部取得
    // ==========================================

    const facilityLinks =
      page.locator(
        'a[href*="/apply_service/index"]'
      );

    const linkCount =
      await facilityLinks.count();

    console.log("================");
    console.log(
      "施設リンク数:",
      linkCount
    );

    const facilities = [];

    for (
      let i = 0;
      i < linkCount;
      i++
    ) {

      const link =
        facilityLinks.nth(i);

      const name = (
        await link.innerText()
          .catch(() => "")
      ).trim();

      const href =
        await link.getAttribute("href");

      if (
        name &&
        href
      ) {

        const facilityUrl =
          new URL(
            href,
            page.url()
          ).href;

        facilities.push({
          name,
          url: facilityUrl
        });

        console.log(
          name,
          "=>",
          facilityUrl
        );
      }
    }

    console.log("================");
    console.log(
      "監視施設数:",
      facilities.length
    );

    // ==========================================
    // ③ 施設ごとにチェック
    // ==========================================

    for (const facility of facilities) {

      console.log("================");
      console.log(
        "施設:",
        facility.name
      );

      try {

        await page.goto(
          facility.url,
          {
            waitUntil: "domcontentloaded",
            timeout: 60000
          }
        );

        await page.waitForTimeout(1500);

        // ======================================
        // カレンダー取得
        // ======================================

        const calendarLocator =
          page.locator(
            '[id^="tcb"]:visible'
          ).first();

        await calendarLocator.waitFor({
          state: "visible",
          timeout: 15000
        });

        // ======================================
        // 表示月取得
        // ======================================

        const getVisibleMonth =
          async () => {

            const calendar =
              page.locator(
                '[id^="tcb"]:visible'
              ).first();

            if (
              await calendar.count() === 0
            ) {
              return null;
            }

            const monthText =
              await calendar
                .locator(".month")
                .first()
                .textContent()
                .catch(() => null);

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

        // ======================================
        // 最初の対象月へ移動
        // ======================================

        const firstTarget =
          targetMonths[0];

        const targetMonthText =
          firstTarget.year +
          "年" +
          String(firstTarget.month)
            .padStart(2, "0") +
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

          await page.waitForTimeout(500);

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
          !currentMonth.includes(
            targetMonthText
          )
        ) {

          console.log(
            "対象月へ移動できないためスキップ"
          );

          continue;
        }

        // ======================================
        // 3ヶ月チェック
        // ======================================

        for (
          let monthIndex = 0;
          monthIndex < 3;
          monthIndex++
        ) {

          const target =
            targetMonths[monthIndex];

          console.log(
            "月チェック:",
            target.year +
            "年" +
            String(target.month)
              .padStart(2, "0") +
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
              .textContent()
              .catch(() => null);

          console.log(
            "対象月:",
            monthText
              ? monthText.trim()
              : "不明"
          );

          // ====================================
          // 日付セル
          // ====================================

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
              cell.locator(
                ".icon"
              ).first();

            if (
              !date ||
              await statusElement.count() === 0
            ) {
              continue;
            }

            const status =
              await statusElement
                .textContent()
                .catch(() => null);

            if (!status) {
              continue;
            }

            const cleanStatus =
              status.trim();

            console.log(
              date,
              cleanStatus
            );

            // ==================================
            // ○ / △ を発見
            // ==================================

            if (
              cleanStatus === "○" ||
              cleanStatus === "△"
            ) {

              allEmpty.push({
                hotel: facility.name,
                date,
                status: cleanStatus
              });

              console.log(
                "★★ 空き発見 ★★",
                facility.name,
                date,
                cleanStatus
              );
            }
          }

          // ====================================
          // 次の月
          // ====================================

          if (
            monthIndex < 2
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

            await page.waitForTimeout(500);
          }
        }

      } catch (facilityError) {

        console.log(
          "施設チェック失敗:",
          facility.name
        );

        console.log(
          facilityError.message
        );

        // 1施設失敗しても
        // 次の施設へ進む
        continue;
      }
    }

    // ==========================================
    // 結果
    // ==========================================

    console.log("================");
    console.log("最終結果");

    if (
      allEmpty.length === 0
    ) {

      console.log(
        "3ヶ月間、空きなし"
      );

    } else {

      console.log(
        "★★ 空き発見 ★★"
      );

      for (
        const item of allEmpty
      ) {

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

        // ======================================
        // 優先施設
        // ======================================

        const priorityHotels = [
          "ラビスタ富士河口湖",
          "フルーツパーク富士屋ホテル"
        ];

        const priority =
          allEmpty.filter(
            item =>
              priorityHotels.includes(
                item.hotel
              )
          );

        const others =
          allEmpty.filter(
            item =>
              !priorityHotels.includes(
                item.hotel
              )
          );

        // ======================================
        // 優先施設の通知
        // ======================================

        if (
          priority.length > 0
        ) {

          message +=
            "⭐ **希望施設に空きあり！**\n\n";

          for (
            const item of priority
          ) {

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
        }

        // ======================================
        // その他の施設
        // ======================================

        if (
          others.length > 0
        ) {

          message +=
            "🏨 **その他の施設にも空きあり！**\n\n";

          for (
            const item of others
          ) {

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
        }

        message +=
          "○ = 空きあり\n" +
          "△ = 残りわずか\n\n" +
          "🔗 **予約サイトはこちら**\n" +
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

        if (
          response.ok
        ) {

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
