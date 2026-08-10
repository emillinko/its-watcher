const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage({
    viewport: {
      width: 1400,
      height: 1200
    }
  });

  const url = process.env.ITS_KENPO_URL_2;

  try {
    console.log("================");
    console.log("新しいURLを確認します");
    console.log(url ? "URL設定あり" : "URL設定なし");

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    console.log("================");
    console.log("実際のURL:");
    console.log(page.url());

    console.log("================");
    console.log("タイトル:");
    console.log(await page.title());

    console.log("================");
    console.log("HTML length:");
    console.log((await page.content()).length);

    console.log("================");
    console.log("ページ内容:");

    const text = await page.locator("body").innerText();

    console.log(text.slice(0, 10000));

  } catch (error) {
    console.error("================");
    console.error("エラー発生");
    console.error(error.message);

    process.exitCode = 1;

  } finally {
    await browser.close();
  }
})();
