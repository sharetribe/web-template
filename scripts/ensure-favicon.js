// scripts/ensure-favicon.js
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PUB = path.join(ROOT, 'public');
const IDX = path.join(PUB, 'index.html');
const MAN = path.join(PUB, 'site.webmanifest');

const required = [
  'favicon.ico',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
];

for (const f of required) {
  if (!fs.existsSync(path.join(PUB, f))) {
    console.error('[FaviconGuard] Missing /public/' + f);
    process.exit(1);
  }
}

const html = fs.readFileSync(IDX, 'utf8');
const iconLinks = (html.match(/<link\s+[^>]*rel=["']icon["'][^>]*>/gi) || []);
if (iconLinks.length !== 1 || !/href=["']\/favicon\.ico\?v=sherbrt1["']/.test(html)) {
  console.error('[FaviconGuard] index.html must have exactly one <link rel="icon" href="/favicon.ico?v=sherbrt1">');
  process.exit(1);
}

if (!fs.existsSync(MAN)) {
  console.error('[FaviconGuard] site.webmanifest missing');
  process.exit(1);
}
const man = JSON.parse(fs.readFileSync(MAN, 'utf8'));
const ok = (man.icons || []).every(ic =>
  ic.src.includes('/android-chrome-192x192.png?v=sherbrt1') ||
  ic.src.includes('/android-chrome-512x512.png?v=sherbrt1') ||
  ic.src.includes('/apple-touch-icon.png?v=sherbrt1')
);
if (!ok) {
  console.error('[FaviconGuard] site.webmanifest icons must point to versioned brand assets with ?v=sherbrt1');
  process.exit(1);
}

// Remove any banned template paths if they slipped in
const banned = [
  path.join(PUB, 'static/icons/favicon.ico'),
  path.join(PUB, 'favicon.png')
];
for (const b of banned) {
  if (fs.existsSync(b)) {
    console.warn('[FaviconGuard] Removing banned template icon:', b);
    fs.rmSync(b, { force: true, recursive: true });
  }
}

console.log('[FaviconGuard] OK');