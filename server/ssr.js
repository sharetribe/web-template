const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  const nonce = res.locals.cspNonce || '';
  const buildDir = path.join(__dirname, '..', 'build');
  let html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf8');

  // discover app bundles
  const jsDir = path.join(buildDir, 'static', 'js');
  const scripts = fs.readdirSync(jsDir)
    .filter(f => f.endsWith('.js') && !f.endsWith('.map'))
    .map(f => `<script src="/static/js/${f}" defer nonce="${nonce}"></script>`)
    .join('');

  // inline bootstrap (replace with your config/state as needed)
  const preloaded = `<script nonce="${nonce}">window.__APP_CONFIG__ = {};</script>`;

  html = html
    .replace('<!--!preloadedStateScript-->', preloaded)
    .replace('<!--!ssrScripts-->', scripts);

  global.__lastRenderedHtml = html; // for debug endpoint
  return html;
};