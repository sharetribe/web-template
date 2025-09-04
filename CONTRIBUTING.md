# Contributing to Shop on Sherbet

## Development Guidelines

### Asset URL Policy

**Always use relative URLs for assets served from the same host:**

✅ **Correct (relative paths):**
```html
<script src="/static/scripts/mapbox/mapbox-sdk.min.js"></script>
<link rel="manifest" href="/site.webmanifest">
<img src="/static/icons/logo.png">
```

❌ **Incorrect (absolute self-host URLs):**
```html
<script src="https://web-template-1.onrender.com/static/scripts/mapbox/mapbox-sdk.min.js"></script>
<link rel="manifest" href="https://sherbrt-test.onrender.com/site.webmanifest">
```

### URL Audit Script

Before committing, run the URL audit to ensure no absolute self-host URLs are present:

```bash
npm run audit:urls
```

This script will:
- Search for absolute URLs pointing to our own hosts
- Check HTML, JSX, TSX, and CSS files
- Exclude documentation and build files
- Exit with error code 1 if issues are found

### CSP Configuration

- **Test/Staging**: Uses `CSP_MODE=report` (report-only, no blocking)
- **Production**: Uses `CSP_MODE=block` (enforces CSP)
- **Local Development**: CSP disabled by default

### Health Endpoints

The app provides health check endpoints for Render deployment:
- `GET /healthz` → 204 No Content
- `HEAD /healthz` → 204 No Content

### Environment Variables

- `PORT`: Server port (defaults to 3000)
- `ROOT_URL`: Base URL for absolute links (e.g., https://sherbrt.com)
- `CSP_MODE`: CSP enforcement mode ('report' or 'block')

## Code Style

- Use ES6+ features
- Prefer async/await over Promises
- Use descriptive variable names
- Add JSDoc comments for complex functions
- Follow existing code formatting

## Testing

- Run syntax checks: `node -c <file>`
- Test health endpoint: `curl -i http://localhost:3000/healthz`
- Verify CSP: Check browser console for violations
- Run URL audit: `npm run audit:urls`
