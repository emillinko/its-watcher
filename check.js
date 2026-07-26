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


    /*
      フルーツパーク富士屋ホテル
      部分だけ取得
    */

    const hotelName =
      "フルーツパーク富士屋ホテル";


    const index =
      html.indexOf(hotelName);


    if (index !== -1) {

      const hotelHtml =
        html.substring(
          index,
          index + 15000
        );


      const marks =
        hotelHtml.match(/[○△×]/g);


      console.log(
        "フルーツパーク空き状況:",
        marks ? marks.join("") : "なし"
      );


      if (marks) {

        const hasEmpty =
          marks.includes("○") ||
          marks.includes("△");


        if (hasEmpty) {

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
        "ホテル部分が見つかりません"
      );

    }


    console.log("saved");


  } finally {

    await browser.close();

  }

})();
