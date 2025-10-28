import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:fluttertoast/fluttertoast.dart';

import 'api_client.dart';

void main() {
  runApp(const JournalMobileApp());
}

class AppState extends ChangeNotifier {
  String baseUrl = '';
  bool trustSelfSigned = false;
  ApiClient? api;

  Future<void> load() async {
    final sp = await SharedPreferences.getInstance();
    baseUrl = sp.getString('baseUrl') ?? '';
    trustSelfSigned = sp.getBool('trustSelfSigned') ?? false;
    if (baseUrl.isNotEmpty) {
      api = ApiClient(baseUrl: baseUrl, trustSelfSigned: trustSelfSigned);
    }
    notifyListeners();
  }

  Future<void> save(String url, bool trust) async {
    final sp = await SharedPreferences.getInstance();
    baseUrl = url.trim().replaceAll(RegExp(r'/+
'), '');
    trustSelfSigned = trust;
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
        theme: ThemeData.dark().copyWith(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blueAccent, brightness: Brightness.dark),
          useMaterial3: true,
        ),
        home: const RootRouter(),
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
  final pages = const [HomePage(), HistoryPage(), CalendarScreen(), SettingsPage(), ServerPage()];
  final items = const [
    BottomNavigationBarItem(icon: Icon(Icons.edit), label: 'Home'),
    BottomNavigationBarItem(icon: Icon(Icons.history), label: 'History'),
    BottomNavigationBarItem(icon: Icon(Icons.calendar_today), label: 'Calendar'),
    BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
    BottomNavigationBarItem(icon: Icon(Icons.cloud), label: 'Server'),
  ];
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
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Base URL (e.g., https://192.168.1.10)', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextField(controller: controller, decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'https://<host>')),
          Row(children: [
            Switch(value: trust, onChanged: (v) => setState(() => trust = v)),
            const Text('Trust self‑signed certificate (dev)')
          ]),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: () async {
              if (controller.text.trim().isEmpty) return;
              await app.save(controller.text.trim(), trust);
              try {
                await app.api!.health();
                Fluttertoast.showToast(msg: 'Connected');
              } catch (e) {
                Fluttertoast.showToast(msg: 'Saved, but health check failed');
              }
              if (context.mounted) Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const MainNav()));
            },
            child: const Text('Save & Connect'),
          ),
          if (app.baseUrl.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 16), child: Text('Current: ${app.baseUrl}')),
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

  Future<void> save() async {
    final app = context.read<AppState>();
    if (app.api == null) return;
    if (contentCtrl.text.trim().isEmpty) {
      Fluttertoast.showToast(msg: 'Content is required');
      return;
    }
    setState(() => saving = true);
    try {
      await app.api!.createEntry(title: titleCtrl.text.trim().isEmpty ? 'Untitled Entry' : titleCtrl.text.trim(), content: contentCtrl.text.trim());
      titleCtrl.clear();
      contentCtrl.clear();
      Fluttertoast.showToast(msg: 'Saved');
    } catch (e) {
      Fluttertoast.showToast(msg: 'Failed to save');
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
          TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Title')),
          const SizedBox(height: 8),
          TextField(controller: contentCtrl, maxLines: 10, decoration: const InputDecoration(labelText: 'Your Thoughts *')),
          const SizedBox(height: 12),
          Row(children: [
            ElevatedButton(onPressed: saving ? null : save, child: Text(saving ? 'Saving…' : 'Save')),
            const SizedBox(width: 8),
            OutlinedButton(onPressed: () { titleCtrl.clear(); contentCtrl.clear(); }, child: const Text('Clear')),
          ])
        ]),
      ),
    );
  }
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
      final list = await app.api!.listEntries();
      setState(() => entries = list);
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
                      return Card(
                        child: ListTile(
                          title: Text(e['title'] ?? 'Untitled Entry'),
                          subtitle: Text((e['content'] as String).length > 140 ? (e['content'] as String).substring(0, 140) + '…' : e['content'] as String),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () async {
                            await Navigator.of(context).push(MaterialPageRoute(builder: (_) => EntryDetailScreen(entryId: e['id'] as int)));
                            if (mounted) load();
                          },
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
                  await app.api!.updateEntry(id: e['id'] as int, title: titleCtrl.text, content: contentCtrl.text, aiResponse: e['ai_response']);
                  Fluttertoast.showToast(msg: 'Updated');
                  setState(() => editing = false);
                  load();
                },
                child: const Text('Save'),
              ),
            const SizedBox(width: 8),
            if (editing) OutlinedButton(onPressed: () => setState(() => editing = false), child: const Text('Cancel')),
            const Spacer(),
            OutlinedButton(onPressed: () async { final app = context.read<AppState>(); final r = await app.api!.reanalyzeMetadata(e['id'] as int); setState(() => entry = r); Fluttertoast.showToast(msg: 'Tags/Emotions updated'); }, child: const Text('Reanalyze Tags/Emotions')),
          ]),
          const SizedBox(height: 8),
          Row(children: [
            OutlinedButton(onPressed: () async { final app = context.read<AppState>(); final r = await app.api!.reanalyzeAI(e['id'] as int); setState(() => entry = r); Fluttertoast.showToast(msg: 'AI analysis updated'); }, child: const Text('Reanalyze AI')),
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
    WidgetsBinding.instance.addPostFrameCallback((_) => load());
  }

  Future<void> load() async {
    final app = context.read<AppState>();
    if (app.api == null) return;
    final list = await app.api!.listEntries();
    setState(() => entries = list);
  }

  List<dynamic> entriesForDay(DateTime day) {
    final ds = DateFormat('yyyy-MM-dd').format(day);
    return entries.where((e) {
      final d = DateTime.parse(e['created_at']);
      return DateFormat('yyyy-MM-dd').format(d) == ds;
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

  Future<void> load() async {
    final app = context.read<AppState>();
    final data = await app.api!.getSettings();
    setState(() { settings = data; loading = false; });
  }

  Future<void> save() async {
    final app = context.read<AppState>();
    final updated = await app.api!.saveSettings(settings!);
    Fluttertoast.showToast(msg: 'Settings saved');
    setState(() { settings = updated['settings'] ?? settings; });
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
          SwitchListTile(
            value: s['email_enabled'] == true,
            onChanged: (v) => setState(() => s['email_enabled'] = v),
            title: const Text('Enable weekly email summaries'),
          ),
          TextField(decoration: const InputDecoration(labelText: 'SMTP Host'), controller: TextEditingController(text: s['smtp_host'] ?? '')..selection = TextSelection.collapsed(offset: (s['smtp_host'] ?? '').toString().length), onChanged: (v) => s['smtp_host'] = v),
          TextField(decoration: const InputDecoration(labelText: 'SMTP Port'), keyboardType: TextInputType.number, controller: TextEditingController(text: (s['smtp_port'] ?? '').toString())..selection = TextSelection.collapsed(offset: (s['smtp_port'] ?? '').toString().length), onChanged: (v) => s['smtp_port'] = int.tryParse(v) ?? s['smtp_port']),
          TextField(decoration: const InputDecoration(labelText: 'SMTP Username'), controller: TextEditingController(text: s['smtp_username'] ?? '')..selection = TextSelection.collapsed(offset: (s['smtp_username'] ?? '').toString().length), onChanged: (v) => s['smtp_username'] = v),
          TextField(decoration: const InputDecoration(labelText: 'SMTP Password'), obscureText: true, controller: TextEditingController(text: s['smtp_password'] ?? '')..selection = TextSelection.collapsed(offset: (s['smtp_password'] ?? '').toString().length), onChanged: (v) => s['smtp_password'] = v),
          TextField(decoration: const InputDecoration(labelText: 'From Email'), controller: TextEditingController(text: s['smtp_from_email'] ?? '')..selection = TextSelection.collapsed(offset: (s['smtp_from_email'] ?? '').toString().length), onChanged: (v) => s['smtp_from_email'] = v),
          TextField(decoration: const InputDecoration(labelText: 'Recipient Email'), controller: TextEditingController(text: s['recipient_email'] ?? '')..selection = TextSelection.collapsed(offset: (s['recipient_email'] ?? '').toString().length), onChanged: (v) => s['recipient_email'] = v),
          const SizedBox(height: 12),
          Row(children: [
            ElevatedButton(onPressed: save, child: const Text('Save Settings')),
            const SizedBox(width: 8),
            OutlinedButton(onPressed: () async { final app = context.read<AppState>(); await app.api!.testEmail(); Fluttertoast.showToast(msg: 'Test email sent'); }, child: const Text('Send Test Email')),
            const SizedBox(width: 8),
            OutlinedButton(onPressed: () async { final app = context.read<AppState>(); final r = await app.api!.sendSummary(); Fluttertoast.showToast(msg: r['success'] == true ? 'Weekly summary sent' : (r['message'] ?? 'Sent')); }, child: const Text('Send Weekly Summary Now')),
          ]),
        ]),
      ),
    );
  }
}

