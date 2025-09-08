// scripts/ensure-favicon.js
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PUB = path.join(ROOT, 'public');
const IDX = path.join(PUB, 'index.html');
const MAN = path.join(PUB, 'site.webmanifest');

// Read ICONS_VERSION from environment
const ICONS_VERSION = process.env.ICONS_VERSION || 'sherbrt1';

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
const expectedFaviconHref = `/favicon.ico?v=${ICONS_VERSION}`;
if (iconLinks.length !== 1 || !html.includes(`href="${expectedFaviconHref}"`)) {
  console.error(`[FaviconGuard] index.html must have exactly one <link rel="icon" href="${expectedFaviconHref}">`);
  console.error(`[FaviconGuard] Found ${iconLinks.length} icon links:`, iconLinks);
  process.exit(1);
}

if (!fs.existsSync(MAN)) {
  console.error('[FaviconGuard] site.webmanifest missing');
  process.exit(1);
}
const man = JSON.parse(fs.readFileSync(MAN, 'utf8'));
const ok = (man.icons || []).every(ic =>
  ic.src.includes(`/android-chrome-192x192.png?v=${ICONS_VERSION}`) ||
  ic.src.includes(`/android-chrome-512x512.png?v=${ICONS_VERSION}`) ||
  ic.src.includes(`/apple-touch-icon.png?v=${ICONS_VERSION}`)
);
if (!ok) {
  console.error(`[FaviconGuard] site.webmanifest icons must point to versioned brand assets with ?v=${ICONS_VERSION}`);
  console.error('[FaviconGuard] Expected version:', ICONS_VERSION);
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

console.log(`[FaviconGuard] OK (ICONS_VERSION: ${ICONS_VERSION})`);