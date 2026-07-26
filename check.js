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



  const url =
    "REMOVED_ITS_KENPO_URL";



  const hotels = [
    "フルーツパーク富士屋ホテル",
    "ラビスタ富士河口湖"
  ];



  let allEmpty = [];



  try {



    for (const hotel of hotels) {


      console.log("================");
      console.log(
        "ホテル:",
        hotel
      );


      // 毎回トップから開始

      await page.goto(
        url,
        {
          waitUntil:"domcontentloaded",
          timeout:60000
        }
      );


      await page.waitForTimeout(
        3000
      );



      // ホテルクリック

      await page.click(
        `text=${hotel}`
      );



      await page.waitForTimeout(
        5000
      );



      for (
        let month = 0;
        month < 3;
        month++
      ) {



        console.log(
          "月チェック:",
          month + 1
        );



        const calendar =
          page.locator(
            '[id^="tcb"]:visible'
          );



        const html =
          await calendar
            .first()
            .innerHTML();



        const cells =
          html.match(
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



            if(date && status){


              console.log(
                date[1],
                status[1]
              );



              if(
                status[1]=="○" ||
                status[1]=="△"
              ){

                allEmpty.push({

                  hotel,
                  date:date[1],
                  status:status[1]

                });

              }


            }


          });


        }



        if(month < 2){


          await page.locator(
            'input.next-month:visible'
          )
          .first()
          .click();



          await page.waitForTimeout(
            3000
          );


        }



      }



    }



    console.log("================");


    if(allEmpty.length){


      console.log(
        "★★ 空き発見 ★★"
      );


      allEmpty.forEach(x=>{

        console.log(
          x.hotel,
          x.date,
          x.status
        );

      });


    }else{


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
