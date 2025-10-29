# Mobile App (Android, Flutter)

This document covers the Android mobile client: features, setup, permissions, notifications, build/release, and troubleshooting.

## Overview

- Flutter-based Android app that connects to the Journal AI backend
- Core screens: Splash, Server, Home (New Entry), History, Calendar, Settings, Notifications
- Offline-friendly UI for reading/history; creating entries requires backend connectivity

## Features

- Create, edit, and view journal entries
- AI insights and re-analysis on demand
- Search and filter (text, tags, emotions) and calendar by date
- Daily reminder notifications with AI “nudge” text
- Weekly email summaries configuration (through backend)
- Diagnostics: app logs, email logs, notification status, pending jobs

## First Run

1. Install the APK from your site: `/apk/latest.apk` (or sideload the build artifact)
2. Open the app and connect to your server:
   - Server screen → enter base URL, optionally trust self-signed certificates
   - Tap “Save & Connect”
3. Create an entry on Home to verify connectivity

## Permissions

- Notifications: enable in system settings for Journal AI
- Exact alarms: not strictly required with compat mode, but an app shortcut is provided in Settings
- Battery optimization: disable optimizations for Journal AI to avoid delayed background execution on certain OEMs

App provides quick links under Settings → Daily Reminder:
- Open app notification settings
- Open exact alarm settings
- Open battery optimization settings

## Notifications

The app uses two paths:

1) Immediate notifications (in-app events)
- “Send Test Reminder Now” in Settings posts a local notification immediately
- When the daily prompt is fetched in-app, a “Daily Prompt” notification is also shown

2) Compat daily background reminders (WorkManager)
- Settings toggle registers a unique WorkManager periodic job (`daily_nudge_task`)
- initialDelay is computed from your chosen time (today or tomorrow)
- Frequency: 24 hours
- At execution time, the background task calls the backend `/api/ai/motivate` to fetch short AI text and posts the notification
- Persists across app restarts and reboots

Notifications Tab
- Shows a history of notification events: time, source (immediate/prompt/bg), success/error
- Actions to dismiss all system notifications and clear history

Home Screen Widgets
- Quick New Entry: opens the app directly to the New Entry screen
- Quick Jot: opens New Entry and pre-fills with a short AI prompt (or a light template if offline)

Deep Links
- Custom scheme `journalai://app/new` opens the app to New Entry and triggers Quick Jot prefill

## Building (Release APK)

Prereqs:
- Flutter 3.35+, Dart 3.9+
- Android SDK (API level 35 recommended)

From repo root:
- Windows (PowerShell): `./scripts/build_apk_and_stage.ps1`
- macOS/Linux (bash): `bash scripts/build_apk_and_stage.sh`

Artifacts:
- APK is staged to `frontend/public/apk/latest.apk`
- Your web frontend serves it at `/apk/latest.apk`

## Settings → Daily Reminder

- Toggle ON registers the daily periodic background job, using initialDelay to hit the chosen time
- Changing the time re-registers the job with a new delay
- Banner shows “Next run” date/time and remaining time
- Compat 1-minute test available to validate background delivery

## Server Connectivity

- Base URL stored locally along with trust-self-signed flag
- Health checked when saving server settings (soft-fails allowed)

## History

- Swipe right to delete with confirmation
- Undo available for a short grace period; undo recreates the entry on the server, restoring AI text if present

## Troubleshooting

- Notification not appearing
  - Check Settings → Notifications tab for history and errors
  - Ensure app notifications are enabled in system
  - Disable battery optimizations for Journal AI
  - Verify the backend `/api/ai/motivate` endpoint is reachable
  - Use the “Compat: schedule 1 min (BG)” tester to validate the WorkManager path

- Can’t connect to server
  - Verify base URL and certificate trust settings
  - Server → “Email Logs” to quickly share diagnostics

## Release Checklist

- Update app version in `mobile/pubspec.yaml`
- Build with scripts under `scripts/`
- Verify notification flows on a device:
  - Immediate test
  - Background 1-minute compat test
  - Daily periodic schedule
- Confirm APK staged at `frontend/public/apk/latest.apk`

## Privacy & Security

- The app stores only local preferences (server URL, switches, times) on-device
- All personal journal data is stored on the server
- Use HTTPS with valid certs in production (self-signed only for development)
