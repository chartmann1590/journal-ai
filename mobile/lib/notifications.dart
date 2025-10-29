import 'dart:io';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import 'logger.dart';
import 'notify_history.dart';

class Notifier {
  static final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  static bool _inited = false;

  static Future<void> init({required Function(String?) onSelect}) async {
    if (_inited) return;
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    final settings = InitializationSettings(android: androidInit);
    AppLog.add('Notifications: initialize() start');
    await _plugin.initialize(
      settings,
      onDidReceiveNotificationResponse: (NotificationResponse resp) async {
        AppLog.add('Notifications: onSelect payload=${resp.payload}');
        onSelect(resp.payload);
      },
      onDidReceiveBackgroundNotificationResponse: notificationTapBackground,
    );
    try {
      tz.initializeTimeZones();
      final String timeZoneName = tz.local.name; // default
      tz.setLocalLocation(tz.getLocation(timeZoneName));
      AppLog.add('Notifications: timezone initialized tz=$timeZoneName');
    } catch (e) {
      AppLog.add('Notifications: timezone init error=$e');
    }

    // Ensure Android channel exists
    try {
      final android = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      if (android != null) {
        const channel = AndroidNotificationChannel(
          'journal_daily',
          'Daily Reminders',
          description: 'Daily journaling reminders',
          importance: Importance.high,
        );
        await android.createNotificationChannel(channel);
        AppLog.add('Notifications: ensured channel journal_daily');
      }
    } catch (e) {
      AppLog.add('Notifications: create channel error=$e');
    }

    // Android 13+ runtime permission
    try {
      final android = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      final enabled = await android?.areNotificationsEnabled();
      AppLog.add('Notifications: areNotificationsEnabled=$enabled');
    } catch (e) {
      AppLog.add('Notifications: permission check error=$e');
    }

    _inited = true;
    AppLog.add('Notifications: initialize() done');
  }

  static Future<void> scheduleDaily(int hour, int minute) async {
    try {
      final next = _nextInstanceOf(hour, minute);
      AppLog.add('Notifications: scheduleDaily at ${next.toLocal().toIso8601String()} (h=$hour m=$minute)');
      await _plugin.zonedSchedule(
        1001,
        'Time to Journal',
        'Tap to open your journal',
        next,
        const NotificationDetails(
          android: AndroidNotificationDetails('journal_daily', 'Daily Reminders', channelDescription: 'Daily journaling reminders', importance: Importance.high, priority: Priority.high),
        ),
        androidScheduleMode: AndroidScheduleMode.alarmClock,
        matchDateTimeComponents: DateTimeComponents.time,
        payload: 'journal',
      );
      AppLog.add('Notifications: scheduleDaily requested');
    } catch (e) {
      AppLog.add('Notifications: scheduleDaily ERROR $e');
      rethrow;
    }
  }

  static Future<void> cancelDaily() async {
    try {
      AppLog.add('Notifications: cancelDaily start');
      await _plugin.cancel(1001);
      AppLog.add('Notifications: cancelDaily done');
    } catch (e) {
      AppLog.add('Notifications: cancelDaily ERROR $e');
      rethrow;
    }
  }

  static Future<void> scheduleInMinutes(int minutes) async {
    try {
      final now = tz.TZDateTime.now(tz.local);
      final when = now.add(Duration(minutes: minutes));
      AppLog.add('Notifications: scheduleInMinutes minutes=$minutes at ${when.toLocal().toIso8601String()}');
      await _plugin.zonedSchedule(
        1998,
        'Time to Journal',
        'Tap to open your journal',
        when,
        const NotificationDetails(
          android: AndroidNotificationDetails('journal_daily', 'Daily Reminders', channelDescription: 'Daily journaling reminders', importance: Importance.high, priority: Priority.high),
        ),
        androidScheduleMode: AndroidScheduleMode.alarmClock,
        payload: 'journal',
      );
      AppLog.add('Notifications: scheduleInMinutes requested');
    } catch (e) {
      AppLog.add('Notifications: scheduleInMinutes ERROR $e');
      rethrow;
    }
  }

  // Show an immediate test reminder notification
  static Future<void> showTestReminderNow() async {
    AppLog.add('Notifications: showTestReminderNow()');
    try {
      await _plugin.show(
        1999,
        'Time to Journal',
        'Tap to open your journal',
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'journal_daily',
            'Daily Reminders',
            channelDescription: 'Daily journaling reminders',
            importance: Importance.high,
            priority: Priority.high,
          ),
        ),
        payload: 'journal',
      );
      AppLog.add('Notifications: showTestReminderNow() DONE');
      await NotifyHistory.add(source: 'immediate', title: 'Time to Journal', body: 'Tap to open your journal', success: true);
    } catch (e) {
      AppLog.add('Notifications: showTestReminderNow() ERROR $e');
      await NotifyHistory.add(source: 'immediate', title: 'Time to Journal', body: 'error', success: false, error: e.toString());
      rethrow;
    }
  }

  // Show the motivation message received from server
  static Future<void> showMotivation(String message) async {
    final body = message.length > 120 ? message.substring(0, 120) + '…' : message;
    AppLog.add('Notifications: showMotivation len=${message.length}');
    try {
      await _plugin.show(
        2001,
        'Daily Prompt',
        body,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'journal_daily',
            'Daily Reminders',
            channelDescription: 'Daily journaling reminders',
            importance: Importance.high,
            priority: Priority.high,
          ),
        ),
        payload: 'journal',
      );
      AppLog.add('Notifications: showMotivation DONE');
      await NotifyHistory.add(source: 'prompt', title: 'Daily Prompt', body: body, success: true);
    } catch (e) {
      AppLog.add('Notifications: showMotivation ERROR $e');
      await NotifyHistory.add(source: 'prompt', title: 'Daily Prompt', body: 'error', success: false, error: e.toString());
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> debugStatus() async {
    bool? enabled;
    try {
      final android = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      enabled = await android?.areNotificationsEnabled();
    } catch (_) {}
    final pending = await _plugin.pendingNotificationRequests();
    return {
      'enabled': enabled,
      'pending_count': pending.length,
      'pending_ids': pending.map((e) => e.id).toList(),
    };
  }

  static tz.TZDateTime _nextInstanceOf(int hour, int minute) {
    final now = tz.TZDateTime.now(tz.local);
    var scheduled = tz.TZDateTime(tz.local, now.year, now.month, now.day, hour, minute);
    if (scheduled.isBefore(now)) {
      scheduled = scheduled.add(const Duration(days: 1));
    }
    return scheduled;
  }
}

@pragma('vm:entry-point')
void notificationTapBackground(NotificationResponse response) {
  AppLog.add('Notifications: background tap payload=${response.payload}');
}
