package neginheal.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

final class LauncherBadgeHelper {
    private static final String NOTIFICATION_CHANNEL_ID = "negin_heal_default";
    private static final String BADGE_CHANNEL_ID = "negin_heal_badge";
    private static final String CHANNEL_NAME = "اعلان‌ها";
    private static final String BADGE_CHANNEL_NAME = "نشان اعلان";
    private static final String BADGE_NOTIFICATION_TAG = "negin-heal-badge";
    private static final int BADGE_NOTIFICATION_ID = 0x6E686261;
    private static final String APP_ORIGIN = "https://neginheal.ir";

    private LauncherBadgeHelper() {}

    static void applyCount(Context context, int count) {
        if (count <= 0) {
            NotificationManagerCompat.from(context).cancel(BADGE_NOTIFICATION_TAG, BADGE_NOTIFICATION_ID);
            return;
        }

        ensureBadgeChannel(context);

        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setAction(Intent.ACTION_VIEW);
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        launchIntent.setData(Uri.parse(APP_ORIGIN + "/notifications"));

        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            BADGE_NOTIFICATION_ID,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, BADGE_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification_icon)
            .setContentTitle("نگین هیل")
            .setContentText("اعلان‌های خوانده‌نشده")
            .setNumber(count)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setCategory(NotificationCompat.CATEGORY_STATUS)
            .setAutoCancel(false)
            .setContentIntent(pendingIntent);

        NotificationManagerCompat.from(context).notify(BADGE_NOTIFICATION_TAG, BADGE_NOTIFICATION_ID, builder.build());
    }

    static void showNotification(
        Context context,
        String title,
        String body,
        String url,
        String tag
    ) {
        ensureNotificationChannel(context);

        String resolvedTitle = "نگین هیل";
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
        launchIntent.setData(Uri.parse(resolvedUrl));

        int requestCode = resolvedTag.hashCode();
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            requestCode,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, NOTIFICATION_CHANNEL_ID)
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

        NotificationChannel existingChannel = notificationManager.getNotificationChannel(NOTIFICATION_CHANNEL_ID);
        if (existingChannel != null) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
            NOTIFICATION_CHANNEL_ID,
            CHANNEL_NAME,
            NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setShowBadge(true);
        notificationManager.createNotificationChannel(channel);
    }

    private static void ensureBadgeChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
        if (notificationManager == null) {
            return;
        }

        NotificationChannel existingChannel = notificationManager.getNotificationChannel(BADGE_CHANNEL_ID);
        if (existingChannel != null) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
            BADGE_CHANNEL_ID,
            BADGE_CHANNEL_NAME,
            NotificationManager.IMPORTANCE_MIN
        );
        channel.setShowBadge(true);
        channel.enableVibration(false);
        channel.setSound(null, null);
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
