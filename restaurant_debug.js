
const { chromium } = require("playwright");

const START_URL =
  "https://as.its-kenpo.or.jp/apply/calendar?s=PT1nTjNnVFBrbG1KbFZuYzAxVFp5Vkhkd0YyWWZWR2JuOTJiblpTWjFKSGQ5a0hkdzFXWg%3D%3D&join_date=2027-01-04";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(START_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(2000);

    console.log("===== カレンダー操作ボタン =====");

    const controls = await page.locator(
      "a, button, input, [onclick]"
    ).evaluateAll(els =>
      els.map(el => ({
        tag: el.tagName,
        text: (el.innerText || el.value || "").trim(),
        onclick: el.getAttribute("onclick"),
        href: el.getAttribute("href"),
        html: el.outerHTML
      }))
    );

    console.log(JSON.stringify(controls, null, 2));

    console.log("\n===== 週送り関連HTML =====");

    const html = await page.locator("body").evaluate(el => el.innerHTML);

    const lines = html.split("\n").filter(line =>
      /next|prev|week|join_date|次週|翌週|前週|カレンダー/i.test(line)
    );

    console.log(lines.join("\n"));

    console.log("\n===== 1週間後のURLを確認 =====");

    const nextUrl = new URL(START_URL);
    nextUrl.searchParams.set("join_date", "2027-01-11");

    await page.goto(nextUrl.toString(), {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(2000);

    console.log("移動後URL:", page.url());
    console.log("移動後テキスト:");
    console.log((await page.locator("body").innerText()).slice(0, 3000));

  } catch (error) {
    console.error("エラー:", error);
  } finally {
    await browser.close();
  }
})();
