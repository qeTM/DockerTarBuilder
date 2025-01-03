const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

const OUTPUT_DIR = "./output";
const BASE_URL = "https://agree.maiytzy.com/category";

// 下载 M3U8 视频
const downloadM3U8 = (url, outputPath) => {
  console.log(`Downloading M3U8 video: ${url}`);
  return new Promise((resolve, reject) => {
    ffmpeg(url)
      .output(outputPath)
      .on("end", () => {
        console.log(`Downloaded: ${outputPath}`);
        resolve();
      })
      .on("error", (err) => {
        console.error(`Error downloading M3U8: ${err.message}`);
        reject(err);
      })
      .run();
  });
};

// 保存文件
const saveFile = async (url, content, type) => {
  const filename = path.join(
    OUTPUT_DIR,
    `${type}_${Date.now()}${path.extname(url) || ".txt"}`
  );
  if (type === "image" || type === "video") {
    if (url.endsWith(".m3u8")) {
      await downloadM3U8(url, filename.replace(".txt", ".mp4"));
    } else {
      axios({ url, responseType: "stream" })
        .then((response) => {
          response.data.pipe(fs.createWriteStream(filename));
          console.log(`Saved: ${filename}`);
        })
        .catch(console.error);
    }
  } else {
    fs.writeFileSync(filename, content, "utf8");
    console.log(`Saved: ${filename}`);
  }
};

// 获取页面内容
const getPageContent = async (url, title) => {
  console.log(url);

  // const browser = await puppeteer.launch();
  // const page = await browser.newPage();
  // await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  // const content = await page.content();
  // console.log(content);
  // await browser.close();
  // return content;
};

// 提取页面内容
const scrapePage = async (url, depth = 1) => {
  console.log(`Scraping: ${url}`);
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const content = await page.content();
    const $ = cheerio.load(content);
    const anchors = $(".xqbj-list-rows a");

    const results = [];
    anchors.each((index, element) => {
      const href = $(element).attr("href");
      const title = $(element).attr("title");

      const existingItem = results.find((item) => item.href === href);

      // 如果不存在，则推送新对象到 results 数组
      if (!existingItem && title) {
        // getPageContent(BASE_URL + href, title);
        // results.push({ href, title });
        results.push(href);
      }
    });

    getPageContent(BASE_URL + results[0], "");

    console.log("完成" + results.length, results[0]);

    await browser.close();
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
  }
};

// 开始爬取
(async () => {
  await scrapePage(BASE_URL + "/frftjj/5/", 2); // 深度为 2
})();
