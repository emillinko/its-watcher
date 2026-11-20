
const { chromium } = require("playwright");

const URL =
  "https://as.its-kenpo.or.jp/apply/calendar2?a_s=876&s_c=11&join_date=2027/01/04";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("response", response => {
    if (response.url().includes("its-kenpo.or.jp")) {
      console.log("RESPONSE", response.status(), response.url());
    }
  });

  page.on("requestfailed", request => {
    console.log("REQUEST FAILED", request.url(),
      request.failure()?.errorText);
  });

  page.on("console", msg => {
    if (msg.type() === "error") {
      console.log("BROWSER ERROR", msg.text());
    }
  });

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

    await page.waitForTimeout(8000);

    console.log("\n===== ページ情報 =====");
    console.log("タイトル:", await page.title());
    console.log("URL:", page.url());
    console.log("HTML文字数:", (await page.content()).length);

    console.log("\n===== 本文 =====");
    console.log((await page.locator("body").innerText()).slice(0, 3000));

    console.log("\n===== フレーム =====");
    for (const frame of page.frames()) {
      console.log("FRAME:", frame.url());
      console.log("TITLE:", await frame.title().catch(() => ""));
    }

    console.log("\n===== Cookie =====");
    const cookies = await page.context().cookies();
    console.log(cookies.map(c => ({
      name: c.name,
      domain: c.domain
    })));

    console.log("\n===== HTML内のスクリプト =====");
    console.log(await page.locator("script").evaluateAll(els =>
      els.map(el => el.src || el.textContent.slice(0, 200))
    ));

  } catch (e) {
    console.log("ERROR:", e.message);
  } finally {
    await browser.close();
  }
})();
