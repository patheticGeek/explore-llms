import pLimit from "p-limit";
import puppeteer, { Browser } from "puppeteer";
import { turndownService } from "./turndownService";

const createPage = async (browser: Browser) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
  );
  return page;
};

const processPage = async ({
  browser,
  url,
}: {
  browser: Browser;
  url: string;
}) => {
  const page = await createPage(browser);
  await page.goto(url);

  const html = await page.$eval("body", (e) => e.outerHTML);
  const markdown = turndownService.turndown(html);

  //   const directive = `
  // You are a bot who should summarize websites using their content provided to you in markdown format.
  // In the summary you should describe what the website can be used for in under 200 words.
  // There should be no html tags in the summary.
  // You should not describe what the website is made up of.
  // The summary should be like paragraphs for humans to read.
  //   `.trim();
  //   const messages = `Following is a website's content who's url is ${url}\n\n${markdown}`;

  //   const tokens = await model.getNumTokens(`${directive}\n\n${messages}`);

  await page.close();

  return markdown;
};

const getPageSummaries = async (pages: Array<{ id: string; url: string }>) => {
  const limit = pLimit(10);
  const browser = await puppeteer.launch();

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

export default getPageSummaries;
