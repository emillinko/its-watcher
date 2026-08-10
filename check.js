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

    // 「空き照会」を開く
    const vacancyLink = page.getByText(
      "直営・通年・夏季・冬季保養施設(空き照会)",
      { exact: true }
    ).first();

    await vacancyLink.waitFor({
      state: "visible",
      timeout: 30000
    });

    await vacancyLink.click();

    await page.waitForTimeout(2000);

    console.log("================");
    console.log("施設選択ページ:");
    console.log(page.url());

    console.log("================");
    console.log("ラビスタ周辺のHTMLを探します");

    const html = await page.content();

    const index = html.indexOf("ラビスタ富士河口湖");

    console.log("文字の位置:", index);

    if (index >= 0) {
      console.log("================");
      console.log(
        html.substring(
          Math.max(0, index - 1500),
          index + 1500
        )
      );
    } else {
      console.log(
        "ラビスタ富士河口湖がHTML内にありません"
      );
    }

    console.log("================");
    console.log("施設関連リンク一覧");

    const links = page.locator("a");
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);

      const text = (
        await link.innerText().catch(() => "")
      ).trim();

      if (
        text.includes("ラビスタ") ||
        text.includes("富士") ||
        text.includes("ホテル")
      ) {
        console.log(
          "TEXT:",
          text
        );

        console.log(
          "HREF:",
          await link.getAttribute("href")
        );
      }
    }

  } catch (error) {

    console.error("================");
    console.error("エラー発生");
    console.error(error.message);

    process.exitCode = 1;

  } finally {

    await browser.close();

  }
})();
