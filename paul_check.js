const { chromium } = require("playwright");

const URL =
  "https://www.tablecheck.com/ja/shops/paul-yotsuya/reserve";

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage({
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo"
  });

  try {
    console.log("PAUL四谷 カレンダー構造確認");
    console.log("================================");

    await page.goto(URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(4000);

    // お知らせ同意
    const agreement = page.getByText(
      "「お店からのお知らせ」を読み、内容を理解して同意する",
      { exact: true }
    );

    if (await agreement.count() > 0) {
      await agreement.first().click();
      await page.waitForTimeout(1000);
      console.log("▶ お知らせ同意");
    }

    // 大人2名
    await page.locator(
      "#reservation_num_people_adult"
    ).selectOption("2");

    await page.waitForTimeout(1500);
    console.log("▶ 大人2名");

    // 現在のモーニングビュッフェ（3,080円）
    const menu = page.locator(
      "#reservation_orders_attributes_1_is_group_order"
    );

    await menu.check({ force: true });
    await page.waitForTimeout(2500);

    console.log(
      "▶ 3,080円メニュー選択:",
      await menu.isChecked()
    );

    // --------------------------------
    // カレンダーの日付を確認
    // --------------------------------
    async function showDates(label) {
      console.log("");
      console.log("========== " + label + " ==========");

      const dates = await page.locator(
        "#timetable-body td.wday"
      ).evaluateAll(cells =>
        cells.map((td, index) => ({
          index,
          weekday: td.querySelector(
            ".day-name"
          )?.textContent.trim(),
          day: td.querySelector(
            ".date-num"
          )?.textContent.trim(),
          className: td.className
        }))
      );

      console.log(
        JSON.stringify(dates, null, 2)
      );
    }

    await showDates("現在");

    // --------------------------------
    // 次週ボタンを調査
    // --------------------------------
    console.log("");
    console.log("========== 次週ボタン確認 ==========");

    const nextButtons = await page.locator(
      ".next-week.next_prev_btn"
    ).evaluateAll(elements =>
      elements.map((el, index) => ({
        index,
        tag: el.tagName,
        text: el.textContent.trim(),
        className: el.className,
        href: el.getAttribute("href"),
        visible: !!(
          el.offsetWidth ||
          el.offsetHeight ||
          el.getClientRects().length
        )
      }))
    );

    console.log(
      JSON.stringify(nextButtons, null, 2)
    );

    // --------------------------------
    // timetable 全体のHTML構造を確認
    // --------------------------------
    console.log("");
    console.log("========== timetable構造 ==========");

    const timetableInfo = await page.locator(
      "#timetable-body"
    ).evaluate(el => ({
      tag: el.tagName,
      id: el.id,
      className: el.className,
      htmlLength: el.innerHTML.length,
      html: el.innerHTML
    }));

    console.log("tag:", timetableInfo.tag);
    console.log("id:", timetableInfo.id);
    console.log("class:", timetableInfo.className);
    console.log("HTML length:", timetableInfo.htmlLength);

    console.log("");
    console.log("----- timetable HTML -----");
    console.log(timetableInfo.html);

    // --------------------------------
    // 次週ボタンをクリック
    // --------------------------------
    const nextButton = page.locator(
      ".next-week.next_prev_btn"
    ).filter({ visible: true }).first();

    console.log("");
    console.log(
      "次週ボタン visible:",
      await nextButton.count()
    );

    if (await nextButton.count() > 0) {
      console.log("▶ 次週ボタンをクリック");

      await nextButton.click();

      await page.waitForTimeout(3000);

      await showDates("次週");

      console.log("");
      console.log("次週のURL:");
      console.log(page.url());

    } else {
      console.log("⚠ 次週ボタンが見つかりません");
    }

    console.log("");
    console.log("================================");
    console.log("確認終了");

  } catch (error) {
    console.error("");
    console.error("❌ ERROR");
    console.error(error);
    process.exitCode = 1;

  } finally {
    await browser.close();
  }
})();
