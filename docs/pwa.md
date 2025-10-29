# PWA Guide

This app ships as an installable Progressive Web App (PWA) with offline support and a polished launch experience.

## Features
- Install button in the sidebar menu (no auto‑prompt if already installed)
- Maskable icons (192/512) and standard icons
- Offline app shell: index, manifest, icons cached by the service worker
- Animated splash overlay with a 5‑second minimum duration and progress bar

## Install
- Desktop Chrome/Edge: open the menu and choose “Install app”.
- Android Chrome: banner or menu → “Add to Home screen”.
- iOS Safari: Share → “Add to Home Screen” (fallback instructions provided by the app).

## Files
- `frontend/public/manifest.json`: name, icons (maskable), theme/background colors
- `frontend/public/sw.js`: caches app shell and recent GETs
- `frontend/public/index.html`: splash overlay markup/CSS and hide logic
- `frontend/src/index.js`: hides splash after React mounts (5s minimum enforced)

## Notes
- HTTPS is required by browsers for install prompts and mic permissions.
- To force a fresh SW after changes: bump the cache name in `sw.js` and rebuild.

