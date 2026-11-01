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
    console.log("PAUL四谷 UI構造調査");
    console.log("==============================");

    await page.goto(URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    console.log("ページ読み込み完了");

    // お知らせ同意
    const agreement = page.getByText(
      "「お店からのお知らせ」を読み、内容を理解して同意する",
      { exact: true }
    );

    if (await agreement.count() > 0) {
      console.log("▶ お知らせ同意をクリック");
      await agreement.first().click();
      await page.waitForTimeout(1000);
    }

    // --------------------------------------------------
    // 1. 「時間」の周辺HTML
    // --------------------------------------------------

    console.log("");
    console.log("===== 時間周辺HTML =====");

    const timeInfo = await page.locator("body").evaluate(() => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT
      );

      const results = [];

      while (walker.nextNode()) {
        const el = walker.currentNode;

        if (
          el.textContent &&
          el.textContent.trim() === "-- 時間 --"
        ) {
          results.push({
            tag: el.tagName,
            id: el.id,
            class: el.className,
            outerHTML: el.parentElement
              ? el.parentElement.outerHTML.slice(0, 5000)
              : el.outerHTML
          });
        }
      }

      return results;
    });

    console.log(JSON.stringify(timeInfo, null, 2));

    // --------------------------------------------------
    // 2. 「大人」の周辺HTML
    // --------------------------------------------------

    console.log("");
    console.log("===== 大人周辺HTML =====");

    const adultInfo = await page.locator("body").evaluate(() => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT
      );

      const results = [];

      while (walker.nextNode()) {
        const el = walker.currentNode;

        if (
          el.textContent &&
          el.textContent.trim() === "-- 大人 --"
        ) {
          results.push({
            tag: el.tagName,
            id: el.id,
            class: el.className,
            outerHTML: el.parentElement
              ? el.parentElement.outerHTML.slice(0, 5000)
              : el.outerHTML
          });
        }
      }

      return results;
    });

    console.log(JSON.stringify(adultInfo, null, 2));

    // --------------------------------------------------
    // 3. 「選択する」の周辺HTML
    // --------------------------------------------------

    console.log("");
    console.log("===== 選択する周辺HTML =====");

    const chooseInfo = await page.locator("body").evaluate(() => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT
      );

      const results = [];

      while (walker.nextNode()) {
        const el = walker.currentNode;

        if (
          el.textContent &&
          el.textContent.trim() === "選択する"
        ) {
          results.push({
            tag: el.tagName,
            id: el.id,
            class: el.className,
            role: el.getAttribute("role"),
            dataAttrs: Array.from(el.attributes)
              .filter(a => a.name.startsWith("data-"))
              .reduce((obj, a) => {
                obj[a.name] = a.value;
                return obj;
              }, {}),
            outerHTML: el.parentElement
              ? el.parentElement.outerHTML.slice(0, 5000)
              : el.outerHTML
          });
        }
      }

      return results;
    });

    console.log(JSON.stringify(chooseInfo, null, 2));

    // --------------------------------------------------
    // 4. role="button" の一覧
    // --------------------------------------------------

    console.log("");
    console.log("===== role=button =====");

    const roleButtons = await page.locator('[role="button"]').evaluateAll(
      elements =>
        elements.map((el, index) => ({
          index,
          tag: el.tagName,
          text: (el.innerText || "").trim().slice(0, 200),
          id: el.id,
          class: el.className,
          ariaLabel: el.getAttribute("aria-label"),
          dataAttrs: Array.from(el.attributes)
            .filter(a => a.name.startsWith("data-"))
            .reduce((obj, a) => {
              obj[a.name] = a.value;
              return obj;
            }, {})
        }))
    );

    for (const item of roleButtons) {
      console.log(JSON.stringify(item));
    }

    // --------------------------------------------------
    // 5. data-* 属性を持つクリック可能そうな要素
    // --------------------------------------------------

    console.log("");
    console.log("===== data属性付き要素 =====");

    const dataElements = await page.locator(
      "[data-action], [data-value], [data-target], [data-testid], [data-date], [data-time]"
    ).evaluateAll(elements =>
      elements.map((el, index) => ({
        index,
        tag: el.tagName,
        text: (el.innerText || "").trim().slice(0, 150),
        id: el.id,
        class: el.className,
        dataAttrs: Array.from(el.attributes)
          .filter(a => a.name.startsWith("data-"))
          .reduce((obj, a) => {
            obj[a.name] = a.value;
            return obj;
          }, {})
      }))
    );

    for (const item of dataElements) {
      console.log(JSON.stringify(item));
    }

    console.log("");
    console.log("==============================");
    console.log("UI構造調査終了");

  } catch (error) {
    console.error("");
    console.error("❌ ERROR");
    console.error(error);
    process.exitCode = 1;

  } finally {
    await browser.close();
  }
})();
