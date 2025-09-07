// server/utils/assets.js
const fs = require('fs');
const path = require('path');
const BUILD = path.join(process.cwd(), 'build');

function safe(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }

function getClientScripts() {
  const m = safe(path.join(BUILD, 'asset-manifest.json'));
  if (!m) return { js: [], css: [], error: 'manifest-missing' };
  const entry = m.entrypoints || [];
  return { js: entry.filter(f => f.endsWith('.js')), css: entry.filter(f => f.endsWith('.css')), error: null };
}

function logAssets() {
  const { js, css, error } = getClientScripts();
  if (error) {
    console.warn('[Assets]', error);
  } else {
    console.log('[Assets] Found', js.length, 'JS files,', css.length, 'CSS files');
  }
}

module.exports = { getClientScripts, logAssets, BUILD_DIR: BUILD };