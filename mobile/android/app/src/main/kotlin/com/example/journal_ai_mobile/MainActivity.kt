package com.example.journal_ai_mobile

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity

class MainActivity: FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleDeepLink(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleDeepLink(intent)
    }

    private fun handleDeepLink(intent: Intent?) {
        if (intent == null) return
        if (Intent.ACTION_VIEW == intent.action) {
            val uri: Uri? = intent.data
            val prefs = getSharedPreferences("FlutterSharedPreferences", MODE_PRIVATE)
            if (uri != null) {
                when (uri.path) {
                    "/new" -> {
                        prefs.edit()
                            .putBoolean("flutter.pending_open_home", true)
                            .apply()
                    }
                    "/jot" -> {
                        prefs.edit()
                            .putBoolean("flutter.pending_open_home", true)
                            .putBoolean("flutter.pending_quick_jot", true)
                            .apply()
                    }
                    "/history" -> {
                        prefs.edit()
                            .putInt("flutter.pending_open_tab", 1)
                            .apply()
                    }
                    "/calendar" -> {
                        prefs.edit()
                            .putInt("flutter.pending_open_tab", 2)
                            .putString("flutter.pending_calendar_date", uri.getQueryParameter("date"))
                            .apply()
                    }
                    "/entry" -> {
                        val id = uri.getQueryParameter("id")?.toIntOrNull()
                        if (id != null) {
                            prefs.edit()
                                .putInt("flutter.pending_open_tab", 1)
                                .putInt("flutter.pending_open_entry", id)
                                .apply()
                        }
                    }
                }
            }
        }
    }
}
