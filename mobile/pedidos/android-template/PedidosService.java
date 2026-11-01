package br.com.mostralo.pedidos;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;

/**
 * Mantém o Mostralo Pedidos vivo com a tela desligada (como o app do GloriaFood):
 * aviso fixo na barra + CPU acordada, para a página continuar recebendo e imprimindo pedidos.
 */
public class PedidosService extends Service {
    static final String CH_RUNNING = "mostralo_recebendo";
    static final String CH_ORDERS = "mostralo_pedidos_novos";
    static final int ID_RUNNING = 4210;
    static boolean running = false;
    private PowerManager.WakeLock wakeLock;

    static void createChannels(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        NotificationChannel run = new NotificationChannel(CH_RUNNING, "Recebendo pedidos", NotificationManager.IMPORTANCE_LOW);
        run.setDescription("Aviso fixo enquanto o app recebe e imprime pedidos");
        run.setShowBadge(false);
        nm.createNotificationChannel(run);
        NotificationChannel orders = new NotificationChannel(CH_ORDERS, "Pedidos novos", NotificationManager.IMPORTANCE_HIGH);
        orders.setDescription("Toca quando chega um pedido novo");
        Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (sound == null) sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        orders.setSound(sound, new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
        orders.enableVibration(true);
        orders.setVibrationPattern(new long[] { 0, 600, 300, 600, 300, 600 });
        nm.createNotificationChannel(orders);
    }

    static PendingIntent openApp(Context ctx) {
        Intent i = new Intent(ctx, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(ctx, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        createChannels(this);
        String store = intent != null ? intent.getStringExtra("store") : null;
        Notification n = new NotificationCompat.Builder(this, CH_RUNNING)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setContentTitle("Mostralo Pedidos")
            .setContentText(store != null && !store.isEmpty() ? store + " · recebendo e imprimindo pedidos" : "Recebendo e imprimindo pedidos")
            .setOngoing(true)
            .setContentIntent(openApp(this))
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
        try {
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(ID_RUNNING, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE);
            } else {
                startForeground(ID_RUNNING, n);
            }
        } catch (Exception e) {
            // Sem a permissão de Bluetooth (Android 14+) o sistema recusa: desliga em vez de fechar o app
            running = false;
            stopSelf();
            return START_NOT_STICKY;
        }
        if (wakeLock == null) {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "mostralo:pedidos");
            wakeLock.setReferenceCounted(false);
            wakeLock.acquire();
        }
        running = true;
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        running = false;
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        wakeLock = null;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
