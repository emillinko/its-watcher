for (const facility of facilities) {
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  const link = page
    .getByText(facility, { exact: true })
    .first();

  if (!await link.isVisible().catch(() => false)) {
    continue;
  }

  await link.click();
