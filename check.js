const fs = require("fs");

// HTML全部保存
fs.writeFileSync("page.html", text);

console.log("HTML length =", text.length);
