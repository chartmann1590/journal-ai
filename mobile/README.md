# Journal AI Mobile (Flutter)

This Flutter app provides a full-featured Android client for Journal AI. It connects to your self‑hosted server and supports creating/editing entries, history, calendar view, entry detail with AI analysis, and settings.

## Features

- Server connect screen (enter base URL, e.g., `https://192.168.1.10`)
- Optional toggle to trust self‑signed certificates (for local HTTPS)
- Add/edit entries, view history and calendar
- Entry detail: reanalyze AI and tags/emotions
- Settings: load/save, test email, send summary

## Prerequisites

- Flutter SDK 3.22+
- Android SDK + device/emulator
- Journal AI server reachable on your LAN/WAN

## Build

```bash
cd mobile
# If this is a fresh checkout, scaffold missing platform files
flutter create .
flutter pub get
flutter build apk --release
# APK output: build/app/outputs/flutter-apk/app-release.apk
```

## Run (debug)

```bash
flutter run -d android
```

## First launch

- Open the app → Server → enter your base URL (e.g., `https://<lan-ip>`)
- If using self‑signed HTTPS, enable “Trust self‑signed” in Server → Save

Note: For production, use a valid TLS certificate; disable the trust toggle.
