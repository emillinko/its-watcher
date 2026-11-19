
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const sakuraUrl =
    "https://as.its-kenpo.or.jp/apply/calendar?s=PT1RTzNnVFBrbG1KbFZuYzAxVFp5Vkhkd0YyWWZWR2JuOTJiblpTWjFKSGQ5a0hkdzFXWg%3D%3D&join_date=";

  try {
    await page.goto(sakuraUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(1500);

    console.log("===== ページタイトル =====");
    console.log(await page.title());

    console.log("===== 現在のURL =====");
    console.log(page.url());

    console.log("===== 個室切り替えリンク =====");

    const links = await page.locator("a").evaluateAll(els =>
      els.map(a => ({
        text: a.innerText.trim(),
        href: a.href
      })).filter(x =>
        x.text.includes("桜華樓") ||
        x.text.includes("個室")
      )
    );

    console.log(JSON.stringify(links, null, 2));

    console.log("===== カレンダーの行 =====");

    const rows = await page.locator("tr").evaluateAll(els =>
      els.map(tr => tr.innerText.trim()).filter(Boolean)
    );

    console.log(JSON.stringify(rows, null, 2));

    console.log("===== 入力・ボタン =====");

    const controls = await page.locator(
      "input, select, button"
    ).evaluateAll(els =>
      els.map(el => ({
        tag: el.tagName,
        type: el.getAttribute("type"),
        value: el.value || "",
        text: el.innerText || "",
        name: el.getAttribute("name"),
        className: el.className
      }))
    );

    console.log(JSON.stringify(controls, null, 2));

  } catch (error) {
    console.error("確認エラー:", error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
