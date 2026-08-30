/**
 * Smoke: 타이틀 → 새 게임 → SELECT 타이머 표시
 *
 * 사전 조건: 프로토타입 서버가 떠 있어야 함
 *   cd prototype && python serve.py --port 8080
 *
 * 실행:
 *   npx --yes playwright@1.49.0 install chromium   # 최초 1회
 *   node tests/smoke-menu.mjs
 *
 * 환경변수 BASE_URL (기본 http://127.0.0.1:8080/)
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:8080/';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));

try {
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });

  await page.evaluate(() => localStorage.removeItem('orchestration-save'));
  await page.reload({ waitUntil: 'networkidle' });

  await page.click('#btn-new-game');
  await page.waitForSelector('#game-root:not([hidden])', { timeout: 5000 });
  await page.waitForSelector('#adjust-timer:not([hidden])', { timeout: 5000 });

  const result = {
    ok: true,
    errors,
    overlayHidden: await page.locator('#overlay').isHidden(),
    gameVisible: await page.locator('#game-root').isVisible(),
    timerVisible: await page.locator('#adjust-timer').isVisible(),
    playerText: (await page.locator('#player-display').textContent())?.trim(),
  };

  const failed =
    errors.length > 0 ||
    !result.overlayHidden ||
    !result.gameVisible ||
    !result.timerVisible;

  console.log(JSON.stringify(result, null, 2));
  if (failed) {
    process.exitCode = 1;
  }
} catch (err) {
  console.error(String(err));
  if (errors.length) console.error('pageerrors:', errors);
  process.exitCode = 1;
} finally {
  await browser.close();
}
