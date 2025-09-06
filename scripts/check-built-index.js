// scripts/check-built-index.js
const fs = require('fs');
const path = require('path');
const BUILD = path.join(process.cwd(), 'build');
const idx = path.join(BUILD, 'index.html');

if (!fs.existsSync(idx)) {
  console.error('[BuildSanity] build/index.html missing');
  process.exit(1);
}
const html = fs.readFileSync(idx, 'utf8');

if (!/href=["']\/favicon\.ico\?v=sherbrt1["']/.test(html)) {
  console.error('[BuildSanity] Built index.html missing /favicon.ico?v=sherbrt1 link');
  process.exit(1);
}

if (!/<script[^>]+src=/.test(html)) {
  console.error('[BuildSanity] No <script src=...> in built index -> blank screen risk');
  process.exit(1);
}

console.log('[BuildSanity] OK');