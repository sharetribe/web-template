const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  const nonce = res.locals.cspNonce || '';
  const iconsVersion = process.env.ICONS_VERSION || 'sherbrt2';
  const buildDir = path.join(__dirname, '..', 'build');
  let html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf8');

  // Load asset manifest
  const manifestPath = path.join(buildDir, 'asset-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Extract CSS and JS files from manifest
  const cssFiles = [];
  const jsFiles = [];
  
  Object.entries(manifest.files).forEach(([key, value]) => {
    if (value.endsWith('.css') && !value.endsWith('.map')) {
      cssFiles.push(value);
    } else if (value.endsWith('.js') && !value.endsWith('.map')) {
      jsFiles.push(value);
    }
  });

  // Check for @loadable/server stats
  const loadableStatsPath = path.join(buildDir, 'loadable-stats.json');
  let loadableExtractor = null;
  
  if (fs.existsSync(loadableStatsPath)) {
    try {
      const { ChunkExtractor } = require('@loadable/server');
      loadableExtractor = new ChunkExtractor({ statsFile: loadableStatsPath });
    } catch (e) {
      console.warn('[SSR] @loadable/server not available, using manifest only');
    }
  }

  // Build CSS links
  let cssLinks = cssFiles.map(href => `<link rel="stylesheet" href="${href}">`).join('\n');
  
  // Build script tags with nonces
  let scriptTags = jsFiles.map(src => `<script defer nonce="${nonce}" src="${src}"></script>`).join('\n');

  // If loadable extractor is available, prefer its tags but add nonces
  if (loadableExtractor) {
    const loadableLinks = loadableExtractor.getLinkTags();
    const loadableScripts = loadableExtractor.getScriptTags();
    
    // Add nonces to loadable scripts
    const noncedLoadableScripts = loadableScripts.replace(/<script/g, `<script nonce="${nonce}"`);
    
    cssLinks = loadableLinks;
    scriptTags = noncedLoadableScripts;
  }

  // Inline bootstrap script with nonce
  const preloaded = `<script nonce="${nonce}">window.__APP_CONFIG__ = {};</script>`;

  // Replace placeholders
  html = html
    .replace('<!--!preloadedStateScript-->', preloaded)
    .replace('<!--!ssrScripts-->', scriptTags)
    .replace('<!--!ssrStyles-->', cssLinks)
    .replace('<!--!ssrLinks-->', cssLinks)
    .replace('<head>', `<head>\n<meta name="csp-nonce" content="${nonce}">`)
    // Replace icon versioning placeholders
    .replace(/href="\/favicon\.ico\?v=\$\{ICONS_VERSION\}"/g, `href="/favicon.ico?v=${iconsVersion}"`)
    .replace(/href="\/apple-touch-icon\.png\?v=\$\{ICONS_VERSION\}"/g, `href="/apple-touch-icon.png?v=${iconsVersion}"`)
    .replace(/href="\/site\.webmanifest\?v=\$\{ICONS_VERSION\}"/g, `href="/site.webmanifest?v=${iconsVersion}"`);

  // Verify no placeholders remain
  if (html.includes('<!--!ssrScripts-->') || html.includes('<!--!ssrLinks-->') || html.includes('<!--!ssrStyles-->')) {
    console.error('[SSR] ERROR: Placeholders still present in final HTML');
  }

  console.log(`[SSR] Injected ${cssFiles.length} CSS files, ${jsFiles.length} JS files`);
  console.log(`[SSR] Using ICONS_VERSION: ${iconsVersion}`);

  global.__lastRenderedHtml = html; // for debug endpoint
  return html;
};