# Testing Guide

## End‑to‑End (Playwright)

### Setup
```bash
cd frontend
npx playwright install
```

### Run
```bash
npm run test:e2e
```

### What’s covered
- Manifest link and maskable icons
- Service worker script availability
- Splash visible for ~5 seconds with progress bar
- Install UX via menu button, fallback text for iOS
- No prompt when already installed (simulated)

### Configuration
- Config is in `frontend/playwright.config.js` with `baseURL=https://localhost` and `ignoreHTTPSErrors=true`.

