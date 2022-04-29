import { InfluxDB, IPoint } from "influx";
import puppeteer from "puppeteer";
import { Browser, Page } from "puppeteer";

export interface Data {
  token: string;
  deposit_apy: number;
  borrow_apy: number;
}

export type RawData = [string, string, string];

export const NEGATIVE_PREFIX = "Pay";

const INFLUX_HOST = process.env.INFLUX_HOST || "localhost";
const INFLUX_DB = "proton_db";
const INFLUX_MEASUREMENT = "apy";

export const init_browser = async (): Promise<Browser> => {
  console.log("Launching...");
  const browser: Browser = await puppeteer.launch({
    headless: true,
    args: [
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-sandbox",
    ],
  });

  return browser;
};

export const init_page = async (browser: Browser): Promise<Page> => {
  console.log("Navigating...");
  const page: Page = await browser.newPage();
  await page.goto("https://protonloan.com/markets", {
    waitUntil: "networkidle0",
  });

  return page;
};

export const init_db = (): InfluxDB => {
  const influx = new InfluxDB({
    host: INFLUX_HOST,
    database: INFLUX_DB,
  });

  influx.getDatabaseNames().then((names) => {
    if (!names.includes(INFLUX_DB)) {
      console.log("Creating DB...");
      return influx.createDatabase(INFLUX_DB);
    }
  });

  return influx;
};

export const scrape_page = async (page: Page): Promise<RawData[]> => {
  console.log("Scraping...");
  return await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll("#table > div > .grid")
    ).map<RawData>((row) => {
      const token = row.children[0].querySelector("span")!.innerText;
      console.log(`Token: ${token}`);

      const deposit_apy = (
        row.children[1].querySelector("div:last-child") as HTMLDivElement
      ).innerText;

      const borrow_apy = (
        row.children[2].querySelector("div:last-child") as HTMLDivElement
      ).innerText;

      return [token, deposit_apy, borrow_apy];
    });
  });
};

export const process_data = (raw_data_list: RawData[]): Data[] => {
  console.log("Processing...");
  return raw_data_list.map<Data>((raw_data) => {
    console.log(raw_data);
    const token = raw_data[0];
    const deposit_apy = apy_string_to_number(raw_data[1]);
    const borrow_apy = apy_string_to_number(raw_data[2]);

    return { token, deposit_apy, borrow_apy };
  });
};

export const apy_string_to_number = (text: string): number => {
  const re = new RegExp(/: (.*?)%/);
  const r = text.match(re);

  let num = Number(r![1]);

  if (text.startsWith(NEGATIVE_PREFIX)) {
    num *= -1;
  }

  return num;
};

export const write_data = (influx: InfluxDB, data_list: Data[]) => {
  const influx_data = data_list.map<IPoint>((data) => {
    return {
      measurement: INFLUX_MEASUREMENT,
      tags: {
        token: data.token,
      },
      fields: {
        borrow_apy: data.borrow_apy,
        deposit_apy: data.deposit_apy,
      },
    };
  });

  influx.writePoints(influx_data);
};

export const main = async () => {
  const browser: Browser = await init_browser();

  try {
    const influx = init_db();
    const page = await init_page(browser);
    const raw_data_list = await scrape_page(page);
    const data_list = process_data(raw_data_list);
    write_data(influx, data_list);
  } finally {
    await browser.close();
  }
};
