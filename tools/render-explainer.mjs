#!/usr/bin/env node
// Renders explainer.html to an MP4 (or to still frames for review).
//
// The page exposes window.__explainer.seek(t) in ?render mode, so every frame is
// drawn from the timeline deterministically: no screen recording, no dropped frames.
//
// Needs: Node 18+, Playwright (npm i -D playwright, or a global install found via
// NODE_PATH) and ffmpeg on PATH.
//
//   node tools/render-explainer.mjs                      # full video -> explainer.mp4
//   node tools/render-explainer.mjs --fps 30 --workers 4 --out out.mp4
//   node tools/render-explainer.mjs --shots 3,40,95.5    # PNG stills into ./shots
//
// Offline machines: set LOCAL_MODULES to a node_modules folder that contains three@0.160.0,
// @fontsource/atkinson-hyperlegible-next, @fontsource/atkinson-hyperlegible-mono and
// @fontsource-variable/bricolage-grotesque; CDN and Google Fonts requests are then served locally.

import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return acc;
}, []));
const FPS = Number(args.fps || 30);
const WIDTH = Number(args.width || 1920);
const HEIGHT = Number(args.height || 1080);
const OUT = path.resolve(args.out || path.join(ROOT, 'explainer.mp4'));
const WORKERS = Math.max(1, Number(args.workers || Math.min(4, os.cpus().length)));
const CRF = String(args.crf || 20);

// ---------- tiny static server for the repo ----------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const URL_ = `http://127.0.0.1:${server.address().port}/explainer.html?render`;

// ---------- optional offline asset routing ----------
async function routeLocal(page) {
  const mods = process.env.LOCAL_MODULES;
  if (!mods) return;
  const f = (...p) => path.join(mods, ...p);
  const fonts = {
    'Atkinson Hyperlegible Next': [[400, f('@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-400-normal.woff2')], [600, f('@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-600-normal.woff2')], [700, f('@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-700-normal.woff2')]],
    'Atkinson Hyperlegible Mono': [[500, f('@fontsource/atkinson-hyperlegible-mono/files/atkinson-hyperlegible-mono-latin-500-normal.woff2')]],
    'Bricolage Grotesque': [['600 800', f('@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2')]],
  };
  let css = '';
  for (const [fam, faces] of Object.entries(fonts)) for (const [w, file] of faces) css += `@font-face{font-family:"${fam}";font-weight:${w};font-style:normal;src:url(https://fonts.gstatic.com/local/${encodeURIComponent(file)}) format("woff2");}\n`;
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: css }));
  await page.route('https://fonts.gstatic.com/local/**', r => r.fulfill({ contentType: 'font/woff2', body: fs.readFileSync(decodeURIComponent(new URL(r.request().url()).pathname.replace('/local/', ''))) }));
  await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/build/**', r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(f('three/build', path.basename(new URL(r.request().url()).pathname))) }));
}

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync'] });
async function openPage() {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('[page error]', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
  await routeLocal(page);
  await page.goto(URL_);
  await page.waitForFunction(() => window.__explainerReady === true, null, { timeout: 60000 });
  return page;
}

try {
  if (args.shots) {
    const dir = path.resolve(args.dir || path.join(ROOT, 'shots'));
    fs.mkdirSync(dir, { recursive: true });
    const page = await openPage();
    const times = String(args.shots).split(',').map(Number);
    for (const tt of times) {
      await page.evaluate(x => window.__explainer.seek(x), tt);
      const file = path.join(dir, `t${tt.toFixed(2).padStart(7, '0')}.png`);
      await page.screenshot({ path: file });
      console.log(file);
    }
  } else {
    const probe = await openPage();
    const duration = await probe.evaluate(() => window.__explainer.duration);
    await probe.close();
    const total = Math.ceil(duration * FPS);
    console.log(`Rendering ${total} frames (${duration.toFixed(1)} s at ${FPS} fps, ${WIDTH}x${HEIGHT}) with ${WORKERS} workers`);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'explainer-'));
    const per = Math.ceil(total / WORKERS);
    let done = 0;
    const started = Date.now();
    const parts = await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
      const from = w * per, to = Math.min(total, from + per);
      const file = path.join(tmp, `part${w}.mp4`);
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', CRF, '-pix_fmt', 'yuv420p', '-r', String(FPS), file], { stdio: ['pipe', 'inherit', 'inherit'] });
      const page = await openPage();
      for (let i = from; i < to; i++) {
        await page.evaluate(x => window.__explainer.seek(x), i / FPS);
        const buf = await page.screenshot({ type: 'jpeg', quality: 94 });
        if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
        done++;
        if (done % (FPS * 5) === 0) {
          const rate = done / ((Date.now() - started) / 1000);
          process.stdout.write(`  ${done}/${total} frames, ${rate.toFixed(1)} fps, ~${Math.round((total - done) / rate)} s left\n`);
        }
      }
      ff.stdin.end();
      await new Promise((res, rej) => ff.on('close', code => code === 0 ? res() : rej(new Error('ffmpeg exited ' + code))));
      await page.close();
      return file;
    }));
    const list = path.join(tmp, 'list.txt');
    fs.writeFileSync(list, parts.map(p => `file '${p}'`).join('\n'));
    // silent stereo track so players and messaging apps treat it as a normal video
    await new Promise((res, rej) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list,
      '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000', '-shortest',
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', OUT], { stdio: 'inherit' })
      .on('close', code => code === 0 ? res() : rej(new Error('ffmpeg concat exited ' + code))));
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(`Wrote ${OUT}`);
  }
} finally {
  await browser.close();
  server.close();
}
