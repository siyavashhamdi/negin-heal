package neginheal.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import me.leolin.shortcutbadger.ShortcutBadger;

final class LauncherBadgeHelper {
    private static final String CHANNEL_ID = "negin_heal_default";
    private static final String CHANNEL_NAME = "اعلان‌ها";
    private static final String APP_ORIGIN = "https://neginheal.ir";

    private LauncherBadgeHelper() {}

    static void applyCount(Context context, int count) {
        if (count <= 0) {
            ShortcutBadger.removeCount(context);
            return;
        }

        ShortcutBadger.applyCount(context, count);
    }

    static void showNotification(
        Context context,
        String title,
        String body,
        String url,
        String tag
    ) {
        ensureNotificationChannel(context);

        String resolvedTitle =
            title == null || title.trim().isEmpty() ? "نگین هیل" : title.trim();
        String resolvedBody =
            body == null || body.trim().isEmpty()
                ? "اعلان جدیدی برای شما ثبت شد."
                : body.trim();
        String resolvedUrl = resolveAbsoluteUrl(url);
        String resolvedTag =
            tag == null || tag.trim().isEmpty() ? "negin-heal-push" : tag.trim();

        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setAction(Intent.ACTION_VIEW);
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        launchIntent.putExtra("url", resolvedUrl);

        int requestCode = resolvedTag.hashCode();
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            requestCode,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification_icon)
            .setContentTitle(resolvedTitle)
            .setContentText(resolvedBody)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(resolvedBody))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent);

        NotificationManagerCompat.from(context).notify(resolvedTag, requestCode, builder.build());
    }

    private static void ensureNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
        if (notificationManager == null) {
            return;
        }

        NotificationChannel existingChannel = notificationManager.getNotificationChannel(CHANNEL_ID);
        if (existingChannel != null) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            CHANNEL_NAME,
            NotificationManager.IMPORTANCE_DEFAULT
        );
        notificationManager.createNotificationChannel(channel);
    }

    private static String resolveAbsoluteUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return APP_ORIGIN + "/notifications";
        }

        String trimmed = url.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }

        if (!trimmed.startsWith("/")) {
            trimmed = "/" + trimmed;
        }

        return APP_ORIGIN + trimmed;
    }
}
