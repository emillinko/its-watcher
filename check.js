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


    // カレンダー表示待ち

    await page.waitForTimeout(5000);



    let emptyList = [];



    // 7月・8月・9月

    for (
      let month = 0;
      month < 3;
      month++
    ) {



      console.log("================");
      console.log(
        "月チェック:",
        month + 1
      );



      /*
        表示中のカレンダーだけ取得

        tcas → 除外
        tcb  → カレンダー
      */


      const calendarLocator =
        page.locator(
          '[id^="tcb"]:visible'
        );



      const count =
        await calendarLocator.count();



      console.log(
        "表示カレンダー数:",
        count
      );



      if (count === 0) {


        console.log(
          "カレンダーなし"
        );


        break;

      }



      const calendarHtml =
        await calendarLocator
          .first()
          .innerHTML();



      /*
        日付と状態取得
      */


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



      /*
        翌月へ移動
      */


      if (month < 2) {



        const nextButton =
          page.locator(
            'input.next-month:visible'
          )
          .first();



        await nextButton.click();



        await page.waitForTimeout(
          4000
        );

      }



    }



    console.log("================");



    if (
      emptyList.length > 0
    ) {



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




    // 保存

    fs.writeFileSync(
      "page.html",
      await page.content()
    );



    await page.screenshot({

      path: "page.png",

      fullPage: true

    });



    console.log(
      "saved"
    );



  } finally {


    await browser.close();


  }



})();
