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
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(2000);

    console.log("================");
    console.log("施設選択ページ");
    console.log(page.url());

    const facility = page.getByText(
      "ラビスタ富士河口湖",
      { exact: true }
    ).first();

    console.log(
      "施設リンク数:",
      await page.getByText(
        "ラビスタ富士河口湖",
        { exact: true }
      ).count()
    );

    await facility.waitFor({
      state: "visible",
      timeout: 30000
    });

    console.log("ラビスタ富士河口湖をクリック");

    await facility.click();

    await page.waitForTimeout(3000);

    console.log("================");
    console.log("クリック後URL:");
    console.log(page.url());

    console.log("================");
    console.log("タイトル:");
    console.log(await page.title());

    console.log("================");
    console.log("HTML length:");
    console.log((await page.content()).length);

    console.log("================");
    console.log("ページ内容:");

    const text =
      await page.locator("body").innerText();

    console.log(text.slice(0, 15000));

  } catch (error) {

    console.error("================");
    console.error("エラー発生");
    console.error(error.message);

    process.exitCode = 1;

  } finally {

    await browser.close();

  }
})();
