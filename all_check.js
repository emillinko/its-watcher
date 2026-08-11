const { chromium } = require("playwright");

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

  const url = process.env.ITS_KENPO_URL;

  // ITS健保の保養施設名
  const facilityNames = [
    "トスラブ箱根ビオーレ",
    "トスラブ箱根和奏林",
    "トスラブ館山ルアーナ",
    "草津温泉　ホテルヴィレッジ",
    "ホテルハーヴェスト那須",
    "ホテルハーヴェスト斑尾",
    "ブルーベリーヒル勝浦",
    "ホテルハーヴェスト伊東",
    "ホテル琵琶レイクオーツカ",
    "ホテル日航プリンセス京都",
    "ホテルハーヴェスト南紀田辺",
    "ホテルハーヴェスト旧軽井沢",
    "ホテルハーヴェスト京都鷹峯",
    "日光千姫物語",
    "ホテルハーヴェスト有馬六彩",
    "伊香保温泉 ホテル天坊",
    "和倉温泉 あえの風",
    "ラビスタ富士河口湖",
    "リソルの森",
    "ホテルハーヴェスト浜名湖",
    "鳴子温泉　湯元　吉祥",
    "ホテルオークラ東京ベイ",
    "熱海後楽園ホテル",
    "ラビスタ横須賀観音崎テラス",
    "ゆふいん山水館",
    "ラビスタ熱海テラス",
    "ホテルハーヴェスト鬼怒川",
    "鎌倉パークホテル",
    "蓼科東急ホテル",
    "NASPAニューオータニ",
    "定山渓 ゆらく草庵",
    "NAGU 勝浦",
    "プレジャーリゾート伊豆赤沢温泉　赤沢温泉ホテル",
    "軽井沢マリオットホテル",
    "高山グリーンホテル",
    "アオアヲナルトリゾート",
    "ホテル日航アリビラ",
    "グランドメルキュール伊勢志摩",
    "スパリゾートハワイアンズモノリスタワー",
    "フルーツパーク富士屋ホテル"
  ];

  try {

    console.log("================");
    console.log("全施設チェック準備");
    console.log("================");

    if (!url) {
      throw new Error(
        "ITS_KENPO_URL が設定されていません"
      );
    }

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    console.log("現在URL:");
    console.log(page.url());

    console.log("================");
    console.log("ページタイトル:");
    console.log(await page.title());

    // ==========================================
    // すべてのリンクを調査
    // ==========================================

    const links = page.locator("a");
    const count = await links.count();

    console.log("================");
    console.log("ページ内リンク数:", count);

    const facilities = [];

    for (let i = 0; i < count; i++) {

      const link = links.nth(i);

      const text = (
        await link.innerText().catch(() => "")
      ).trim();

      const href =
        await link.getAttribute("href");

      if (!text || !href) {
        continue;
      }

      // 施設名と一致するか確認
      const matchedFacility =
        facilityNames.find(
          name => text.includes(name)
        );

      if (!matchedFacility) {
        continue;
      }

      const facilityUrl =
        new URL(
          href,
          page.url()
        ).href;

      // 重複を防止
      if (
        facilities.some(
          item => item.name === matchedFacility
        )
      ) {
        continue;
      }

      facilities.push({
        name: matchedFacility,
        url: facilityUrl
      });

      console.log("================");
      console.log("施設:", matchedFacility);
      console.log("URL:", facilityUrl);
    }

    // ==========================================
    // 結果
    // ==========================================

    console.log("================");
    console.log(
      "取得した施設数:",
      facilities.length
    );

    console.log("================");

    if (facilities.length === 0) {

      console.log(
        "施設リンクが取得できませんでした"
      );

      console.log("================");
      console.log(
        "ページ本文の施設名を確認します"
      );

      const bodyText =
        await page.locator("body").innerText();

      for (const name of facilityNames) {

        if (bodyText.includes(name)) {
          console.log(
            "施設名あり:",
            name
          );
        }
      }

    } else {

      console.log(
        "施設リンク調査成功！"
      );

      for (const facility of facilities) {

        console.log(
          facility.name,
          "=>",
          facility.url
        );
      }
    }

    console.log("================");
    console.log(
      "全施設リンク取得完了"
    );

  } catch (error) {

    console.error("================");
    console.error(
      "★★ エラー発生 ★★"
    );

    console.error(
      error.message
    );

    process.exitCode = 1;

  } finally {

    await browser.close();
  }

})();
