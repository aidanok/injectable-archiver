
import puppeteer from 'puppeteer-core'
import { addExtra } from 'puppeteer-extra'
import  Stealth from 'puppeteer-extra-plugin-stealth'
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker'

/**
 * 
 */
export async function getPage(): Promise<puppeteer.Page> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  page.setViewport({ width: 800, height: 1080 });
  page.on("error", function (err) {
    err.message  = `[BROWSER] ${err.message}`
    console.error(err); 
  })
  return page;
}

export async function getBrowser() {

  const ePup = addExtra(puppeteer);
  
  ePup.use(Stealth());
  ePup.use(AdblockerPlugin());

  const browser = await ePup.connect({
    browserWSEndpoint:
    'ws://localhost:3000' +
    '?--window-size=1920x1080' +
    // `&--proxy-server=http://${proxy}` +
    '&--no-sandbox=true' +
    '&--disable-setuid-sandbox=true' +
    '&--disable-dev-shm-usage=true' +
    '&--disable-accelerated-2d-canvas=true' +
    '&--disable-gpu=true' +
    '&--headless=false'
  });

  return browser;
}

// Wii user-agent gives awesome twitter output :) 
// Some scraping bots (GoogleBot or Yahoo Slurp) give 
// different type twitter output ( the modal style )
export const userAgents = {
  'wii': 'Opera/9.30 (Nintendo Wii; U; ; 2071; Wii Shop Channel/1.0; en)'
}

export async function navigatePageSimple(page: puppeteer.Page, url: string, { waitFor = 4000 }) {
  const response = await page.goto(url, {
    timeout: 40000,
    waitUntil: 'networkidle2',
  });
  if (response && response.status() < 400) {
    await page.waitFor(waitFor);
    return response;
  }
  return response;
}