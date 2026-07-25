const fs = require("fs");

const url =
  "REMOVED_ITS_KENPO_URL";

(async () => {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "REMOVED_ITS_KENPO_URL"
      }
    });

    console.log("status =", res.status);

    const text = await res.text();

    console.log("HTML length =", text.length);

    // HTMLを保存
    fs.writeFileSync("page.html", text);

    console.log("page.html saved");

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
