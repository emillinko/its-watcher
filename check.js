const fs = require("fs");

const url =
  "REMOVED_ITS_KENPO_URL";

(async () => {
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

  fs.writeFileSync("page.html", text);

  console.log(text.substring(0, 1000));
})();
