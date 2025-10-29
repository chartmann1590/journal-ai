# Mobile Build & Release

This guide explains how to build the Android release APK and stage it for download.

## Prerequisites

- Flutter SDK 3.35+
- Dart SDK 3.9+
- Android SDK (API 35) and build tools

## One-Command Build

- Windows (PowerShell): `./scripts/build_apk_and_stage.ps1`
- macOS/Linux (bash): `bash scripts/build_apk_and_stage.sh`

What these scripts do:
- `flutter clean`
- `flutter pub get`
- `flutter build apk --release`
- Copy `mobile/build/app/outputs/flutter-apk/app-release.apk` to `frontend/public/apk/latest.apk`

## Manual Build

```
cd mobile
flutter clean
flutter pub get
flutter build apk --release
cp build/app/outputs/flutter-apk/app-release.apk ../frontend/public/apk/latest.apk
```

## Staging & Download

- Ensure your web frontend serves static files from `frontend/public`
- Download URL: `/apk/latest.apk`

## Versioning

- Update `version:` in `mobile/pubspec.yaml`, e.g., `0.2.0+5`
- Consider adding `CHANGELOG.md` entries for app updates

