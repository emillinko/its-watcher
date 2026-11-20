
const { chromium } = require("playwright");
const crypto = require("crypto");

const SAKURA_URL =
  "https://as.its-kenpo.or.jp/apply/calendar?s=PT1RTzNnVFBrbG1KbFZuYzAxVFp5Vkhkd0YyWWZWR2JuOTJiblpTWjFKSGQ5a0hkdzFXWg%3D%3D&join_date=";

const ALFARO_URL =
  "https://as.its-kenpo.or.jp/apply/calendar2?a_s=876&s_c=11&join_date=2027/01/04";

const rooms = ["①", "②", "③", "④", "⑤"];

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 12);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("response", response => {
    if (["xhr", "fetch"].includes(response.request().resourceType())) {
      console.log("通信:", response.status(), response.url());
    }
  });

  try {
    console.log("========== 桜華樓 個室切替確認 ==========");

    await page.goto(SAKURA_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(1500);

    for (const room of rooms) {
      const name = `桜華樓(ディナー・個室${room})`;
      const link = page.locator("a").filter({ hasText: name }).first();

      console.log(`\n===== ${name} =====`);

      if (!(await link.count())) {
        console.log("リンクなし");
        continue;
      }

      console.log("クリック前:", await link.evaluate(el => el.outerHTML));

      const before = await page.locator("table").evaluateAll(tables =>
        tables.map(t => t.innerHTML).join("\n")
      );

      await link.click();
      await page.waitForTimeout(1200);

      const after = await page.locator("table").evaluateAll(tables =>
        tables.map(t => t.innerHTML).join("\n")
      );

      console.log("クリック後:", await link.evaluate(el => el.outerHTML));
      console.log("親要素:", await link.evaluate(el => el.parentElement.outerHTML));
      console.log("カレンダー変化:", hash(before) !== hash(after));
      console.log("カレンダー識別:", hash(after));

      const rows = await page.locator("tr").evaluateAll(els =>
        els.map(el => el.innerText.trim()).filter(Boolean)
      );

      console.log("20時:", rows.find(row => row.includes("20:00")) || "なし");
    }

    console.log("\n========== アルファーロ確認 ==========");

    await page.goto(ALFARO_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(1500);

    console.log("タイトル:", await page.title());
    console.log("URL:", page.url());

    console.log("リンク一覧:", await page.locator("a").evaluateAll(els =>
      els.map(el => ({
        text: el.innerText.trim(),
        href: el.getAttribute("href")
      })).filter(el => el.text)
    ));

    console.log("カレンダー行:", await page.locator("tr").evaluateAll(els =>
      els.map(el => el.innerText.trim()).filter(Boolean)
    ));

  } catch (error) {
    console.error("エラー:", error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
