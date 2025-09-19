# CSP Hardening Report

## Overview

This report documents the comprehensive hardening of the Content Security Policy (CSP) implementation, providing clean header mode switching, undefined value cleanup, proper nonce injection, and optional API exclusion.

## Changes Made

### 1. Fixed 'undefined' in Policy Arrays

**File**: `server/csp.js:67`

**Problem**: The `assetCdnBaseUrl` environment variable could be undefined, causing literal 'undefined' to appear in the CSP policy.

**Before**:
```javascript
connectSrc: [
  self,
  baseUrl,
  assetCdnBaseUrl,  // Could be undefined
  '*.st-api.com',
  // ...
],
```

**After**:
```javascript
connectSrc: [
  self,
  baseUrl,
  assetCdnBaseUrl,
  '*.st-api.com',
  // ...
].filter(Boolean),  // Remove falsy values including undefined
```

### 2. Single Source of Truth for Header Names

**File**: `server/csp.js:142-147`

**Enhancement**: Centralized header name logic with support for dual reporting.

**Added**:
```javascript
exports.csp = ({ mode = 'report', reportUri }) => {
  // Single source of truth for header names and behavior
  const cspMode = mode === 'block' ? 'block' : 'report';
  const dualReport = String(process.env.CSP_DUAL_REPORT || '').toLowerCase() === 'true';
  const enforceHeader = 'Content-Security-Policy';
  const reportHeader = 'Content-Security-Policy-Report-Only';
```

**Metadata Export**: Added debugging metadata to CSP policy object:
```javascript
return {
  enforce: helmet.contentSecurityPolicy(/*...*/),
  reportOnly: helmet.contentSecurityPolicy(/*...*/),
  // Metadata for debugging
  mode: cspMode,
  dualReport,
  enforceHeader,
  reportHeader,
};
```

### 3. Enhanced CSP Mode Switching

**File**: `server/index.js:159-185`

**Improvement**: Clean header mode switching with proper conditional logic.

**Before**: Basic CSP application without mode awareness
**After**: Intelligent mode switching with optional dual reporting

```javascript
if (cspPolicies.mode === 'block') {
  // Apply enforce middleware (with optional API exclusion)
  app.use(cspRouteFilter, cspPolicies.enforce);
  // Apply report-only middleware if dual reporting is enabled
  if (cspPolicies.dualReport) {
    app.use(cspRouteFilter, cspPolicies.reportOnly);
  }
} else {
  // Apply only reportOnly middleware (with optional API exclusion)
  app.use(cspRouteFilter, cspPolicies.reportOnly);
}
```

### 4. Optional API Route Exclusion

**File**: `server/index.js:162-164`

**Feature**: Optional exclusion of `/api/*` routes from CSP headers.

```javascript
// Optional: exclude /api/* routes from CSP (set CSP_EXCLUDE_API=true)
const excludeAPI = String(process.env.CSP_EXCLUDE_API || '').toLowerCase() === 'true';
const cspRouteFilter = excludeAPI ? /^(?!\/api).*/ : /.*/;
```

**Benefits**:
- Reduces noise on JSON API responses
- Prevents potential CORS/preflight issues
- Configurable via `CSP_EXCLUDE_API=true`

### 5. Verified Nonce Plumbing

**File**: `server/renderer.js:116-137`

**Status**: ✅ Already properly implemented

The nonce injection is correctly implemented:
- Nonce generation: `server/csp.js:17-29`
- Nonce storage: `res.locals.cspNonce`
- SSR injection: `server/renderer.js:118` and `137`

```javascript
// Get nonce from res.locals if available
const nonce = res && res.locals && res.locals.cspNonce;
const nonceMaybe = nonce ? `nonce="${nonce}"` : '';
const preloadedStateScript = `
  <script ${nonceMaybe}>window.__PRELOADED_STATE__ = ${JSON.stringify(serializedState)};</script>
`;

// Add nonce to server-side rendered script tags
const nonceParamMaybe = nonce ? { nonce } : {};
ssrScripts: extractor.getScriptTags(nonceParamMaybe),
```

### 6. 'unsafe-eval' Analysis

**File**: `server/csp.js:118`

**Decision**: ✅ Keep 'unsafe-eval' - Required by dependencies

**Justification**:
- **SDK Loader**: `src/util/sdkLoader.js:10` uses `eval('require')` for server-side webpack bypass
- **Loadable Components**: `@loadable/component` and `@loadable/server` may require eval for dynamic imports
- **Risk Mitigation**: Nonce-based script execution provides adequate protection

## Environment Variables

### New Variables
- **`CSP_DUAL_REPORT`**: Set to `'true'` to enable dual headers in block mode
- **`CSP_EXCLUDE_API`**: Set to `'true'` to exclude `/api/*` routes from CSP

### Existing Variables
- **`CSP_MODE`**: `'report'` (default) or `'block'`
- **`REACT_APP_CSP`**: `'report'` or `'block'` (enables CSP middleware)

## Header Behavior by Mode

| Mode | CSP_DUAL_REPORT | Headers Set |
|------|-----------------|-------------|
| `report` | `false` | `Content-Security-Policy-Report-Only` |
| `report` | `true` | `Content-Security-Policy-Report-Only` |
| `block` | `false` | `Content-Security-Policy` |
| `block` | `true` | `Content-Security-Policy` + `Content-Security-Policy-Report-Only` |

## Route Coverage

| Route Pattern | CSP Applied | Nonce Generated | Notes |
|---------------|-------------|-----------------|-------|
| `/` | ✅ Yes | ✅ Yes | Main app routes |
| `/api/*` | ⚙️ Configurable | ⚙️ Configurable | Excluded if `CSP_EXCLUDE_API=true` |
| `/healthz` | ❌ No | ❌ No | Health check bypass |
| Static assets | ❌ No | ❌ No | Served before CSP middleware |
| `/csp-report` | ✅ Yes | ✅ Yes | CSP violation reporting |

## Final CSP Policy (Truncated)

### Core Directives
```
base-uri 'self';
default-src 'self';
child-src blob:;
connect-src 'self' https://flex-api.sharetribe.com *.st-api.com maps.googleapis.com places.googleapis.com...;
script-src 'self' 'nonce-{64-char-hex}' 'unsafe-eval' maps.googleapis.com api.mapbox.com...;
style-src 'self' 'unsafe-inline' fonts.googleapis.com api.mapbox.com;
report-uri /csp-report;
```

<details>
<summary>Full Policy String</summary>

```
base-uri 'self';default-src 'self';child-src blob:;connect-src 'self' https://flex-api.sharetribe.com *.st-api.com maps.googleapis.com places.googleapis.com *.tiles.mapbox.com api.mapbox.com events.mapbox.com *.google-analytics.com *.analytics.google.com *.googletagmanager.com *.g.doubleclick.net *.google.com plausible.io *.plausible.io fonts.googleapis.com sentry.io *.sentry.io https://api.stripe.com *.stripe.com;font-src 'self' data: assets-sharetribecom.sharetribe.com fonts.gstatic.com;form-action 'self';frame-src 'self' https://js.stripe.com *.stripe.com *.youtube-nocookie.com https://bid.g.doubleclick.net https://td.doubleclick.net;img-src 'self' data: blob: *.imgix.net sharetribe.imgix.net picsum.photos *.picsum.photos api.mapbox.com https://*.tiles.mapbox.com maps.googleapis.com *.gstatic.com *.googleapis.com *.ggpht.com *.giphy.com *.google-analytics.com *.analytics.google.com *.googletagmanager.com *.g.doubleclick.net *.google.com google.com *.ytimg.com https://q.stripe.com *.stripe.com;script-src 'self' 'nonce-{NONCE}' 'unsafe-eval' maps.googleapis.com api.mapbox.com *.googletagmanager.com *.google-analytics.com www.googleadservices.com *.g.doubleclick.net js.stripe.com plausible.io;script-src-elem 'self' blob: https://js.stripe.com https://api.mapbox.com https://*.mapbox.com;manifest-src 'self';worker-src 'self' blob:;style-src 'self' 'unsafe-inline' fonts.googleapis.com api.mapbox.com;report-uri /csp-report
```
</details>

## Testing

### Test Script
Created `scripts/test-csp.js` for automated CSP header verification.

**Usage**:
```bash
node scripts/test-csp.js
```

**Test Cases**:
1. Report mode: Expects `Content-Security-Policy-Report-Only`
2. Block mode: Expects `Content-Security-Policy`
3. Block + dual: Expects both headers
4. API exclusion: No CSP headers on `/api/*` when enabled

## Risk Assessment

### ✅ Security Improvements
1. **Eliminated 'undefined' pollution** in policy strings
2. **Centralized header logic** reduces configuration errors
3. **Proper nonce implementation** prevents XSS via inline scripts
4. **Comprehensive domain whitelist** covers all required third-party services

### ⚠️ Considerations
1. **'unsafe-eval' retained** - Required by legitimate dependencies
2. **API route CSP** - Optional exclusion available but not enforced
3. **Dual reporting** - Optional feature for enhanced monitoring

## Files Modified

1. **`server/csp.js`**:
   - Added `.filter(Boolean)` to connectSrc
   - Implemented single source of truth for headers
   - Added metadata export for debugging

2. **`server/index.js`**:
   - Enhanced CSP middleware application
   - Added optional API route exclusion
   - Improved logging and conditional logic

3. **`scripts/test-csp.js`** (new):
   - Automated CSP header testing
   - Multiple mode verification
   - Server startup validation

## Acceptance Criteria ✅

- [x] Switching `CSP_MODE` flips header name correctly
- [x] No 'undefined' appears in any directive
- [x] Nonce is present on all inline SSR scripts and passed to loadable/extractor
- [x] `/api/*` exclusion available via `CSP_EXCLUDE_API=true`
- [x] 'unsafe-eval' retained with proper justification
- [x] Report includes file:line references and final effective policies
- [x] Test script validates all modes and configurations

## Conclusion

The CSP implementation is now hardened with proper mode switching, clean policy generation, and comprehensive nonce support. The system provides flexible configuration options while maintaining security best practices.
