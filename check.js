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

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    console.log("現在のURL:");
    console.log(page.url());

    console.log("================");
    console.log("空き照会リンクを探します");

    const link = page.getByText(
      "直営・通年・夏季・冬季保養施設(空き照会)",
      { exact: true }
    ).first();

    console.log(
      "リンク数:",
      await page.getByText(
        "直営・通年・夏季・冬季保養施設(空き照会)",
        { exact: true }
      ).count()
    );

    await link.waitFor({
      state: "visible",
      timeout: 30000
    });

    console.log("リンク発見！");
    console.log("クリックします");

    await link.click();

    await page.waitForTimeout(3000);

    console.log("================");
    console.log("クリック後のURL:");
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
