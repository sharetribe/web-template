/* scripts/check-built-index.js */
const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '..', 'build', 'index.html');
if (!fs.existsSync(p)) {
  console.error('[BuildCheck] build/index.html missing — did web build run?');
  process.exit(1);
}
const html = fs.readFileSync(p, 'utf8');
if (/%PUBLIC_URL%/.test(html)) {
  console.error('[BuildCheck] %PUBLIC_URL% still present in build/index.html — wrong file served or bad build.');
  process.exit(1);
}
console.log('[BuildCheck] OK build/index.html is compiled.');
