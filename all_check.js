const { chromium } = require("playwright");

(async () => {

  console.log("================");
  console.log("全施設チェック");
  console.log("================");

  const url = process.env.ITS_KENPO_URL;

  if (!url) {
    console.log("ITS_KENPO_URL: 空です");
    console.log("ここで終了します");
    return;
  }

  console.log("ITS_KENPO_URL: 設定されています");

  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  try {

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(2000);

    console.log("================");
    console.log("アクセス成功");
    console.log("現在URL:");
    console.log(page.url());

    console.log("================");
    console.log("タイトル:");
    console.log(await page.title());

    console.log("================");
    console.log("ページ本文:");

    const text =
      await page.locator("body").innerText();

    console.log(text.slice(0, 5000));

  } catch (error) {

    console.error("================");
    console.error("★★ エラー発生 ★★");
    console.error(error.message);

    process.exitCode = 1;

  } finally {

    await browser.close();
  }

})();
