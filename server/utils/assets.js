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

module.exports = { getClientScripts, BUILD };