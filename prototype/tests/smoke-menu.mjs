import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(err.message));

await page.goto('http://localhost:8765/');
await page.click('#btn-new-game');
await page.waitForTimeout(300);

const result = {
  errors,
  menuHidden: await page.locator('#menu-screen').isHidden(),
  overlayHidden: await page.locator('#overlay').isHidden(),
  gameVisible: await page.locator('#game-root').isVisible(),
  playerText: await page.locator('#player-display').textContent(),
};

console.log(JSON.stringify(result, null, 2));
await browser.close();
