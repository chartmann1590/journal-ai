# Mobile Quick Start (Android)

This cheat sheet gets you from zero to journaling with daily reminders in minutes.

## Install

- Download the latest APK from your site: `/apk/latest.apk`
- Allow installs from your browser/file manager if prompted
- Open the app

## Connect to Server

- Go to the Server tab
- Enter your backend base URL (e.g., `https://<your-ip-or-domain>`)
- If using a self-signed cert for dev, enable “Trust self‑signed certificate”
- Tap “Save & Connect”

## Create Your First Entry

- Open Home → write a title and content → Save

## Enable Daily Reminders (Compat)

- Settings → Daily Reminder → toggle ON
- Pick your preferred time
- A banner shows “Next run … (~in Xh Ym)”

## Verify Notifications

- “Send Test Reminder Now” → you should see an immediate notification
- “Compat: schedule 1 min (BG)” → a background nudge appears in ~1–2 minutes with AI text

## Helpful Device Settings

- Open app notification settings → ensure notifications are allowed
- Open battery optimizations → disable optimization for “Journal AI”
- Open exact alarms (not required for compat, but useful on some OEMs)

## Notifications Tab

- View a history of notification events (immediate, prompt, background)
- Dismiss all system notifications
- Clear history

## Swipe‑to‑Delete with Undo

- History → swipe right on an entry → confirm delete
- Snackbar offers UNDO for a short time; tapping it restores the entry on the server

## Troubleshooting

- If notifications don’t arrive:
  - Ensure notifications are allowed and battery optimization is off
  - Use “Compat: schedule 1 min (BG)” to validate background path
  - Check the Notifications tab history and the Server page “Email Logs”

For deeper details, see:
- Mobile app overview: `docs/mobile-app.md`
- Notification internals: `docs/mobile-notifications.md`
- Build & release: `docs/mobile-build-release.md`

