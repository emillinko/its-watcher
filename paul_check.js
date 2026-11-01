
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
    console.log("PAUL四谷 メニュー情報確認");
    console.log("==============================");

    await page.goto(URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(4000);

    const agreement = page.getByText(
      "「お店からのお知らせ」を読み、内容を理解して同意する",
      { exact: true }
    );

    if (await agreement.count() > 0) {
      await agreement.first().click();
      await page.waitForTimeout(1000);
    }

    await page.locator(
      "#reservation_num_people_adult"
    ).selectOption("2");

    await page.waitForTimeout(2000);

    // メニュー情報を含む要素を取得
    const menus = await page.locator(
      "input[id^='reservation_orders_attributes_']"
    ).evaluateAll(inputs =>
      inputs.map(input => {
        let el = input;

        // メニュー情報を含む親要素をたどる
        for (let i = 0; i < 6 && el.parentElement; i++) {
          el = el.parentElement;
        }

        return {
          id: input.id,
          parentText: el.innerText,
          parentHTML: el.outerHTML
        };
      })
    );

    console.log("");
    console.log("===== メニュー情報 =====");
    console.log(JSON.stringify(menus, null, 2));

    // 朝食ビュッフェなどの文字を含む要素を探す
    const buffet = await page.getByText(
      "モーニングビュッフェ",
      { exact: false }
    ).evaluateAll(elements =>
      elements.map(el => ({
        tag: el.tagName,
        className: el.className,
        text: el.innerText
      }))
    );

    console.log("");
    console.log("===== ビュッフェ文字検索 =====");
    console.log(JSON.stringify(buffet, null, 2));

    console.log("");
    console.log("==============================");

  } catch (error) {
    console.error("ERROR:", error);
    process.exitCode = 1;

  } finally {
    await browser.close();
  }
})();
