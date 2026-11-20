
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  page.on("response", response => {
    if (response.url().includes("its-kenpo.or.jp")) {
      console.log(
        "通信:",
        response.status(),
        response.url()
      );
    }
  });

  try {
    console.log("===== ITS健保入口 =====");

    await page.goto(process.env.ITS_KENPO_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(2000);

    console.log("入口タイトル:", await page.title());
    console.log("入口URL:", page.url());

    console.log("\n===== 入口リンク一覧 =====");

    const links = await page.locator("a").evaluateAll(els =>
      els.map(el => ({
        text: el.innerText.trim(),
        href: el.href
      })).filter(x => x.text || x.href)
    );

    console.log(JSON.stringify(links, null, 2));

    const alfaroLink = page.locator("a").filter({
      hasText: "アル・ファーロ"
    }).first();

    if (!(await alfaroLink.count())) {
      console.log("アルファーロのリンクが見つかりません");
      return;
    }

    console.log("\n===== アルファーロへ移動 =====");

    await alfaroLink.click();
    await page.waitForTimeout(4000);

    console.log("タイトル:", await page.title());
    console.log("URL:", page.url());

    console.log("\n===== 画面テキスト =====");

    const bodyText = await page.locator("body").innerText();

    console.log(bodyText.slice(0, 10000));

    console.log("\n===== カレンダー関連HTML =====");

    const html = await page.locator("body").evaluate(el =>
      el.innerHTML
    );

    console.log(
      html.match(/<table[\s\S]*?<\/table>/gi)?.join("\n") ||
      "tableが見つかりません"
    );

    console.log("\n===== ページ内リンク =====");

    const afterLinks = await page.locator("a").evaluateAll(els =>
      els.map(el => ({
        text: el.innerText.trim(),
        href: el.href
      }))
    );

    console.log(JSON.stringify(afterLinks, null, 2));

  } catch (error) {
    console.error("デバッグエラー:", error);
  } finally {
    await browser.close();
  }
})();
