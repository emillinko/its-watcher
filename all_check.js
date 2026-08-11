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
  // 監視する全施設
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

  const allEmpty = [];

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
  console.log("ITS健保 全施設チェック");
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

  try {

    // ==========================================
    // 施設ごとにチェック
    // ==========================================

    for (const facility of facilities) {

      console.log("================");
      console.log("施設:", facility);

      // 毎回、最初のカレンダーページに戻る
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000
      });

      await page.waitForTimeout(1500);

      // ========================================
      // 施設名をクリック
      // ========================================

      const facilityLink =
        page.getByText(
          facility,
          {
            exact: true
          }
        ).first();

      try {

        await facilityLink.waitFor({
          state: "visible",
          timeout: 10000
        });

      } catch (error) {

        console.log(
          "施設名が見つかりません:",
          facility
        );

        continue;
      }

      await facilityLink.click();

      await page.waitForTimeout(1000);

      // ========================================
      // カレンダー取得
      // ========================================

      const calendar =
        page.locator(
          '[id^="tcb"]:visible'
        ).first();

      try {

        await calendar.waitFor({
          state: "visible",
          timeout: 10000
        });

      } catch (error) {

        console.log(
          "カレンダーが見つかりません:",
          facility
        );

        continue;
      }

      // ========================================
      // 表示月取得
      // ========================================

      const getVisibleMonth = async () => {

        const visibleCalendar =
          page.locator(
            '[id^="tcb"]:visible'
          ).first();

        if (
          await visibleCalendar.count() === 0
        ) {
          return null;
        }

        const monthElement =
          visibleCalendar
            .locator(".month")
            .first();

        if (
          await monthElement.count() === 0
        ) {
          return null;
        }

        const text =
          await monthElement.textContent();

        return text
          ? text.trim()
          : null;
      };

      let currentMonth =
        await getVisibleMonth();

      console.log(
        "最初の表示月:",
        currentMonth
      );

      // ========================================
      // 最初の対象月へ移動
      // ========================================

      const firstTarget =
        targetMonths[0];

      const firstTargetText =
        firstTarget.year +
        "年" +
        String(firstTarget.month)
          .padStart(2, "0") +
        "月";

      let safety = 0;

      while (
        currentMonth &&
        !currentMonth.includes(firstTargetText) &&
        safety < 12
      ) {

        const nextButton =
          page.locator(
            'input.next-month:visible'
          ).first();

        try {

          await nextButton.waitFor({
            state: "visible",
            timeout: 5000
          });

          await nextButton.click();

          await page.waitForTimeout(500);

          currentMonth =
            await getVisibleMonth();

          console.log(
            "移動後:",
            currentMonth
          );

        } catch (error) {

          console.log(
            "次月ボタンが見つかりません"
          );

          break;
        }

        safety++;
      }

      // ========================================
      // 3ヶ月チェック
      // ========================================

      for (
        let monthIndex = 0;
        monthIndex < 3;
        monthIndex++
      ) {

        const target =
          targetMonths[monthIndex];

        console.log("----------------");

        console.log(
          facility +
          " / " +
          target.year +
          "年" +
          String(target.month)
            .padStart(2, "0") +
          "月"
        );

        const visibleCalendar =
          page.locator(
            '[id^="tcb"]:visible'
          ).first();

        await visibleCalendar.waitFor({
          state: "visible",
          timeout: 10000
        });

        const monthElement =
          visibleCalendar
            .locator(".month")
            .first();

        const monthText =
          await monthElement
            .textContent()
            .catch(() => "");

        console.log(
          "表示月:",
          monthText
            ? monthText.trim()
            : "不明"
        );

        // ======================================
        // 日付セル
        // ======================================

        const cells =
          visibleCalendar.locator(
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

          if (
            !date ||
            await statusElement.count() === 0
          ) {
            continue;
          }

          const status =
            await statusElement
              .textContent();

          if (!status) {
            continue;
          }

          const cleanStatus =
            status.trim();

          // ○ と △ だけ表示
          if (
            cleanStatus === "○" ||
            cleanStatus === "△"
          ) {

            console.log(
              "★★ 空き発見 ★★"
            );

            console.log(
              facility,
              date,
              cleanStatus
            );

            allEmpty.push({
              facility: facility,
              date: date,
              status: cleanStatus
            });
          }
        }

        // ======================================
        // 次の月へ
        // ======================================

        if (monthIndex < 2) {

          const nextButton =
            page.locator(
              'input.next-month:visible'
            ).first();

          try {

            await nextButton.waitFor({
              state: "visible",
              timeout: 5000
            });

            await nextButton.click();

            await page.waitForTimeout(500);

          } catch (error) {

            console.log(
              "次の月へ移動できません"
            );

            break;
          }
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
        "3ヶ月間、全施設に空きなし"
      );

    } else {

      console.log(
        "★★★ 空き発見 ★★★"
      );

      for (const item of allEmpty) {

        console.log(
          "🏨",
          item.facility
        );

        console.log(
          "📅",
          item.date
        );

        console.log(
          "空き状況:",
          item.status
        );

        console.log("----------------");
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
          "🚨 **ITS健保 全施設 空き発見！**\n\n";

        for (const item of allEmpty) {

          message +=
            "🏨 " +
            item.facility +
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
          "🔗 予約サイト\n" +
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
