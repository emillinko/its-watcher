const { chromium } = require("playwright");
console.log("PAULスクリプト開始");

async function sendDiscord(slots) {
  const privateWebhook =
    process.env.DISCORD_WEBHOOK_URL_PRIVATE;

  if (!privateWebhook) {
    throw new Error(
      "DISCORD_WEBHOOK_URL_PRIVATE が設定されていません"
    );
  }

  const reservationUrl =
    "https://www.tablecheck.com/ja/shops/paul-yotsuya/reserve";

  const lines = [
    "🟢 **PAUL四谷 モーニングビュッフェに新しい空席！**",
    "大人2名",
    ""
  ];

  for (const slot of slots) {
    lines.push("・" + formatSlot(slot));
  }

  lines.push("");
  lines.push("🔗 **[予約ページを開く](" + reservationUrl + ")**");
  lines.push(reservationUrl);

  const response = await fetch(privateWebhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content: lines.join("\n")
    })
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      "Discord通知エラー: HTTP " +
      response.status +
      " " +
      body
    );
  }

  console.log("Discord通知成功！");
}
