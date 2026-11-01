const { chromium } = require("playwright");

const BASE_URL =
  "https://www.tablecheck.com/ja/shops/paul-yotsuya/reserve";

const PAX = 2;

// 今日から約3か月先まで調査
const DAYS_TO_CHECK = 100;

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage({
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo"
  });

  console.log("====================================");
  console.log("PAUL 四谷 TableCheck 空席チェック");
  console.log(`人数: ${PAX}名`);
  console.log("====================================");

  const today = new Date();

  // 土日だけ調査
  for (let i = 0; i < DAYS_TO_CHECK; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const day = date.getDay();

    // 土曜=6、日曜=0
    if (day !== 0 && day !== 6) {
      continue;
    }

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    const dateString = `${yyyy}-${mm}-${dd}`;

    const url =
      `${BASE_URL}?num_people=${PAX}` +
      `&start_date=${dateString}`;

    console.log("");
    console.log("------------------------------------");
    console.log(`▶ ${dateString}`);
    console.log(url);

    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });

      // TableCheckの動的処理を待つ
      await page.waitForTimeout(3000);

      const title = await page.title();

      console.log(`Title: ${title}`);

      const bodyText = await page.locator("body").innerText();

      // 8:00 / 8:30周辺の情報を探す
      const lines = bodyText
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean);

      const relevant = lines.filter(line =>
        /8[:：]00|8[:：]30|空席|満席|予約|選択する|available|full/i.test(line)
      );

      if (relevant.length > 0) {
        console.log("▼ 関連表示");

        // 最大50行まで
        for (const line of relevant.slice(0, 50)) {
          console.log(line);
        }
      } else {
        console.log("⚠️ 8:00/8:30や空席情報をテキストから検出できませんでした。");
      }

      // ボタン情報
      const buttons = await page.locator("button").evaluateAll(btns =>
        btns.map(btn => ({
          text: (btn.innerText || "").trim(),
          disabled: btn.disabled,
          ariaLabel: btn.getAttribute("aria-label"),
          className: btn.className
        }))
      );

      const usefulButtons = buttons.filter(b =>
        b.text ||
        b.ariaLabel
      );

      if (usefulButtons.length > 0) {
        console.log("▼ ボタン情報");

        for (const button of usefulButtons.slice(0, 50)) {
          console.log(
            JSON.stringify(button, null, 2)
          );
        }
      }

      // 8:00 / 8:30を含むHTML要素を確認
      const htmlMatches = await page.locator(
        "text=/8[:：]00|8[:：]30/"
      ).count();

      console.log(
        `8:00/8:30を含む要素数: ${htmlMatches}`
      );

      // デバッグ用スクリーンショット
      await page.screenshot({
        path: `paul-${dateString}.png`,
        fullPage: true
      });

    } catch (error) {
      console.log(`❌ エラー: ${error.message}`);
    }
  }

  await browser.close();

  console.log("");
  console.log("====================================");
  console.log("チェック終了");
  console.log("====================================");
})();
