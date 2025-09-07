#!/usr/bin/env node

/**
 * Build guard script to ensure brand icons are permanent and template icons don't reappear
 * This script runs after build to verify the correct favicon setup
 */

const fs = require('fs');
const path = require('path');

console.log('[FaviconGuard] Checking icon configuration...');

// Paths that should NOT exist (template icon directories)
const badPaths = [
  'public/static/icons',
  'public/icons',
  'build/static/icons',
  'build/icons',
];

// Required brand assets that MUST exist
const mustExist = [
  'public/favicon.ico',
  'public/android-chrome-192x192.png',
  'public/android-chrome-512x512.png',
  'public/apple-touch-icon.png',
  'public/site.webmanifest',
];

let foundBad = false;
let missingRequired = false;

// Check for template icon directories that should be removed
for (const p of badPaths) {
  if (fs.existsSync(p)) {
    console.error(`[FaviconGuard] ❌ Remove template icon folder: ${p}`);
    foundBad = true;
  }
}

// Check for required brand assets
for (const p of mustExist) {
  if (!fs.existsSync(p)) {
    console.error(`[FaviconGuard] ❌ Missing required brand asset: ${p}`);
    missingRequired = true;
  } else {
    console.log(`[FaviconGuard] ✅ Found brand asset: ${p}`);
  }
}

// Check that site.webmanifest has versioned URLs
const manifestPath = 'public/site.webmanifest';
if (fs.existsSync(manifestPath)) {
  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    if (!manifestContent.includes('?v=sherbrt1')) {
      console.error(`[FaviconGuard] ❌ site.webmanifest missing versioning (?v=sherbrt1)`);
      missingRequired = true;
    } else {
      console.log(`[FaviconGuard] ✅ site.webmanifest has proper versioning`);
    }
  } catch (e) {
    console.error(`[FaviconGuard] ❌ Error reading site.webmanifest: ${e.message}`);
    missingRequired = true;
  }
}

// Check that HTML template has versioned favicon links
const htmlPath = 'public/index.html';
if (fs.existsSync(htmlPath)) {
  try {
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const hasVersionedFavicon = htmlContent.includes('favicon.ico?v=sherbrt1');
    const hasVersionedAppleTouch = htmlContent.includes('apple-touch-icon.png?v=sherbrt1');
    const hasVersionedManifest = htmlContent.includes('site.webmanifest?v=sherbrt1');
    
    if (!hasVersionedFavicon) {
      console.error(`[FaviconGuard] ❌ HTML template missing versioned favicon link`);
      missingRequired = true;
    } else {
      console.log(`[FaviconGuard] ✅ HTML template has versioned favicon link`);
    }
    
    if (!hasVersionedAppleTouch) {
      console.error(`[FaviconGuard] ❌ HTML template missing versioned apple-touch-icon link`);
      missingRequired = true;
    } else {
      console.log(`[FaviconGuard] ✅ HTML template has versioned apple-touch-icon link`);
    }
    
    if (!hasVersionedManifest) {
      console.error(`[FaviconGuard] ❌ HTML template missing versioned manifest link`);
      missingRequired = true;
    } else {
      console.log(`[FaviconGuard] ✅ HTML template has versioned manifest link`);
    }
  } catch (e) {
    console.error(`[FaviconGuard] ❌ Error reading HTML template: ${e.message}`);
    missingRequired = true;
  }
}

if (foundBad || missingRequired) {
  console.error(`[FaviconGuard] ❌ Icon configuration issues found. Build should fail.`);
  process.exit(1);
} else {
  console.log(`[FaviconGuard] ✅ All icon checks passed!`);
  process.exit(0);
}
