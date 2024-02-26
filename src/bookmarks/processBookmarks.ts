import pLimit from "p-limit";
import puppeteer, { Browser } from "puppeteer";

const createPage = async (browser: Browser) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });
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

  const tags = await page.$$eval("meta", (elements) => {
    const properties: Array<[string, string] | undefined> = elements.map(
      (e) => {
        const name = e.getAttribute("property") || e.getAttribute("name") || "";
        const cleanName = name.replace("og:", "");
        const content = e.getAttribute("content") || e.innerText;
        if (["title", "description"].includes(cleanName) && content) {
          return [name, content] as const;
        }
      }
    );
    const cleanProps = properties.filter(Boolean) as Array<[string, string]>;
    return Object.fromEntries(cleanProps);
  });

  if (!tags.title) {
    tags.title = await page.$eval("title", (e) => e.innerText);
  }

  console.log(`[${url}]`, tags);

  await page.close();

  return tags;
};

const getPageSummaries = async (pages: Array<{ id: string; url: string }>) => {
  const limit = pLimit(10);
  const browser = await puppeteer.launch();

  const result: Record<string, Awaited<ReturnType<typeof processPage>>> = {};

  const promises: Array<Promise<any>> = [];
  for (const page of pages) {
    promises.push(
      limit(() =>
        processPage({ browser, url: page.url })
          .then((res) => (result[page.id] = res))
          .catch((err) => (result[page.id] = err))
      )
    );
  }

  await Promise.all(promises);

  console.log("[getPageSummaries] done");

  await browser.close();

  return result;
};

export default getPageSummaries;
