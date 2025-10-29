package com.example.journal_ai_mobile

import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import java.security.SecureRandom
import java.security.cert.X509Certificate
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager

class HistoryWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory = Factory(applicationContext)

    class Factory(private val ctx: Context) : RemoteViewsService.RemoteViewsFactory {
        data class Entry(val id: Int, val title: String, val content: String, val createdAt: String)
        private val items = mutableListOf<Entry>()

        override fun onCreate() {}
        override fun onDestroy() { items.clear() }

        override fun onDataSetChanged() {
            items.clear()
            try {
                val prefs = ctx.getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
                val baseUrl = prefs.getString("flutter.baseUrl", "") ?: ""
                val trust = prefs.getBoolean("flutter.trustSelfSigned", false)
                if (baseUrl.isBlank()) return
                val client = if (trust) buildTrustAllClient() else OkHttpClient()
                val req = Request.Builder().url(baseUrl.trimEnd('/') + "/api/entries").build()
                val resp = client.newCall(req).execute()
                if (!resp.isSuccessful) return
                val arr = JSONArray(resp.body?.string() ?: "[]")
                for (i in 0 until Math.min(arr.length(), 20)) {
                    val e = arr.getJSONObject(i)
                    val id = e.optInt("id")
                    val title = e.optString("title", "Untitled Entry")
                    val content = e.optString("content", "")
                    val created = e.optString("created_at", "")
                    items.add(Entry(id, title, content, created))
                }
            } catch (_: Exception) {}
        }

        override fun getCount(): Int = items.size
        override fun getViewTypeCount(): Int = 1
        override fun hasStableIds(): Boolean = true
        override fun getItemId(position: Int): Long = items.getOrNull(position)?.id?.toLong() ?: position.toLong()
        override fun getLoadingView(): RemoteViews? = null

        override fun getViewAt(position: Int): RemoteViews? {
            if (position < 0 || position >= items.size) return null
            val e = items[position]
            val rv = RemoteViews(ctx.packageName, R.layout.widget_history_item)
            rv.setTextViewText(R.id.item_title, e.title)
            val sub = if (e.content.length > 80) e.content.substring(0, 80) + "…" else e.content
            rv.setTextViewText(R.id.item_sub, sub)
            val ts = formatTimestamp(e.createdAt)
            rv.setTextViewText(R.id.item_time, ts)
            val fill = Intent().apply {
                data = android.net.Uri.parse("journalai://app/entry?id=${e.id}")
            }
            rv.setOnClickFillInIntent(R.id.item_title, fill)
            rv.setOnClickFillInIntent(R.id.item_sub, fill)
            return rv
        }

        private fun formatTimestamp(created: String): String {
            return try {
                var s = created
                // Normalize offset +HHmm to +HH:mm if necessary
                val m = Regex("[+-]\\d{4}").find(s)
                if (m != null) {
                    val off = m.value
                    s = s.replace(off, off.substring(0,3) + ":" + off.substring(3))
                }
                val instant = java.time.OffsetDateTime.parse(s).toInstant()
                val dt = java.time.ZonedDateTime.ofInstant(instant, java.time.ZoneId.systemDefault())
                val fmt = java.time.format.DateTimeFormatter.ofPattern("MMM d, h:mm a")
                dt.format(fmt)
            } catch (_: Exception) {
                created.take(16)
            }
        }

        private fun buildTrustAllClient(): OkHttpClient {
            val trustAll = arrayOf<TrustManager>(object : X509TrustManager {
                override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
                override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
                override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
            })
            val ssl = SSLContext.getInstance("SSL").apply { init(null, trustAll, SecureRandom()) }
            return OkHttpClient.Builder().sslSocketFactory(ssl.socketFactory, trustAll[0] as X509TrustManager).hostnameVerifier { _, _ -> true }.build()
        }
    }
}
