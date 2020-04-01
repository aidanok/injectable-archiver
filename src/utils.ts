
import puppeteer from 'puppeteer-core';

export async function getBrowser() {

  const browser = await puppeteer.connect({
    browserWSEndpoint:
    'ws://localhost:3003' +
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

export async function getPage(): Promise<puppeteer.Page> {
  const browser = await getBrowser();
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();
  page.setViewport({ width: 1200, height: 1050 });
  //await page.setBypassCSP(true);
  return page;
}

export async function navigatePageSimple(page: puppeteer.Page, url: string, { waitFor = 4000 }) {
  const response = await page.goto(url, {
    timeout: 40000,
    waitUntil: 'domcontentloaded',
  });
  if (response && response.status() < 400) {
    await page.waitFor(waitFor);
    return response;
  }
  return response;
}