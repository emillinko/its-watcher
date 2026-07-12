const https = require("https");

const url =
  "REMOVED_ITS_KENPO_URL";

https.get(url, (res) => {
  let body = "";

  res.on("data", chunk => body += chunk);

  res.on("end", () => {
    console.log(body.substring(0, 1000));
  });
});
