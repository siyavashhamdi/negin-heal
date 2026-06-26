package neginheal.app;

import androidx.annotation.NonNull;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class NeginHealFirebaseMessagingService extends MessagingService {
    private static final String MESSAGE_TYPE_BADGE_SYNC = "badge_sync";
    private static final String MESSAGE_TYPE_NOTIFICATION = "notification";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        if (data == null || data.isEmpty()) {
            super.onMessageReceived(remoteMessage);
            return;
        }

        if (data.containsKey("badgeCount")) {
            try {
                int badgeCount = Integer.parseInt(data.get("badgeCount"));
                LauncherBadgeHelper.applyCount(getApplicationContext(), badgeCount);
            } catch (NumberFormatException ignored) {
                // Ignore malformed badge counts.
            }
        }

        String messageType = data.get("type");
        if (MESSAGE_TYPE_BADGE_SYNC.equals(messageType)) {
            return;
        }

        if (MESSAGE_TYPE_NOTIFICATION.equals(messageType)) {
            LauncherBadgeHelper.showNotification(
                getApplicationContext(),
                data.get("title"),
                data.get("body"),
                data.get("url"),
                data.get("tag")
            );
        }

        super.onMessageReceived(remoteMessage);
    }
}
