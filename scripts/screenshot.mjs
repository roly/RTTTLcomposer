import { chromium } from 'playwright';
import { spawn } from 'child_process';

async function waitForServer(url, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (e) {
      // ignore errors
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('Server did not start in time');
}

async function run() {
  const server = spawn('npm', ['run', 'preview'], { stdio: 'inherit' });
  await waitForServer('http://localhost:4173');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4173');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({ path: 'screenshot.png', fullPage: true });
  await browser.close();
  server.kill('SIGINT');
}

run();
