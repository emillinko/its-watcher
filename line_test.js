const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const userId = process.env.LINE_USER_ID;

if (!token || !userId) {
  console.error("LINEのSecretが設定されていません");
  process.exit(1);
}

const response = await fetch(
  "https://api.line.me/v2/bot/message/push",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({
      to: userId,
      messages: [
        {
          type: "text",
          text: "🔔 ITS健保 空き通知\n\nLINE通知テスト成功！🎉"
        }
      ]
    })
  }
);

if (response.ok) {
  console.log("LINE通知成功！");
} else {
  console.log("LINE通知失敗:", response.status);
  console.log(await response.text());
  process.exit(1);
}
