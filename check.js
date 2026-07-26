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


    // フルーツパーククリック
    await page.click(
      'text=フルーツパーク富士屋ホテル'
    );


    await page.waitForTimeout(5000);


    let emptyList = [];


    // 7月・8月・9月取得
    for (let month = 0; month < 3; month++) {


      console.log(
        "=========="
      );

      console.log(
        "月チェック:",
        month + 1
      );


      const html =
        await page.content();


      const calendar =
        html.match(
          /<td[^>]*data-join-time="([^"]+)"[\s\S]*?<span class="icon">(.*?)<\/span>[\s\S]*?<\/td>/g
        );


      if (calendar) {


        calendar.forEach(cell => {


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


      // 次月へ
      if (month < 2) {

        await page.click(
          "#nextMonth"
        );


        await page.waitForTimeout(
          3000
        );

      }


    }


    console.log(
      "================"
    );


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


    fs.writeFileSync(
      "page.html",
      await page.content()
    );


    console.log(
      "saved"
    );


  } finally {


    await browser.close();


  }


})();
