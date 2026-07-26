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


    // 保存
    fs.writeFileSync(
      "page.html",
      html
    );


    await page.screenshot({
      path: "page.png",
      fullPage: true
    });



    /*
      フルーツパーク富士屋ホテル
      7月〜9月チェック
    */


    // カレンダーIDを自動取得
    const calendarIds = [
      ...html.matchAll(/id="(tcb\d+_\d+)"/g)
    ]
    .map(m => m[1]);


    console.log(
      "取得したカレンダーID:",
      calendarIds
    );


    let emptyList = [];


    for (const calendarId of calendarIds) {


      const index =
        html.indexOf(calendarId);


      if (index === -1) {
        continue;
      }


      const nextIndex =
        html.indexOf(
          '<div class="tabConBody"',
          index + 500
        );


      const calendarHtml =
        html.substring(
          index,
          nextIndex !== -1
            ? nextIndex
            : index + 15000
        );


      console.log(
        "チェック:",
        calendarId
      );


      const cells =
        calendarHtml.match(
          /<td[^>]*data-join-time="([^"]+)"[\s\S]*?<span class="icon">(.*?)<\/span>[\s\S]*?<\/td>/g
        );


      if (!cells) {
        continue;
      }


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
          !dateMatch ||
          !statusMatch
        ) {
          return;
        }


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
            date,
            status
          });

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
        "7月〜9月 空きなし"
      );


    }


    console.log(
      "saved"
    );


  } finally {


    await browser.close();


  }


})();
