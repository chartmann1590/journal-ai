#!/usr/bin/env bash
set -euo pipefail

# Builds the Android release APK and stages it to the frontend download path.
# Prereqs: Flutter SDK and Android SDK configured on this machine.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
pushd "$ROOT_DIR/mobile" >/dev/null

echo "[build] flutter clean"
flutter clean

echo "[build] flutter pub get"
flutter pub get

echo "[build] flutter build apk --release"
flutter build apk --release

APK_SRC="build/app/outputs/flutter-apk/app-release.apk"
APK_DST_DIR="$ROOT_DIR/frontend/public/apk"
APK_DST="$APK_DST_DIR/latest.apk"

mkdir -p "$APK_DST_DIR"
cp -f "$APK_SRC" "$APK_DST"

popd >/dev/null
echo "[done] APK staged to: $APK_DST"

