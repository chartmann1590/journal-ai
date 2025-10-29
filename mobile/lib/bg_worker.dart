import 'dart:io';
import 'package:dio/dio.dart';
import 'package:workmanager/workmanager.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import 'logger.dart';
import 'notify_history.dart';

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      final baseUrl = (inputData?['baseUrl'] as String?) ?? '';
      final trust = (inputData?['trust'] as bool?) ?? false;
      AppLog.add('BG: task=$task baseUrl=$baseUrl trust=$trust');

      // Init timezone and notifications in BG isolate
      try {
        tz.initializeTimeZones();
        final String timeZoneName = tz.local.name;
        tz.setLocalLocation(tz.getLocation(timeZoneName));
      } catch (_) {}

      final plugin = FlutterLocalNotificationsPlugin();
      const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
      await plugin.initialize(const InitializationSettings(android: androidInit));
      final android = plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      if (android != null) {
        const channel = AndroidNotificationChannel(
          'journal_daily', 'Daily Reminders',
          description: 'Daily journaling reminders', importance: Importance.high,
        );
        await android.createNotificationChannel(channel);
      }

      String body = 'Time to Journal';
      if (baseUrl.isNotEmpty) {
        try {
          final dio = Dio(BaseOptions(validateStatus: (_) => true));
          if (trust) {
            // ignore bad certs
            (dio.httpClientAdapter as dynamic).onHttpClientCreate = (HttpClient client) {
              client.badCertificateCallback = (X509Certificate cert, String host, int port) => true;
              return client;
            };
          }
          final resp = await dio.post('$baseUrl/api/ai/motivate', data: {});
          final msg = (resp.data?['message']?.toString() ?? '').trim();
          if (msg.isNotEmpty) {
            body = msg.length > 120 ? msg.substring(0, 120) + '…' : msg;
          }
          AppLog.add('BG: got motivate len=${body.length}');
        } catch (e) {
          AppLog.add('BG: motivate error=$e');
        }
      }

      await plugin.show(
        3001,
        'Daily Prompt',
        body,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'journal_daily', 'Daily Reminders',
            channelDescription: 'Daily journaling reminders',
            importance: Importance.high,
            priority: Priority.high,
          ),
        ),
        payload: 'journal',
      );
      AppLog.add('BG: notification shown');
      await NotifyHistory.add(source: 'bg', title: 'Daily Prompt', body: body, success: true);
      return true;
    } catch (e) {
      AppLog.add('BG: fatal error $e');
      try { await NotifyHistory.add(source: 'bg', title: 'Daily Prompt', body: 'error', success: false, error: e.toString()); } catch (_) {}
      return false;
    }
  });
}
