# Mobile Notifications

This doc describes how notifications work in the Android app and how to diagnose delivery issues.

## Paths

1) Immediate notifications
- Triggered directly in app code (e.g., “Send Test Reminder Now”).
- Also used when the app fetches the daily motivational prompt while foregrounded.

2) Compat daily background reminders (WorkManager)
- A periodic task runs daily at your chosen time.
- It requests `/api/ai/motivate` from the backend and posts a notification with the returned message.
- Survives app restarts and reboots.

## Permissions and Settings

- App notifications must be allowed in system settings.
- Battery optimizations should be disabled for reliable background execution on some OEM devices.
- Exact alarms are not required for compat mode; a shortcut to the exact alarms page is provided as some OEMs conflate these controls.

## Scheduling Details

- When the daily toggle is enabled, the app computes an initial delay based on the selected time.
- It registers a unique periodic task `daily_nudge_task` with frequency 24 hours.
- Changing time cancels and re-registers the task with a new delay.
- On Settings load, if enabled, the app ensures the periodic task exists.

## Debugging

- Settings → “Compat: schedule 1 min (BG)” posts a test background nudge in ~1–2 minutes.
- Notifications tab shows history including success/failure and sources.
- Server page allows emailing app logs for remote diagnostics.

Common blockers
- Notifications disabled at system level
- Aggressive battery optimization restricting background work
- Backend unreachable (e.g., wrong base URL or certificate trust)

## Backend Contract

- Endpoint: `POST /api/ai/motivate`
- Response: `{ "message": string }`
- The mobile app truncates long messages and posts them as notification body.

