package neginheal.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LauncherBadge")
public class LauncherBadgePlugin extends Plugin {
    @PluginMethod
    public void setCount(PluginCall call) {
        Integer count = call.getInt("count", 0);
        LauncherBadgeHelper.applyCount(getContext(), Math.max(0, count));
        call.resolve();
    }

    @PluginMethod
    public void clear(PluginCall call) {
        LauncherBadgeHelper.applyCount(getContext(), 0);
        call.resolve();
    }

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject result = new JSObject();
        result.put("supported", true);
        call.resolve(result);
    }
}
