
const { chromium } = require("playwright");

const URL =
  "https://as.its-kenpo.or.jp/apply/calendar?s=PT1RTzNnVFBrbG1KbFZuYzAxVFp5Vkhkd0YyWWZWR2JuOTJiblpTWjFKSGQ5a0hkdzFXWg%3D%3D&join_date=";

const rooms = [
  { name: "個室①", id: "879" },
  { name: "個室②", id: "880" },
  { name: "個室③", id: "881" },
  { name: "個室④", id: "882" },
  { name: "個室⑤", id: "883" }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(process.env.ITS_KENPO_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });
    await page.waitForTimeout(1500);

    await page.goto(URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });
    await page.waitForTimeout(3000);

    for (const room of rooms) {
      console.log(`\n===== 桜華樓 ${room.name} =====`);

      const tab = page.locator(`#link-${room.id}`);
      await tab.click();
      await page.waitForTimeout(2000);

      console.log("URL:", page.url());

      const rows = await page.locator("tr").evaluateAll(els =>
        els.map(tr => ({
          text: tr.innerText.trim(),
          html: tr.outerHTML.slice(0, 1800)
        })).filter(row => row.text.includes("20") || row.text.includes("時"))
      );

      console.log("20時関連の行:");
      console.log(JSON.stringify(rows, null, 2));

      const cells = await page.locator("td[data-join-time]").evaluateAll(els =>
        els.map(td => ({
          text: td.innerText.trim(),
          id: td.id,
          joinTime: td.getAttribute("data-join-time"),
          html: td.outerHTML.slice(0, 800)
        }))
      );

      console.log("data-join-timeセル:", JSON.stringify(cells, null, 2));
    }
  } catch (e) {
    console.log("ERROR:", e.message);
  } finally {
    await browser.close();
  }
})();
