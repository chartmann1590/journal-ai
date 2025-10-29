class AppLog {
  static final List<String> _lines = [];

  static void add(String message) {
    final ts = DateTime.now().toIso8601String();
    _lines.add('[$ts] $message');
    if (_lines.length > 1000) {
      _lines.removeRange(0, _lines.length - 1000);
    }
  }

  static String dump() => _lines.join('\n');

  static void clear() => _lines.clear();
}

