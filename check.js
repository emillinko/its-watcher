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


    // フルーツパーク富士屋ホテルをクリック
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


    // スクショ保存
    await page.screenshot({
      path: "page.png",
      fullPage: true
    });


    /*
      フルーツパーク富士屋ホテル
      カレンダー取得
    */

    const calendarId = "tcb765_1";


    const index =
      html.indexOf(calendarId);


    if (index === -1) {

      console.log(
        "カレンダーが見つかりません"
      );

      return;

    }


    const calendarHtml =
      html.substring(
        index,
        index + 20000
      );


    /*
      日付と空き状況取得
    */

    const cells =
      calendarHtml.match(
        /<td[^>]*data-join-time="([^"]+)"[\s\S]*?<span class="icon">(.*?)<\/span>[\s\S]*?<\/td>/g
      );


    let emptyList = [];


    if (cells) {

      cells.forEach(cell => {


        const dateMatch =
          cell.match(
            /data-join-time="([^"]+)"/
          );


        const statusMatch =
          cell.match(
            /<span class="icon">(.*?)<\/span>/
          );


        if (
          dateMatch &&
          statusMatch
        ) {

          const date =
            dateMatch[1];


          const status =
            statusMatch[1];


          console.log(
            date,
            status
          );


          if (
            status === "○" ||
            status === "△"
          ) {

            emptyList.push({
              date: date,
              status: status
            });

          }

        }


      });

    }


    console.log("----------------");

    if (emptyList.length > 0) {


      console.log(
        "★★ 空き発見 ★★"
      );


      emptyList.forEach(item => {

        console.log(
          item.date,
          item.status
        );

      });


    } else {


      console.log(
        "空きなし"
      );


    }


    console.log("saved");


  } finally {

    await browser.close();

  }


})();
