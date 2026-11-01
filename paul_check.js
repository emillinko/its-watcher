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
    console.log("PAUL四谷 カレンダー構造調査");
    console.log("==============================");

    await page.goto(URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // お知らせ同意
    const agreement = page.getByText(
      "「お店からのお知らせ」を読み、内容を理解して同意する",
      { exact: true }
    );

    if (await agreement.count() > 0) {
      await agreement.first().click();
      await page.waitForTimeout(500);
    }

    // 大人2名
    await page.locator("#reservation_num_people_adult")
      .selectOption("2");

    // 日付欄
    await page.locator("#reservation_start_date").click();

    await page.waitForTimeout(1000);

    console.log("▶ カレンダー表示");

    // ------------------------------------------------
    // カレンダーらしい要素を全部調査
    // ------------------------------------------------

    const calendarElements = await page.locator(
      "[class*='calendar'], [class*='datepick'], [class*='datepicker'], [class*='day'], [class*='date']"
    ).evaluateAll(elements =>
      elements.map((el, index) => ({
        index,
        tag: el.tagName,
        id: el.id,
        class: typeof el.className === "string"
          ? el.className
          : "",
        role: el.getAttribute("role"),
        ariaLabel: el.getAttribute("aria-label"),
        text: (el.innerText || "").trim().slice(0, 500),
        html: el.outerHTML.slice(0, 3000)
      }))
    );

    console.log("");
    console.log("===== カレンダー関連要素 =====");

    for (const item of calendarElements) {
      console.log(JSON.stringify(item, null, 2));
    }

    console.log("==============================");

    // ------------------------------------------------
    // 「11月」「1」を含む要素を直接検索
    // ------------------------------------------------

    const textElements = await page.locator("body *").evaluateAll(elements =>
      elements
        .map((el, index) => ({
          index,
          tag: el.tagName,
          id: el.id,
          class: typeof el.className === "string"
            ? el.className
            : "",
          text: (el.innerText || "").trim()
        }))
        .filter(x =>
          x.text === "11月" ||
          x.text === "1" ||
          x.text.includes("11月")
        )
        .slice(0, 100)
    );

    console.log("");
    console.log("===== 11月 / 1 の要素 =====");

    for (const item of textElements) {
      console.log(JSON.stringify(item));
    }

    console.log("==============================");

    // ------------------------------------------------
    // カレンダーのHTMLを保存
    // ------------------------------------------------

    const calendarHtml = await page.locator("body").evaluate(() => {
      const all = Array.from(document.querySelectorAll("*"));

      const candidates = all.filter(el => {
        const text = (el.innerText || "").trim();

        return (
          text.includes("11月") &&
          text.includes("日") &&
          text.includes("月") &&
          text.includes("火")
        );
      });

      if (candidates.length === 0) {
        return "CALENDAR NOT FOUND";
      }

      // 最も小さい候補を探す
      candidates.sort(
        (a, b) =>
          a.outerHTML.length - b.outerHTML.length
      );

      return candidates[0].outerHTML;
    });

    console.log("");
    console.log("===== カレンダーHTML =====");
    console.log(calendarHtml.slice(0, 15000));
    console.log("==========================");

  } catch (error) {
    console.error("");
    console.error("❌ ERROR");
    console.error(error);
    process.exitCode = 1;

  } finally {
    await browser.close();
  }
})();
