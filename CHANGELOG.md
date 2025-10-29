# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Added
- Android mobile app documentation: mobile-app, mobile-notifications, mobile-build-release, mobile-quickstart
- Notifications tab in mobile app with history, clear history, and dismiss all
- Compat daily reminders via WorkManager with AI message fetch at trigger time
- Settings helpers: open notification settings, exact alarms, battery optimizations
- Test controls: Send Test Reminder Now, Compat 1-minute background test
- Swipe-to-delete on History with confirmation and UNDO (restores server entry)

### Changed
- Switched daily notifications to reliable compat background scheduling (WorkManager)
- Improved Settings UI/UX and added next-run banner
- Strengthened notification logging and diagnostics throughout app and backend

### Fixed
- Addressed scheduling issues on Android 12+ by avoiding strict exact alarms path
- Upgraded dependencies and Gradle/desugaring versions to build reliably

