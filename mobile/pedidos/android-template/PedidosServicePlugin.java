package br.com.mostralo.pedidos;

import android.Manifest;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Liga/desliga o serviço de segundo plano e mostra a notificação de pedido novo. */
@CapacitorPlugin(name = "PedidosService")
public class PedidosServicePlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        Context ctx = getContext();
        Intent i = new Intent(ctx, PedidosService.class);
        i.putExtra("store", call.getString("store", ""));
        try {
            ContextCompat.startForegroundService(ctx, i);
            call.resolve();
        } catch (Exception e) {
            call.reject("Não deu para ligar o segundo plano: " + e.getMessage());
        }
    }

    /** Guarda o que o serviço precisa para conferir pedidos com o app fechado. */
    @PluginMethod
    public void configure(PluginCall call) {
        getContext().getSharedPreferences(PedidosService.PREFS, Context.MODE_PRIVATE).edit()
            .putString("url", call.getString("url"))
            .putString("anon", call.getString("anonKey"))
            .putString("key", call.getString("deviceKey"))
            .putString("store", call.getString("store", ""))
            .apply();
        call.resolve();
    }

    /** Pode reabrir o app sozinho? (permissão "Sobrepor a outros apps") */
    @PluginMethod
    public void canReopen(PluginCall call) {
        JSObject r = new JSObject();
        r.put("allowed", Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(getContext()));
        call.resolve(r);
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        Context ctx = getContext();
        try {
            Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + ctx.getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    /** "Estou viva": a página confere pedidos; o serviço só assume se isso parar. */
    @PluginMethod
    public void heartbeat(PluginCall call) {
        PedidosService.lastHeartbeat = System.currentTimeMillis();
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), PedidosService.class));
        call.resolve();
    }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject r = new JSObject();
        r.put("running", PedidosService.running);
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        r.put("batteryUnrestricted", pm != null && pm.isIgnoringBatteryOptimizations(getContext().getPackageName()));
        r.put("notifications", Build.VERSION.SDK_INT < 33
            || ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED);
        r.put("manufacturer", Build.MANUFACTURER);
        r.put("canReopen", Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(getContext()));
        r.put("configured", getContext().getSharedPreferences(PedidosService.PREFS, Context.MODE_PRIVATE).getString("key", null) != null);
        call.resolve(r);
    }

    /** Notificação de pedido novo (toca e vibra mesmo com a tela desligada). */
    @PluginMethod
    public void notifyOrder(PluginCall call) {
        Context ctx = getContext();
        PedidosService.createChannels(ctx);
        String title = call.getString("title", "Pedido novo");
        String text = call.getString("text", "");
        int id = Math.abs(call.getString("id", title).hashCode());
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        nm.notify(id, new NotificationCompat.Builder(ctx, PedidosService.CH_ORDERS)
            .setSmallIcon(android.R.drawable.stat_notify_more)
            .setContentTitle(title)
            .setContentText(text)
            .setAutoCancel(true)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setContentIntent(PedidosService.openApp(ctx))
            .build());
        call.resolve();
    }

    /** Abre a tela do Android para tirar o app da economia de bateria. */
    @PluginMethod
    public void openBatterySettings(PluginCall call) {
        Context ctx = getContext();
        try {
            Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + ctx.getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
}
