const url =
  "REMOVED_ITS_KENPO_URL";

(async () => {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/138.0 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest",
      "Referer": "REMOVED_ITS_KENPO_URL"
    }
  });

  console.log("status =", res.status);

  const text = await res.text();

  console.log(text.substring(0, 1000));
})();
