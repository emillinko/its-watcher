const html = await page.content();

console.log(html.substring(0, 1000));
