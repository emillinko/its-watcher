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
    console.log("PAUL四谷 カレンダー確認");
    console.log("==============================");

    await page.goto(URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(5000);

    console.log("URL:", page.url());
    console.log("タイトル:", await page.title());

    // お知らせ同意
    const agreement = page.getByText(
      "「お店からのお知らせ」を読み、内容を理解して同意する",
      { exact: true }
    );

    if (await agreement.count() > 0) {
      console.log("▶ お知らせ同意");
      await agreement.first().click();
      await page.waitForTimeout(1000);
    }

    // 大人2名
    const adult = page.locator("#reservation_num_people_adult");

    if (await adult.count() > 0) {
      await adult.selectOption("2");
      console.log("▶ 大人2名");
    } else {
      console.log("⚠ 大人選択欄が見つかりません");
    }

    await page.waitForTimeout(2000);

    // カレンダー本体を探す
    const timetable = page.locator("#timetable-body");

    console.log("");
    console.log("===== カレンダー確認 =====");
    console.log("#timetable-body 件数:", await timetable.count());

    if (await timetable.count() > 0) {
      console.log("カレンダー発見！");

      console.log(
        "HTML長:",
        (await timetable.evaluate(el => el.outerHTML)).length
      );

      console.log("");
      console.log(
        await timetable.evaluate(el => el.outerHTML)
      );

    } else {
      console.log("❌ #timetable-body が見つかりません");

      // timetableという名前を含む要素を探す
      const candidates = await page.locator(
        '[id*="timetable"], [class*="timetable"]'
      ).evaluateAll(elements =>
        elements.slice(0, 30).map(el => ({
          tag: el.tagName,
          id: el.id,
          class: el.className
        }))
      );

      console.log("");
      console.log("===== timetable候補 =====");
      console.log(JSON.stringify(candidates, null, 2));
    }

    console.log("==========================");

  } catch (error) {
    console.error("❌ ERROR");
    console.error(error);
    process.exitCode = 1;

  } finally {
    await browser.close();
  }
})();
