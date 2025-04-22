import pLimit from "p-limit";
import { Browser } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

const getPageContent = async ({
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

const getPagesContent = async (pages: Array<{ id: string; url: string }>) => {
  const limit = pLimit(10);
  const browser = await puppeteer.use(StealthPlugin()).launch();

  const result: Record<string, Awaited<ReturnType<typeof getPageContent>>> = {};

  const promises: Array<Promise<any>> = [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    promises.push(
      limit(() =>
        getPageContent({ browser, url: page.url })
          .then((res) => {
            result[page.id] = res;
            console.log(`[getPageContent] done ${i} ${page.url}`);
          })
          .catch(async (err) => {
            console.log(`[getPageContent] error ${i} ${page.url} ${err}`);
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

export default getPagesContent;
