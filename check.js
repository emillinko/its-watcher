const { chromium } = require("playwright");
const fs = require("fs");

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

  try {

    await page.goto(
      "REMOVED_ITS_KENPO_URL",
      {
        waitUntil: "domcontentloaded",
        timeout: 60000
      }
    );


    // ホテルクリック
    await page.click(
      'text=フルーツパーク富士屋ホテル'
    );


    // カレンダー読み込み待ち
    await page.waitForTimeout(8000);


    // HTML取得
    const html = await page.content();


    console.log(
      "HTML length =",
      html.length
    );


    console.log(
      "ホテル名確認",
      html.includes("フルーツパーク富士屋ホテル"),
      html.includes("ラビスタ富士河口湖")
    );

    // ○△×が存在する場所を探す
    const markIndex = html.search(/[○△×]/);
    
    console.log(
      "記号位置:",
      markIndex
    );
    
    if (markIndex !== -1) {
    
      console.log(
        html.substring(
          markIndex - 500,
          markIndex + 1000
        )
      );
    
    }


    // HTML保存
    fs.writeFileSync(
      "page.html",
      html
    );


    // スクショ
    await page.screenshot({
      path: "page.png",
      fullPage: true
    });

    // フルーツパーク富士屋ホテルのカレンダー取得
  
  const calendarId = "tcb765_1";
  
  const index = html.indexOf(calendarId);
  
  
  if (index !== -1) {
  
    const calendarHtml =
      html.substring(
        index,
        index + 20000
      );
  
  
    const marks =
      calendarHtml.match(/[○△☓]/g);
  
  
    console.log(
      "フルーツパーク空き状況:",
      marks ? marks.join("") : "なし"
    );
  
  
    if (marks) {
  
      if (
        marks.includes("○") ||
        marks.includes("△")
      ) {
  
        console.log(
          "★★ 空きあり ★★"
        );
  
      } else {
  
        console.log(
          "空きなし"
        );
  
      }
  
    }
  
  
  } else {
  
    console.log(
      "カレンダーIDが見つかりません"
    );
  
  }

})();
