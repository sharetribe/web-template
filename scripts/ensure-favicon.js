/* scripts/ensure-favicon.js */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function sha256(p) {
  const b = fs.readFileSync(p);
  return crypto.createHash('sha256').update(b).digest('hex');
}

const pubFav = path.join(__dirname, '..', 'public', 'favicon.ico');
const buildFav = path.join(__dirname, '..', 'build', 'favicon.ico');

if (!fs.existsSync(pubFav)) {
  console.error('[FaviconGuard] public/favicon.ico is missing (brand icon required).');
  process.exit(1);
}

const brandHash = sha256(pubFav);

// If build favicon missing or different, copy brand over
if (!fs.existsSync(buildFav)) {
  console.warn('[FaviconGuard] build/favicon.ico missing → copying brand icon.');
  fs.copyFileSync(pubFav, buildFav);
} else {
  const buildHash = sha256(buildFav);
  if (buildHash !== brandHash) {
    console.warn('[FaviconGuard] build/favicon.ico does not match brand → replacing.');
    fs.copyFileSync(pubFav, buildFav);
  }
}

// Re-check to ensure success
const finalHash = sha256(buildFav);
if (finalHash !== brandHash) {
  console.error('[FaviconGuard] Could not enforce brand favicon in build/.');
  process.exit(1);
}
console.log('[FaviconGuard] OK brand favicon pinned in build/.');
