const url =
  "REMOVED_ITS_KENPO_URL";

(async () => {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0",
      "X-Requested-With": "XMLHttpRequest",
      "Referer": "REMOVED_ITS_KENPO_URL"
    }
  });

  console.log("status =", res.status);

  const text = await res.text();

  require("fs").writeFileSync("page.html", text);

  console.log("○ =", text.includes("○"));
  console.log("△ =", text.includes("△"));
  console.log("× =", text.includes("×"));

  console.log("富士屋 =", text.includes("フルーツパーク富士屋ホテル"));
  console.log("ラビスタ =", text.includes("ラビスタ富士河口湖"));
})();

console.log(text.substring(0, 3000));
