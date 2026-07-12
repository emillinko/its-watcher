const https = require("https");

const url =
  "REMOVED_ITS_KENPO_URL";

https.get(url, (res) => {
  console.log("Status:", res.statusCode);
  console.log("Content-Type:", res.headers["content-type"]);
  console.log("Location:", res.headers["location"]);

  let body = "";

  res.on("data", chunk => body += chunk);

  res.on("end", () => {
    console.log("Length:", body.length);
    console.log(body);
  });
});
