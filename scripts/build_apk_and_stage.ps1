Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Builds the Android release APK and stages it to the frontend download path.
# Prereqs: Flutter SDK and Android SDK configured on this machine.

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Push-Location (Join-Path $root 'mobile')

Write-Host '[build] flutter clean'
flutter clean

Write-Host '[build] flutter pub get'
flutter pub get

Write-Host '[build] flutter build apk --release'
flutter build apk --release

$apkSrc = 'build/app/outputs/flutter-apk/app-release.apk'
$apkDstDir = Join-Path $root 'frontend/public/apk'
$apkDst = Join-Path $apkDstDir 'latest.apk'

New-Item -ItemType Directory -Force -Path $apkDstDir | Out-Null
Copy-Item -Path $apkSrc -Destination $apkDst -Force

Pop-Location
Write-Host ("[done] APK staged to: {0}" -f $apkDst)

