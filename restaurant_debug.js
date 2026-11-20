
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log("===== ITS健保入口へ接続 =====");

    await page.goto(process.env.ITS_KENPO_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    console.log("タイトル:", await page.title());

    console.log("\n===== 画面全体のテキスト =====");
    console.log(await page.locator("body").innerText());

    console.log("\n===== クリックできそうな要素 =====");

    const elements = await page.locator(
      "a, button, input, select, [onclick], [role='button'], [tabindex]"
    ).evaluateAll(els =>
      els.map(el => ({
        tag: el.tagName,
        text: (el.innerText || el.value || el.getAttribute("aria-label") || "").trim(),
        onclick: el.getAttribute("onclick"),
        href: el.getAttribute("href"),
        type: el.getAttribute("type"),
        html: el.outerHTML.slice(0, 1000)
      }))
    );

    console.log(JSON.stringify(elements, null, 2));

    console.log("\n===== アルファーロ関連の要素 =====");

    const matches = await page.locator("body *").evaluateAll(els =>
      els.filter(el => {
        const text = (el.innerText || "").trim();
        return text &&
          text.length < 300 &&
          /アル|ファーロ|レストラン|ディナー/i.test(text);
      }).map(el => ({
        tag: el.tagName,
        text: (el.innerText || "").trim(),
        html: el.outerHTML.slice(0, 1500)
      }))
    );

    console.log(JSON.stringify(matches, null, 2));

  } catch (error) {
    console.error("デバッグエラー:", error);
  } finally {
    await browser.close();
  }
})();
