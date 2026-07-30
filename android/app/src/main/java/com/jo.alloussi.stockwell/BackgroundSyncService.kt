package jo.alloussi.stockwell

import android.content.Intent
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

/**
 * Best-effort background sync trigger (ADR-M008).
 * Schedule via WorkManager / Alarm only when product policy allows — not enabled by default.
 */
class BackgroundSyncService : HeadlessJsTaskService() {
  override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
    val data = intent?.extras?.let { Arguments.fromBundle(it) } ?: Arguments.createMap()
    return HeadlessJsTaskConfig(
      "StockwellBackgroundSync",
      data,
      60_000,
      true,
    )
  }
}
