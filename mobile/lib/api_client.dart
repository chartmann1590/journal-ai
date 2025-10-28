import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';

class ApiClient {
  final Dio _dio;
  String baseUrl;
  bool trustSelfSigned;

  ApiClient({required this.baseUrl, this.trustSelfSigned = false})
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 20),
          receiveTimeout: const Duration(seconds: 30),
          headers: {HttpHeaders.contentTypeHeader: 'application/json'},
        )) {
    if (trustSelfSigned) {
      (_dio.httpClientAdapter as dynamic).createHttpClient = () {
        final ioClient = HttpClient()
          ..badCertificateCallback = (cert, host, port) => true;
        return ioClient;
      };
    }
  }

  // Health
  Future<Map<String, dynamic>> health() async {
    final res = await _dio.get('/health');
    return res.data is Map<String, dynamic>
        ? res.data
        : json.decode(res.data as String) as Map<String, dynamic>;
  }

  // Entries
  Future<List<dynamic>> listEntries() async {
    final res = await _dio.get('/api/entries');
    return res.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> getEntry(int id) async {
    final res = await _dio.get('/api/entries/$id');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createEntry({required String title, required String content}) async {
    final res = await _dio.post('/api/entries', data: {
      'title': title,
      'content': content,
    });
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateEntry({required int id, required String title, required String content, String? aiResponse}) async {
    final res = await _dio.put('/api/entries/$id', data: {
      'title': title,
      'content': content,
      'ai_response': aiResponse,
    });
    return res.data as Map<String, dynamic>;
  }

  Future<void> deleteEntry(int id) async {
    await _dio.delete('/api/entries/$id');
  }

  // Re-analyze
  Future<Map<String, dynamic>> reanalyzeMetadata(int id) async {
    final res = await _dio.post('/api/entries/$id/metadata');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> reanalyzeAI(int id) async {
    final res = await _dio.post('/api/entries/$id/analyze');
    return res.data as Map<String, dynamic>;
  }

  // AI status
  Future<Map<String, dynamic>> aiStatus() async {
    final res = await _dio.get('/api/ai/status');
    return res.data as Map<String, dynamic>;
  }

  // Settings
  Future<Map<String, dynamic>> getSettings() async {
    final res = await _dio.get('/api/settings');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> saveSettings(Map<String, dynamic> settings) async {
    final res = await _dio.post('/api/settings', data: settings);
    return res.data as Map<String, dynamic>;
  }

  Future<void> testEmail() async {
    await _dio.post('/api/settings/test-email');
  }

  Future<Map<String, dynamic>> sendSummary() async {
    final res = await _dio.post('/api/settings/send-summary');
    return res.data as Map<String, dynamic>;
  }
}

