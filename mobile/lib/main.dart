import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'package:table_calendar/table_calendar.dart';
import 'api_client.dart';
import 'logger.dart';
import 'notifications.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:android_intent_plus/android_intent.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:workmanager/workmanager.dart';
import 'bg_worker.dart';
import 'notify_history.dart';

void main() {
  runApp(const JournalMobileApp());
}

void showSnack(BuildContext context, String msg) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
}

class AppState extends ChangeNotifier {
  String baseUrl = '';
  bool trustSelfSigned = false;
  ApiClient? api;

  Future<void> load() async {
    final sp = await SharedPreferences.getInstance();
    AppLog.add('AppState.load: loading baseUrl/trust from storage');
    baseUrl = sp.getString('baseUrl') ?? '';
    trustSelfSigned = sp.getBool('trustSelfSigned') ?? false;
    if (baseUrl.isNotEmpty) {
      AppLog.add('AppState.load: baseUrl=$baseUrl trust=$trustSelfSigned');
      api = ApiClient(baseUrl: baseUrl, trustSelfSigned: trustSelfSigned);
    }
    notifyListeners();
  }

  Future<void> save(String url, bool trust) async {
    final sp = await SharedPreferences.getInstance();
    var u = url.trim();
    if (!u.startsWith('http://') && !u.startsWith('https://')) {
      u = 'https://' + u;
    }
    u = u.replaceAll(RegExp(r'/+$'), '');
    baseUrl = u;
    trustSelfSigned = trust;
    AppLog.add('AppState.save: baseUrl=$baseUrl trust=$trustSelfSigned');
    await sp.setString('baseUrl', baseUrl);
    await sp.setBool('trustSelfSigned', trustSelfSigned);
    api = ApiClient(baseUrl: baseUrl, trustSelfSigned: trustSelfSigned);
    notifyListeners();
  }
}

class JournalMobileApp extends StatelessWidget {
  const JournalMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppState()..load(),
      child: MaterialApp(
        title: 'Journal AI',
        theme: ThemeData(
          brightness: Brightness.dark,
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blueAccent, brightness: Brightness.dark),
          useMaterial3: true,
          scaffoldBackgroundColor: const Color(0xFF0F0F10),
          appBarTheme: const AppBarTheme(backgroundColor: Color(0xFF151518), foregroundColor: Colors.white, elevation: 0),
          cardColor: const Color(0xFF1B1B1E),
          bottomNavigationBarTheme: const BottomNavigationBarThemeData(
            backgroundColor: Color(0xE6151518),
            selectedItemColor: Colors.white,
            unselectedItemColor: Color(0xFF9AA0A6),
            showUnselectedLabels: true,
            type: BottomNavigationBarType.fixed,
          ),
          inputDecorationTheme: const InputDecorationTheme(
            filled: true,
            fillColor: Color(0xFF141416),
            border: OutlineInputBorder(borderSide: BorderSide(color: Color(0xFF2A2B2E))),
            enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Color(0xFF2A2B2E))),
            focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.blueAccent)),
            labelStyle: TextStyle(color: Color(0xFF9AA0A6)),
          ),
        ),
        home: const SplashPage(),
      ),
    );
  }
}

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});
  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> with TickerProviderStateMixin {
  late final AnimationController _logoCtrl;
  late final AnimationController _bgCtrl;
  late final Animation<double> _scale;
  late final Animation<double> _fade;
  late final Animation<double> _rotate;
  @override
  void initState() {
    super.initState();
    _logoCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400));
    _bgCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 2200))..repeat(reverse: true);
    _scale = CurvedAnimation(parent: _logoCtrl, curve: Curves.easeOutBack);
    _fade = CurvedAnimation(parent: _logoCtrl, curve: Curves.easeIn);
    _rotate = Tween<double>(begin: -0.02, end: 0.02).animate(CurvedAnimation(parent: _logoCtrl, curve: Curves.easeInOut));
    _logoCtrl.forward();
    Notifier.init(onSelect: (payload) async {
      AppLog.add('Notification tapped payload=$payload');
      final sp = await SharedPreferences.getInstance();
      await sp.setBool('pending_open_home', true);
    });
    // Initialize background worker for compatibility scheduling
    try {
      Workmanager().initialize(callbackDispatcher, isInDebugMode: false);
      AppLog.add('Workmanager: initialized');
    } catch (e) {
      AppLog.add('Workmanager: init ERROR $e');
    }
    Future.delayed(const Duration(milliseconds: 2100), () {
      if (!mounted) return;
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const RootRouter()));
    });
  }
  @override
  void dispose() { _logoCtrl.dispose(); _bgCtrl.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBuilder(
        animation: _bgCtrl,
        builder: (context, _) {
          final t = _bgCtrl.value;
          final c1 = Color.lerp(const Color(0xFF0F0F10), const Color(0xFF121E2A), t)!;
          final c2 = Color.lerp(const Color(0xFF101317), const Color(0xFF0A1A2F), 1 - t)!;
          return Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [c1, c2],
              ),
            ),
            child: Center(
              child: FadeTransition(
                opacity: _fade,
                child: ScaleTransition(
                  scale: _scale,
                  child: RotationTransition(
                    turns: _rotate,
                    child: Column(mainAxisSize: MainAxisSize.min, children: const [
                      Icon(Icons.auto_awesome, size: 86, color: Colors.lightBlueAccent),
                      SizedBox(height: 14),
                      Text('Journal AI', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                      SizedBox(height: 6),
                      Text('Reflect. Record. Grow.', style: TextStyle(fontSize: 14, color: Color(0xFF9AA0A6))),
                      SizedBox(height: 24),
                      SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2.6)),
                    ]),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class RootRouter extends StatelessWidget {
  const RootRouter({super.key});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    if (app.baseUrl.isEmpty || app.api == null) {
      return const ServerPage();
    }
    return const MainNav();
  }
}

class MainNav extends StatefulWidget {
  const MainNav({super.key});
  @override
  State<MainNav> createState() => _MainNavState();
}

class _MainNavState extends State<MainNav> {
  int idx = 0;
  final pages = const [HomePage(), HistoryPage(), CalendarScreen(), NotificationCenterPage(), SettingsPage(), ServerPage()];
  final items = const [
    BottomNavigationBarItem(icon: Icon(Icons.edit_outlined), activeIcon: Icon(Icons.edit), label: 'Home'),
    BottomNavigationBarItem(icon: Icon(Icons.history_outlined), activeIcon: Icon(Icons.history), label: 'History'),
    BottomNavigationBarItem(icon: Icon(Icons.calendar_today_outlined), activeIcon: Icon(Icons.calendar_today), label: 'Calendar'),
    BottomNavigationBarItem(icon: Icon(Icons.notifications_outlined), activeIcon: Icon(Icons.notifications), label: 'Notifications'),
    BottomNavigationBarItem(icon: Icon(Icons.settings_outlined), activeIcon: Icon(Icons.settings), label: 'Settings'),
    BottomNavigationBarItem(icon: Icon(Icons.cloud_outlined), activeIcon: Icon(Icons.cloud), label: 'Server'),
  ];
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final sp = await SharedPreferences.getInstance();
      final pendingTab = sp.getInt('pending_open_tab');
      if (pendingTab != null) {
        setState(() { idx = pendingTab.clamp(0, pages.length - 1); });
        await sp.remove('pending_open_tab');
        final entryId = sp.getInt('pending_open_entry');
        if (entryId != null) {
          await sp.remove('pending_open_entry');
          // push entry detail after tab switch
          if (mounted) {
            await Future<void>.delayed(const Duration(milliseconds: 50));
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => EntryDetailScreen(entryId: entryId)),
            );
          }
        }
      }
    });
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: pages[idx]),
      bottomNavigationBar: BottomNavigationBar(currentIndex: idx, onTap: (i) => setState(() => idx = i), items: items),
    );
  }
}

class ServerPage extends StatefulWidget {
  const ServerPage({super.key});
  @override
  State<ServerPage> createState() => _ServerPageState();
}

class _ServerPageState extends State<ServerPage> {
  final controller = TextEditingController();
  bool trust = false;

  @override
  void initState() {
    super.initState();
    final app = context.read<AppState>();
    controller.text = app.baseUrl;
    trust = app.trustSelfSigned;
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(title: const Text('Server')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: ListView(children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
                Text('Connect to Your Journal Server', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                SizedBox(height: 8),
                Text('Enter the base URL where your Journal AI backend is running. If you are on the same Wi‑Fi, use the server\'s local IP (e.g., https://192.168.1.10).'),
              ]),
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Base URL', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                TextField(controller: controller, decoration: const InputDecoration(hintText: 'https://<host>')),
                const SizedBox(height: 12),
                Row(children: [
                  Switch(value: trust, onChanged: (v) => setState(() => trust = v)),
                  const SizedBox(width: 8),
                  const Expanded(child: Text('Trust self‑signed certificate (development only)')),
                ]),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.cloud_done),
                    onPressed: () async {
                      if (controller.text.trim().isEmpty) return;
                      AppLog.add('Server: Save & Connect clicked with url=${controller.text.trim()} trust=$trust');
                      await app.save(controller.text.trim(), trust);
                      try {
                        await app.api!.health();
                        if (!mounted) return;
                        showSnack(context, 'Connected');
                        AppLog.add('Server: health OK');
                      } catch (e) {
                        AppLog.add('Server: health ERROR $e');
                        if (!mounted) return;
                        showSnack(context, 'Saved, but health check failed: $e');
                      }
                      if (!mounted) return;
                      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const MainNav()));
                    },
                    label: const Text('Save & Connect'),
                  ),
                ),
              ]),
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Troubleshooting', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text('• Ensure the backend is running and reachable from the phone.\n• If using self‑signed HTTPS, enable the switch above.\n• Use your server\'s IP instead of hostname on local networks.'),
                const SizedBox(height: 12),
                Row(children: [
                  OutlinedButton(
                    onPressed: () async {
                      final body = Uri.encodeComponent(AppLog.dump());
                      final uri = Uri.parse('mailto:?subject=Journal%20AI%20Mobile%20Logs&body=$body');
                      try {
                        final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
                        if (!ok) {
                          showSnack(context, 'Could not open email app');
                        }
                      } catch (e) {
                        showSnack(context, 'Failed to open email: $e');
                      }
                    },
                    child: const Text('Email Logs'),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton(
                    onPressed: () { AppLog.clear(); showSnack(context, 'Logs cleared'); },
                    child: const Text('Clear Logs'),
                  ),
                ]),
                if (app.baseUrl.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 12), child: Text('Current: ${app.baseUrl}', style: const TextStyle(color: Color(0xFF9AA0A6))))
              ]),
            ),
          ),
        ]),
      ),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final titleCtrl = TextEditingController();
  final contentCtrl = TextEditingController();
  bool saving = false;
  // Voice dictation via Android keyboard mic (OS feature) recommended.
  Future<void> _checkPendingPrompt() async {
    final sp = await SharedPreferences.getInstance();
    final quick = sp.getBool('pending_quick_jot') ?? false;
    final pending = sp.getBool('pending_open_home') ?? false;
    if (quick) {
      final app = context.read<AppState>();
      try {
        final msg = await app.api?.motivate();
        if ((msg ?? '').isNotEmpty) {
          setState(() { contentCtrl.text = msg!; });
          showSnack(context, 'Quick jot prompt loaded');
        } else {
          setState(() { contentCtrl.text = _quickJotTemplate(); });
        }
      } catch (e) {
        AppLog.add('Home: quickJot motivate ERROR $e');
        setState(() { contentCtrl.text = _quickJotTemplate(); });
      } finally {
        await sp.setBool('pending_quick_jot', false);
        await sp.setBool('pending_open_home', false);
      }
      return;
    }
    if (pending) {
      final app = context.read<AppState>();
      try {
        final msg = await app.api?.motivate();
        if ((msg ?? '').isNotEmpty) {
          setState(() { contentCtrl.text = msg!; });
          showSnack(context, 'Daily prompt loaded');
          // Also surface this via a notification for visibility
          await Notifier.showMotivation(msg!);
        }
      } catch (e) {
        AppLog.add('Home: motivate ERROR $e');
      } finally {
        await sp.setBool('pending_open_home', false);
      }
    }
  }

  String _quickJotTemplate() {
    final today = DateFormat('EEE, MMM d').format(DateTime.now());
    return 'Quick jot — ' + today + '\n\nGrateful for: \nFeeling: \nNotable events: \nOne thought: ';
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkPendingPrompt());
  }

  Future<void> save() async {
    final app = context.read<AppState>();
    if (app.api == null) return;
    if (contentCtrl.text.trim().isEmpty) {
      showSnack(context, 'Content is required');
      return;
    }
    setState(() => saving = true);
    try {
      AppLog.add('Home: createEntry title=${titleCtrl.text.trim()}');
      await app.api!.createEntry(title: titleCtrl.text.trim().isEmpty ? 'Untitled Entry' : titleCtrl.text.trim(), content: contentCtrl.text.trim());
      titleCtrl.clear();
      contentCtrl.clear();
      showSnack(context, 'Saved');
    } catch (e) {
      AppLog.add('Home: createEntry ERROR $e');
      showSnack(context, 'Failed to save: $e');
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New Entry')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: ListView(children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                TextField(controller: titleCtrl, decoration: const InputDecoration(prefixIcon: Icon(Icons.title), labelText: 'Title')),
                const SizedBox(height: 12),
                TextField(
                  controller: contentCtrl,
                  maxLines: 12,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(
                    alignLabelWithHint: true,
                    prefixIcon: Icon(Icons.notes),
                    labelText: 'Your Thoughts *',
                    hintText: 'Write freely. You can also use your keyboard\'s mic to dictate.',
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  () {
                    final text = contentCtrl.text;
                    final words = text.trim().isEmpty ? 0 : text.trim().split(RegExp(r"\s+")).length;
                    return 'Words: $words  •  Characters: ${text.length}';
                  }(),
                  style: const TextStyle(color: Color(0xFF9AA0A6), fontSize: 12),
                ),
              ]),
            ),
          ),
          const SizedBox(height: 12),
          Row(children: [
            ElevatedButton(
              onPressed: saving ? null : save,
              child: saving
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Save Entry'),
            ),
            const SizedBox(width: 8),
            OutlinedButton(
              onPressed: saving ? null : () { titleCtrl.clear(); contentCtrl.clear(); },
              child: const Text('Clear'),
            ),
          ])
        ]),
      ),
    );
  }

  // Voice helpers removed in this build; use Android keyboard mic.
}

class HistoryPage extends StatefulWidget {
  const HistoryPage({super.key});
  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> {
  List<dynamic> entries = [];
  bool loading = true;
  final searchCtrl = TextEditingController();
  final tagsCtrl = TextEditingController();
  final emotionsCtrl = TextEditingController();

  Future<void> load() async {
    final app = context.read<AppState>();
    if (app.api == null) return;
    setState(() => loading = true);
      try {
      AppLog.add('History: listEntries');
      final list = await app.api!.listEntries();
      setState(() => entries = list);
    } catch (e) {
      AppLog.add('History: listEntries ERROR $e');
      if (mounted) showSnack(context, 'Failed to load history: $e');
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => load());
  }

  @override
  Widget build(BuildContext context) {
    final filtered = entries.where((e) {
      final q = searchCtrl.text.trim().toLowerCase();
      final tq = tagsCtrl.text.trim().toLowerCase().split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
      final eq = emotionsCtrl.text.trim().toLowerCase().split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
      bool ok = true;
      if (q.isNotEmpty) {
        ok &= (e['title']?.toString().toLowerCase().contains(q) ?? false) || (e['content']?.toString().toLowerCase().contains(q) ?? false);
      }
      if (tq.isNotEmpty) {
        final tags = (e['tags'] as List?)?.map((x) => x.toString().toLowerCase()).toList() ?? [];
        ok &= tq.any((x) => tags.contains(x));
      }
      if (eq.isNotEmpty) {
        final emos = (e['emotions'] as List?)?.map((x) => x.toString().toLowerCase()).toList() ?? [];
        ok &= eq.any((x) => emos.contains(x));
      }
      return ok;
    }).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('History'), actions: [IconButton(onPressed: load, icon: const Icon(Icons.refresh))]),
      body: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(children: [
          TextField(controller: searchCtrl, decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: 'Search…'), onChanged: (_) => setState(() {})),
          Row(children: [
            Expanded(child: TextField(controller: tagsCtrl, decoration: const InputDecoration(prefixIcon: Icon(Icons.tag), hintText: 'Filter tags (a,b,c)'), onChanged: (_) => setState(() {}))),
            const SizedBox(width: 8),
            Expanded(child: TextField(controller: emotionsCtrl, decoration: const InputDecoration(prefixIcon: Icon(Icons.emoji_emotions), hintText: 'Filter emotions (a,b)'), onChanged: (_) => setState(() {}))),
          ]),
          const SizedBox(height: 8),
          Expanded(
            child: loading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    itemCount: filtered.length,
                    itemBuilder: (ctx, i) {
                      final e = filtered[i];
                      final int id = e['id'] as int;
                      return Dismissible(
                        key: ValueKey('entry_$id'),
                        direction: DismissDirection.startToEnd,
                        background: Container(
                          color: Colors.red.withOpacity(0.25),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          alignment: Alignment.centerLeft,
                          child: const Icon(Icons.delete_outline, color: Colors.redAccent),
                        ),
                        confirmDismiss: (dir) async {
                          return await showDialog<bool>(
                            context: context,
                            builder: (dctx) => AlertDialog(
                              title: const Text('Delete entry?'),
                              content: const Text('Are you sure you want to delete this entry? This cannot be undone.'),
                              actions: [
                                TextButton(onPressed: () => Navigator.of(dctx).pop(false), child: const Text('Cancel')),
                                TextButton(onPressed: () => Navigator.of(dctx).pop(true), child: const Text('Delete')),
                              ],
                            ),
                          ) ?? false;
                        },
                        onDismissed: (dir) async {
                          final app = context.read<AppState>();
                          // Cache original fields for potential undo
                          final String origTitle = (e['title'] ?? 'Untitled Entry').toString();
                          final String origContent = (e['content'] ?? '').toString();
                          final String? origAI = (e['ai_response']?.toString());
                          try {
                            AppLog.add('History: deleteEntry id=$id');
                            await app.api!.deleteEntry(id);
                            setState(() {
                              entries.removeWhere((x) => (x['id'] as int) == id);
                            });
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).clearSnackBars();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: const Text('Entry deleted'),
                                duration: const Duration(seconds: 8),
                                action: SnackBarAction(
                                  label: 'UNDO',
                                  onPressed: () async {
                                    try {
                                      AppLog.add('History: undo delete -> recreate');
                                      final created = await app.api!.createEntry(title: origTitle, content: origContent);
                                      final newId = created['id'] as int?;
                                      if (newId != null && (origAI != null && origAI.isNotEmpty)) {
                                        try {
                                          await app.api!.updateEntry(id: newId, title: origTitle, content: origContent, aiResponse: origAI);
                                        } catch (e) {
                                          AppLog.add('History: undo set AI ERROR $e');
                                        }
                                      }
                                      if (mounted) {
                                        await load();
                                        showSnack(context, 'Entry restored');
                                      }
                                    } catch (e) {
                                      AppLog.add('History: undo recreate ERROR $e');
                                      if (mounted) showSnack(context, 'Failed to restore: $e');
                                    }
                                  },
                                ),
                              ),
                            );
                          } catch (err) {
                            AppLog.add('History: deleteEntry ERROR $err');
                            if (mounted) showSnack(context, 'Failed to delete: $err');
                            // Reload to restore item if delete failed
                            if (mounted) load();
                          }
                        },
                        child: Card(
                          child: ListTile(
                            title: Text(e['title'] ?? 'Untitled Entry'),
                            subtitle: Text((e['content'] as String).length > 140 ? (e['content'] as String).substring(0, 140) + '…' : e['content'] as String),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () async {
                              await Navigator.of(context).push(MaterialPageRoute(builder: (_) => EntryDetailScreen(entryId: id)));
                              if (mounted) load();
                            },
                          ),
                        ),
                      );
                    },
                  ),
          )
        ]),
      ),
    );
  }
}

class EntryDetailScreen extends StatefulWidget {
  final int entryId;
  const EntryDetailScreen({super.key, required this.entryId});
  @override
  State<EntryDetailScreen> createState() => _EntryDetailScreenState();
}

class _EntryDetailScreenState extends State<EntryDetailScreen> {
  Map<String, dynamic>? entry;
  bool loading = true;
  bool editing = false;
  final titleCtrl = TextEditingController();
  final contentCtrl = TextEditingController();

  Future<void> load() async {
    final app = context.read<AppState>();
    if (app.api == null) return;
    setState(() => loading = true);
    try {
      final e = await app.api!.getEntry(widget.entryId);
      entry = e;
      titleCtrl.text = e['title'] ?? 'Untitled Entry';
      contentCtrl.text = e['content'] ?? '';
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => load());
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    final e = entry!;
    final tags = (e['tags'] as List?)?.cast<dynamic>() ?? [];
    final emos = (e['emotions'] as List?)?.cast<dynamic>() ?? [];
    return Scaffold(
      appBar: AppBar(title: const Text('Entry')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: ListView(children: [
          editing
              ? TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Title'))
              : Text(e['title'] ?? 'Untitled Entry', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(spacing: 8, runSpacing: 4, children: [
            ...tags.map((t) => Chip(label: Text('#$t'))),
            ...emos.map((m) => Chip(label: Text(m.toString()), backgroundColor: Colors.blue.withOpacity(0.2))),
          ]),
          const SizedBox(height: 8),
          editing
              ? TextField(controller: contentCtrl, maxLines: 12, decoration: const InputDecoration(labelText: 'Content'))
              : Text(e['content'] ?? '', style: const TextStyle(fontSize: 16)),
          const SizedBox(height: 12),
          if (!editing) ...[
            const Text('AI Insight', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(8)), child: Text(e['ai_response'] ?? 'No analysis yet')),
          ],
          const SizedBox(height: 12),
          Row(children: [
            if (!editing) ElevatedButton(onPressed: () => setState(() => editing = true), child: const Text('Edit')),
            if (editing)
              ElevatedButton(
                onPressed: () async {
                  final app = context.read<AppState>();
                  AppLog.add('EntryDetail: updateEntry id=${e['id']}');
                  await app.api!.updateEntry(id: e['id'] as int, title: titleCtrl.text, content: contentCtrl.text, aiResponse: e['ai_response']);
                  showSnack(context, 'Updated');
                  setState(() => editing = false);
                  load();
                },
                child: const Text('Save'),
              ),
            const SizedBox(width: 8),
            if (editing) OutlinedButton(onPressed: () => setState(() => editing = false), child: const Text('Cancel')),
            const Spacer(),
            OutlinedButton(onPressed: () async { final app = context.read<AppState>(); try { AppLog.add('EntryDetail: reanalyzeMetadata id=${e['id']}'); final r = await app.api!.reanalyzeMetadata(e['id'] as int); setState(() => entry = r); showSnack(context, 'Tags/Emotions updated'); } catch (err) { AppLog.add('EntryDetail: reanalyzeMetadata ERROR $err'); showSnack(context, 'Reanalyze failed: $err'); } }, child: const Text('Reanalyze Tags/Emotions')),
          ]),
          const SizedBox(height: 8),
          Row(children: [
            OutlinedButton(onPressed: () async { final app = context.read<AppState>(); try { AppLog.add('EntryDetail: reanalyzeAI id=${e['id']}'); final r = await app.api!.reanalyzeAI(e['id'] as int); setState(() => entry = r); showSnack(context, 'AI analysis updated'); } catch (err) { AppLog.add('EntryDetail: reanalyzeAI ERROR $err'); showSnack(context, 'Reanalyze failed: $err'); } }, child: const Text('Reanalyze AI')),
          ])
        ]),
      ),
    );
  }
}

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});
  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  List<dynamic> entries = [];
  DateTime focusedDay = DateTime.now();
  DateTime? selectedDay;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final sp = await SharedPreferences.getInstance();
      final dateStr = sp.getString('pending_calendar_date');
      if (dateStr != null && dateStr.isNotEmpty) {
        try {
          final d = DateTime.parse(dateStr).toLocal();
          setState(() { focusedDay = d; selectedDay = d; });
          await sp.remove('pending_calendar_date');
        } catch (_) {}
      }
      await load();
    });
  }

  Future<void> load() async {
    final app = context.read<AppState>();
    if (app.api == null) return;
    final list = await app.api!.listEntries();
    setState(() => entries = list);
  }

  List<dynamic> entriesForDay(DateTime day) {
    final target = DateTime(day.year, day.month, day.day);
    return entries.where((e) {
      try {
        final parsed = DateTime.parse(e['created_at']).toLocal();
        final localDate = DateTime(parsed.year, parsed.month, parsed.day);
        return localDate == target;
      } catch (_) {
        return false;
      }
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Calendar')),
      body: Column(children: [
        TableCalendar(
          firstDay: DateTime.utc(2010, 1, 1),
          lastDay: DateTime.utc(2100, 12, 31),
          focusedDay: focusedDay,
          selectedDayPredicate: (d) => isSameDay(selectedDay, d),
          onDaySelected: (s, f) => setState(() { selectedDay = s; focusedDay = f; }),
          eventLoader: (d) => entriesForDay(d),
          calendarStyle: const CalendarStyle(markerDecoration: BoxDecoration(color: Colors.lightBlueAccent, shape: BoxShape.circle)),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: ListView(
            children: entriesForDay(selectedDay ?? DateTime.now()).map((e) => ListTile(
              title: Text(e['title'] ?? 'Untitled Entry'),
              subtitle: Text((e['content'] as String).length > 140 ? (e['content'] as String).substring(0, 140) + '…' : e['content'] as String),
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => EntryDetailScreen(entryId: e['id'] as int))),
            )).toList(),
          ),
        )
      ]),
    );
  }
}

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});
  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  Map<String, dynamic>? settings;
  bool loading = true;
  bool reminderEnabled = false;
  TimeOfDay reminderTime = const TimeOfDay(hour: 20, minute: 0);

  Duration _computeInitialDelay(TimeOfDay t) {
    final now = DateTime.now();
    final next = DateTime(now.year, now.month, now.day, t.hour, t.minute);
    final target = next.isAfter(now) ? next : next.add(const Duration(days: 1));
    return target.difference(now);
  }

  Future<void> load() async {
    final app = context.read<AppState>();
    try { AppLog.add('Settings: getSettings');
    final data = await app.api!.getSettings();
    final sp = await SharedPreferences.getInstance();
    reminderEnabled = sp.getBool('reminder_enabled') ?? false;
    final hm = sp.getString('reminder_time') ?? '20:00';
    final parts = hm.split(':');
    if (parts.length == 2) {
      final h = int.tryParse(parts[0]) ?? 20; final m = int.tryParse(parts[1]) ?? 0;
      reminderTime = TimeOfDay(hour: h, minute: m);
    }
    setState(() { settings = data; loading = false; });
    // Ensure periodic work is registered if enabled
    if (reminderEnabled) {
      try {
        final delay = _computeInitialDelay(reminderTime);
        await Workmanager().registerPeriodicTask(
          'daily_nudge_task',
          'nudge',
          frequency: const Duration(hours: 24),
          initialDelay: delay,
          existingWorkPolicy: ExistingPeriodicWorkPolicy.update,
          inputData: {
            'baseUrl': app.baseUrl,
            'trust': app.trustSelfSigned,
          },
        );
        AppLog.add('Settings: ensured periodic BG registered on load; delay=${delay.inMinutes}m');
      } catch (e) {
        AppLog.add('Settings: ensure periodic BG ERROR $e');
      }
    }
    } catch (e) { AppLog.add('Settings: getSettings ERROR $e'); if (mounted) { setState(() { loading = false; }); showSnack(context, 'Failed to load settings: $e'); } }
  }

  Future<void> save() async {
    final app = context.read<AppState>();
    try { AppLog.add('Settings: saveSettings');
    final updated = await app.api!.saveSettings(settings!);
    showSnack(context, 'Settings saved');
    setState(() { settings = updated['settings'] ?? settings; });
    } catch (e) { AppLog.add('Settings: saveSettings ERROR $e'); showSnack(context, 'Failed to save: $e'); }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => load());
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    final s = settings!;
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: ListView(children: [
          Card(
            child: SwitchListTile(
              value: s['email_enabled'] == true,
              onChanged: (v) => setState(() => s['email_enabled'] = v),
              title: const Text('Enable weekly email summaries'),
              subtitle: const Text('Send an email digest of your entries once a week'),
            ),
          ),
          const SizedBox(height: 8),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            child: s['email_enabled'] == true
                ? Card(
                    key: const ValueKey('smtp'),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Text('Email (SMTP) Settings', style: TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        TextField(decoration: const InputDecoration(labelText: 'SMTP Host'), controller: TextEditingController(text: s['smtp_host'] ?? '')..selection = TextSelection.collapsed(offset: (s['smtp_host'] ?? '').toString().length), onChanged: (v) => s['smtp_host'] = v),
                        const SizedBox(height: 8),
                        TextField(decoration: const InputDecoration(labelText: 'SMTP Port'), keyboardType: TextInputType.number, controller: TextEditingController(text: (s['smtp_port'] ?? '').toString())..selection = TextSelection.collapsed(offset: (s['smtp_port'] ?? '').toString().length), onChanged: (v) => s['smtp_port'] = int.tryParse(v) ?? s['smtp_port']),
                        const SizedBox(height: 8),
                        TextField(decoration: const InputDecoration(labelText: 'SMTP Username'), controller: TextEditingController(text: s['smtp_username'] ?? '')..selection = TextSelection.collapsed(offset: (s['smtp_username'] ?? '').toString().length), onChanged: (v) => s['smtp_username'] = v),
                        const SizedBox(height: 8),
                        TextField(decoration: const InputDecoration(labelText: 'SMTP Password'), obscureText: true, controller: TextEditingController(text: s['smtp_password'] ?? '')..selection = TextSelection.collapsed(offset: (s['smtp_password'] ?? '').toString().length), onChanged: (v) => s['smtp_password'] = v),
                        const SizedBox(height: 8),
                        TextField(decoration: const InputDecoration(labelText: 'From Email'), controller: TextEditingController(text: s['smtp_from_email'] ?? '')..selection = TextSelection.collapsed(offset: (s['smtp_from_email'] ?? '').toString().length), onChanged: (v) => s['smtp_from_email'] = v),
                        const SizedBox(height: 8),
                        TextField(decoration: const InputDecoration(labelText: 'Recipient Email'), controller: TextEditingController(text: s['recipient_email'] ?? '')..selection = TextSelection.collapsed(offset: (s['recipient_email'] ?? '').toString().length), onChanged: (v) => s['recipient_email'] = v),
                        const SizedBox(height: 12),
                        Row(children: [
                          ElevatedButton(onPressed: save, child: const Text('Save Settings')),
                          const SizedBox(width: 8),
                          OutlinedButton(onPressed: () async { final app = context.read<AppState>(); try { AppLog.add('Settings: testEmail'); await app.api!.testEmail(); showSnack(context, 'Test email sent'); } catch (e) { AppLog.add('Settings: testEmail ERROR $e'); showSnack(context, 'Failed: $e'); } }, child: const Text('Send Test Email')),
                          const SizedBox(width: 8),
                          OutlinedButton(onPressed: () async { final app = context.read<AppState>(); try { AppLog.add('Settings: sendSummary'); final r = await app.api!.sendSummary(); showSnack(context, r['success'] == true ? 'Weekly summary sent' : (r['message'] ?? 'Sent')); } catch (e) { AppLog.add('Settings: sendSummary ERROR $e'); showSnack(context, 'Failed: $e'); } }, child: const Text('Send Weekly Summary Now')),
                        ]),
                      ]),
                    ),
                  )
                : const SizedBox.shrink(),
          ),
          const SizedBox(height: 8),
          Card(
            child: Column(children: [
              const ListTile(
                leading: Icon(Icons.alarm),
                title: Text('Daily Reminder'),
                subtitle: Text('Get a push notification to nudge journaling'),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
                  Text('Note: On Android 12+ you must allow "Alarms & reminders" in system settings for exact schedules.'),
                ]),
              ),
              Padding(
                padding: const EdgeInsets.only(left: 16, right: 16, top: 8),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.alarm_on_outlined),
                    label: const Text('Open exact alarm settings'),
                    onPressed: () async {
                      try {
                        final info = await PackageInfo.fromPlatform();
                        final pkg = info.packageName;
                        final intent = AndroidIntent(
                          action: 'android.settings.REQUEST_SCHEDULE_EXACT_ALARM',
                          data: 'package:$pkg',
                        );
                        AppLog.add('Settings: opening exact alarm settings for $pkg');
                        await intent.launch();
                      } catch (e) {
                        AppLog.add('Settings: open exact alarm settings ERROR $e');
                        if (!mounted) return;
                        showSnack(context, 'Could not open alarm settings');
                      }
                    },
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(left: 16, right: 16, top: 8),
                child: Row(children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.notifications_outlined),
                      label: const Text('Open app notification settings'),
                      onPressed: () async {
                        try {
                          final info = await PackageInfo.fromPlatform();
                          final pkg = info.packageName;
                          final intent = AndroidIntent(
                            action: 'android.settings.APP_NOTIFICATION_SETTINGS',
                            arguments: <String, dynamic>{
                              'android.provider.extra.APP_PACKAGE': pkg,
                            },
                          );
                          AppLog.add('Settings: opening app notification settings for $pkg');
                          await intent.launch();
                        } catch (e) {
                          AppLog.add('Settings: open app notification settings ERROR $e');
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.battery_saver),
                      label: const Text('Open battery optimizations'),
                      onPressed: () async {
                        try {
                          // General settings page
                          final intent = AndroidIntent(
                            action: 'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS',
                          );
                          AppLog.add('Settings: opening battery optimization settings');
                          await intent.launch();
                        } catch (e) {
                          AppLog.add('Settings: open battery optimization settings ERROR $e');
                        }
                      },
                    ),
                  ),
                ]),
              ),
              Padding(
                padding: const EdgeInsets.only(left: 16, right: 16, top: 8),
                child: Row(children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.check_circle_outline),
                      label: const Text('Check Notification Status'),
                      onPressed: () async {
                        final status = await Notifier.debugStatus();
                        AppLog.add('Settings: debugStatus $status');
                        if (!mounted) return;
                        showSnack(context, 'Enabled: ${status['enabled'] ?? 'unknown'}, pending: ${status['pending_count']}');
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.lock_open),
                      label: const Text('Request Permission'),
                      onPressed: () async {
                        // Re-run init to trigger permission flow; also logs status
                        await Notifier.init(onSelect: (_){});
                        if (!mounted) return;
                        showSnack(context, 'Permission flow attempted; check system prompt');
                      },
                    ),
                  ),
                ]),
              ),
              // Removed legacy local scheduling buttons; switching fully to compat BG
              Padding(
                padding: const EdgeInsets.only(left: 16, right: 16, top: 8),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.timer_rounded),
                    label: const Text('Compat: schedule 1 min (BG)'),
                    onPressed: () async {
                      try {
                        final app = context.read<AppState>();
                        await Workmanager().registerOneOffTask(
                          'nudge_test_1m',
                          'nudge',
                          initialDelay: const Duration(minutes: 1),
                          inputData: {
                            'baseUrl': app.baseUrl,
                            'trust': app.trustSelfSigned,
                          },
                        );
                        AppLog.add('Compat: scheduled BG one-off');
                        if (!mounted) return;
                        showSnack(context, 'Compat BG scheduled for ~1 min');
                      } catch (e) {
                        AppLog.add('Compat: schedule BG ERROR $e');
                        if (!mounted) return;
                        showSnack(context, 'Compat scheduling failed: $e');
                      }
                    },
                  ),
                ),
              ),
              SwitchListTile(
                value: reminderEnabled,
                onChanged: (v) async {
                  AppLog.add('Settings: toggle reminder to $v');
                  setState(() => reminderEnabled = v);
                  final sp = await SharedPreferences.getInstance();
                  await sp.setBool('reminder_enabled', reminderEnabled);
                  if (reminderEnabled) {
                    try {
                      final delay = _computeInitialDelay(reminderTime);
                      final app = context.read<AppState>();
                      await Workmanager().registerPeriodicTask(
                        'daily_nudge_task',
                        'nudge',
                        frequency: const Duration(hours: 24),
                        initialDelay: delay,
                        existingWorkPolicy: ExistingPeriodicWorkPolicy.update,
                        inputData: {
                          'baseUrl': app.baseUrl,
                          'trust': app.trustSelfSigned,
                        },
                      );
                      AppLog.add('Settings: registered periodic BG with delay=${delay.inMinutes}m');
                    } catch (e) {
                      AppLog.add('Settings: register periodic BG ERROR $e');
                    }
                    showSnack(context, 'Daily reminder scheduled (compat)');
                  } else {
                    try { await Workmanager().cancelByUniqueName('daily_nudge_task'); AppLog.add('Settings: canceled periodic BG'); } catch (e) { AppLog.add('Settings: cancel periodic BG ERROR $e'); }
                    showSnack(context, 'Daily reminder disabled');
                  }
                },
                title: const Text('Enable daily journaling reminder'),
              ),
              if (reminderEnabled) Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Builder(builder: (context) {
                  final delay = _computeInitialDelay(reminderTime);
                  final next = DateTime.now().add(delay);
                  final fmt = DateFormat('EEE, MMM d h:mm a');
                  final hours = delay.inHours;
                  final mins = delay.inMinutes % 60;
                  return Text('Next run: ${fmt.format(next)} (~in ${hours}h ${mins}m)');
                }),
              ),
              ListTile(
                leading: const Icon(Icons.schedule),
                title: const Text('Reminder time'),
                subtitle: Text(reminderTime.format(context)),
                onTap: () async {
                  AppLog.add('Settings: pick reminder time');
                  final picked = await showTimePicker(context: context, initialTime: reminderTime);
                  if (picked != null) {
                    AppLog.add('Settings: picked time ${picked.hour}:${picked.minute}');
                    setState(() => reminderTime = picked);
                    final sp = await SharedPreferences.getInstance();
                    await sp.setString('reminder_time', '${picked.hour.toString().padLeft(2,'0')}:${picked.minute.toString().padLeft(2,'0')}');
                    if (reminderEnabled) {
                      try {
                        await Workmanager().cancelByUniqueName('daily_nudge_task');
                      } catch (_) {}
                      try {
                        final delay = _computeInitialDelay(reminderTime);
                        final app = context.read<AppState>();
                        await Workmanager().registerPeriodicTask(
                          'daily_nudge_task',
                          'nudge',
                          frequency: const Duration(hours: 24),
                          initialDelay: delay,
                          existingWorkPolicy: ExistingPeriodicWorkPolicy.update,
                          inputData: {
                            'baseUrl': app.baseUrl,
                            'trust': app.trustSelfSigned,
                          },
                        );
                        AppLog.add('Settings: rescheduled periodic BG with delay=${delay.inMinutes}m');
                      } catch (e) {
                        AppLog.add('Settings: reschedule periodic BG ERROR $e');
                      }
                      showSnack(context, 'Daily reminder updated (compat)');
                    }
                  }
                },
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.notifications_active_outlined),
                    onPressed: () async {
                      await Notifier.showTestReminderNow();
                      if (!mounted) return;
                      showSnack(context, 'Test reminder sent');
                    },
                    label: const Text('Send Test Reminder Now'),
                  ),
                ),
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}
class NotificationCenterPage extends StatefulWidget {
  const NotificationCenterPage({super.key});
  @override
  State<NotificationCenterPage> createState() => _NotificationCenterPageState();
}

class _NotificationCenterPageState extends State<NotificationCenterPage> {
  List<Map<String, dynamic>> items = [];
  bool loading = true;

  Future<void> load() async {
    setState(() { loading = true; });
    try {
      final list = await NotifyHistory.list();
      setState(() { items = list; });
    } finally {
      setState(() { loading = false; });
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => load());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications'), actions: [
        IconButton(
          icon: const Icon(Icons.delete_sweep_outlined),
          tooltip: 'Dismiss all system notifications',
          onPressed: () async {
            try { await FlutterLocalNotificationsPlugin().cancelAll(); } catch (_) {}
            showSnack(context, 'System notifications dismissed');
          },
        ),
        IconButton(
          icon: const Icon(Icons.clear_all),
          tooltip: 'Clear history',
          onPressed: () async {
            await NotifyHistory.clear();
            await load();
            showSnack(context, 'History cleared');
          },
        ),
      ]),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : items.isEmpty
              ? const Center(child: Text('No notifications yet'))
              : ListView.builder(
                  itemCount: items.length,
                  itemBuilder: (ctx, i) {
                    final e = items[i];
                    final dt = DateTime.tryParse(e['ts'] ?? '')?.toLocal();
                    final when = dt != null ? DateFormat('MMM d, h:mm a').format(dt) : '';
                    final ok = e['success'] == true;
                    final src = (e['source'] ?? '').toString();
                    return Card(
                      child: ListTile(
                        leading: Icon(ok ? Icons.check_circle : Icons.error_outline, color: ok ? Colors.lightGreenAccent : Colors.redAccent),
                        title: Text(e['title'] ?? ''),
                        subtitle: Text('${e['body'] ?? ''}\n$when • $src'),
                        isThreeLine: true,
                      ),
                    );
                  },
                ),
    );
  }
}
