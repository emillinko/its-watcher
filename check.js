const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage({
    viewport: { width: 1400, height: 1200 }
  });

  try {
    await page.goto(
      "REMOVED_ITS_KENPO_URL",
      {
        waitUntil: "domcontentloaded",
        timeout: 60000
      }
    );
    
    // フルーツパーク富士屋ホテルをクリック
    await page.click('text=フルーツパーク富士屋ホテル');
    
    // 読み込み待ち
    await page.waitForTimeout(5000);
    
    // HTMLを取り直す
    const html = await page.content();
    
    console.log("クリック後 HTML length =", html.length);
    
    // カレンダーが読み込まれたか確認
    console.log(
      "calendar loaded =",
      html.includes("tcb2632_1") || html.includes("calendar")
    );
        
    // JavaScriptが動くのを待つ
    await page.waitForTimeout(8000);

    // HTML保存
    fs.writeFileSync("page.html", await page.content());

    // スクリーンショット保存
    await page.screenshot({
      path: "page.png",
      fullPage: true
    });

    console.log("Title:", await page.title());

    const html = await page.content();

    console.log("HTML length =", html.length);

    console.log(
      "ホテル名あり？",
      html.includes("フルーツパーク"),
      html.includes("ラビスタ")
    );

    console.log(
      "○△×",
      html.includes("○"),
      html.includes("△"),
      html.includes("×")
    );
    
    const matches = html.match(/[○△×]/g);
    console.log("記号数 =", matches ? matches.length : 0);
    
    if (matches) {
      console.log(matches.slice(0, 100).join(""));
    }

    const index = html.indexOf("フルーツパーク富士屋ホテル");
    console.log(html.substring(index - 500, index + 5000));

    console.log("saved");

  } finally {
    await browser.close();
  }

})();

