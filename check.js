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


    await page.waitForTimeout(5000);


    let emptyList = [];


    // 7月・8月・9月
    for (let i = 0; i < 3; i++) {


      console.log("================");
      console.log(
        "月チェック:",
        i + 1
      );


      // 表示中のカレンダーだけ取得
      const calendarHtml =
        await page.locator(
          ".tabConBody:visible"
        ).innerHTML();


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


      // 次月へ
      if (i < 2) {


        const nextButton =
          page.locator(
            "input.next-month:visible"
          );


        await nextButton.click();


        // Ajax更新待ち
        await page.waitForTimeout(
          3000
        );


      }


    }


    console.log("================");


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
