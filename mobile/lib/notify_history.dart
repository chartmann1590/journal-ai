import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class NotifyHistory {
  static const _key = 'notify_history_v1';
  static const _max = 100;

  static Future<List<Map<String, dynamic>>> list() async {
    final sp = await SharedPreferences.getInstance();
    final raw = sp.getString(_key);
    if (raw == null || raw.isEmpty) return [];
    try {
      final decoded = jsonDecode(raw) as List;
      return decoded.cast<Map>().map((e) => e.cast<String, dynamic>()).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> add({
    required String source, // 'bg' | 'immediate' | 'prompt'
    required String title,
    required String body,
    required bool success,
    String? error,
  }) async {
    final sp = await SharedPreferences.getInstance();
    final items = await list();
    final entry = {
      'ts': DateTime.now().toIso8601String(),
      'source': source,
      'title': title,
      'body': body,
      'success': success,
      if (error != null) 'error': error,
    };
    items.insert(0, entry);
    while (items.length > _max) {
      items.removeLast();
    }
    await sp.setString(_key, jsonEncode(items));
  }

  static Future<void> clear() async {
    final sp = await SharedPreferences.getInstance();
    await sp.remove(_key);
  }
}

