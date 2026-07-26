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

// フルーツパーク富士屋ホテル
// 7月・8月・9月チェック

const calendarIds = [
  "tcb765_1",
  "tcb765_2",
  "tcb765_3"
];


let emptyList = [];


for (const calendarId of calendarIds) {


  const index =
    html.indexOf(calendarId);


  if (index === -1) {

    console.log(
      calendarId,
      "見つからず"
    );

    continue;

  }


  const nextIndex =
    html.indexOf(
      '<div class="tabConBody"',
      index + 100
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


  if (cells) {


    cells.forEach(cell => {


      const date =
        cell.match(
          /data-join-time="([^"]+)"/
        );


      const status =
        cell.match(
          /<span class="icon">(.*?)<\/span>/
        );


      if (
        date &&
        status
      ) {


        console.log(
          date[1],
          status[1]
        );


        if (
          status[1] === "○" ||
          status[1] === "△"
        ) {

          emptyList.push({
            date: date[1],
            status: status[1]
          });

        }

      }


    });

  }

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
    


})();
