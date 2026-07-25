const text = await res.text();

console.log("status =", res.status);

// HTML全部保存
require("fs").writeFileSync("page.html", text);

// ○△×を探す
console.log("○ =", text.includes("○"));
console.log("△ =", text.includes("△"));
console.log("× =", text.includes("×"));

// ホテル名
console.log("富士屋 =", text.includes("フルーツパーク富士屋ホテル"));
console.log("ラビスタ =", text.includes("ラビスタ富士河口湖"));
