import pLimit from "p-limit";
import { Browser } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

const processPage = async ({
  browser,
  url,
}: {
  browser: Browser;
  url: string;
}) => {
  const page = await browser.newPage();
  try {
    await page.goto(url);
    return await page.content();
  } finally {
    await page.close();
  }
};

const getPagesHTML = async (pages: Array<{ id: string; url: string }>) => {
  const limit = pLimit(10);
  const browser = await puppeteer.use(StealthPlugin()).launch();

  const result: Record<string, Awaited<ReturnType<typeof processPage>>> = {};

  const promises: Array<Promise<any>> = [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    promises.push(
      limit(() =>
        processPage({ browser, url: page.url })
          .then((res) => {
            result[page.id] = res;
            console.log(`[processPage] done ${i} ${page.url}`);
          })
          .catch(async (err) => {
            console.log(`[processPage] error ${i} ${page.url} ${err}`);
            result[page.id] = err;
          })
      )
    );
  }

  await Promise.all(promises);

  console.log("[getPageSummaries] done");

  await browser.close();

  return result;
};

export default getPagesHTML;
