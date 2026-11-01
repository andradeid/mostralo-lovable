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
import android.content.SharedPreferences;
import android.provider.Settings;
import androidx.core.app.NotificationCompat;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Mantém o Mostralo Pedidos vivo com a tela desligada (como o app do GloriaFood):
 * aviso fixo na barra + CPU acordada, para a página continuar recebendo e imprimindo pedidos.
 * Com o app FECHADO (página morta), confere sozinho a cada 10 s pela função app_device_new_orders:
 * pedido novo toca o alarme e reabre o app, que imprime os pedidos que chegaram enquanto estava fechado.
 */
public class PedidosService extends Service {
    static final String CH_RUNNING = "mostralo_recebendo";
    static final String CH_ORDERS = "mostralo_pedidos_novos";
    static final int ID_RUNNING = 4210;
    static boolean running = false;
    /** Último "estou viva" da página (a cada conferência dela). */
    static volatile long lastHeartbeat = 0;
    static final String PREFS = "mostralo_pedidos";
    private PowerManager.WakeLock wakeLock;
    private ScheduledExecutorService poller;
    private final Set<String> seen = new HashSet<>();

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
        if (intent == null) MainActivity.alive = false; // reiniciado pelo sistema: a página não existe
        if (poller == null) {
            poller = Executors.newSingleThreadScheduledExecutor();
            poller.scheduleWithFixedDelay(this::pollWhileClosed, 10, 10, TimeUnit.SECONDS);
        }
        return START_STICKY;
    }

    private long lastLogAt = 0;
    private boolean loggedClosed = false;

    /** Registro no banco (mesma tabela do app), para acompanhar o serviço com o app fechado. */
    private void remoteLog(String line) {
        try {
            SharedPreferences p = getSharedPreferences(PREFS, MODE_PRIVATE);
            String url = p.getString("url", null), anon = p.getString("anon", null);
            if (url == null || anon == null) return;
            JSONObject row = new JSONObject();
            row.put("source", "servico");
            row.put("line", line);
            HttpURLConnection c = (HttpURLConnection) new URL(url + "/rest/v1/app_debug_logs").openConnection();
            c.setConnectTimeout(8000);
            c.setReadTimeout(8000);
            c.setRequestMethod("POST");
            c.setDoOutput(true);
            c.setRequestProperty("apikey", anon);
            c.setRequestProperty("Authorization", "Bearer " + anon);
            c.setRequestProperty("Content-Type", "application/json");
            c.setRequestProperty("Prefer", "return=minimal");
            try (OutputStream os = c.getOutputStream()) { os.write(row.toString().getBytes(StandardCharsets.UTF_8)); }
            c.getResponseCode();
            c.disconnect();
        } catch (Exception ignored) { }
    }

    /** App arrastado para fora dos recentes: a página morreu, o serviço assume. */
    @Override
    public void onTaskRemoved(Intent rootIntent) {
        MainActivity.alive = false;
        MainActivity.closedAt = System.currentTimeMillis();
        if (poller != null) poller.execute(() -> remoteLog("App fechado nos recentes: serviço assumiu"));
        super.onTaskRemoved(rootIntent);
    }

    /** App fechado: confere pedidos novos direto no banco; chegou pedido, avisa e reabre o app. */
    private void pollWhileClosed() {
        try {
            // O serviço é o relógio: a cada 10 s cutuca a página para conferir (o Android segura os relógios dela fora da tela)
            if (MainActivity.alive) MainActivity.pokePage();
            long nowMs = System.currentTimeMillis();
            boolean pageOk = MainActivity.alive && (lastHeartbeat == 0 || nowMs - lastHeartbeat < 30_000);
            if (pageOk) { loggedClosed = false; return; } // página viva: ela mesma confere e imprime
            boolean stalled = MainActivity.alive; // aberta, mas parada (congelada pelo sistema)
            SharedPreferences p = getSharedPreferences(PREFS, MODE_PRIVATE);
            String url = p.getString("url", null), anon = p.getString("anon", null), key = p.getString("key", null);
            if (url == null || anon == null || key == null) return;
            long now = System.currentTimeMillis();
            if (!loggedClosed || now - lastLogAt > 5 * 60_000) {
                loggedClosed = true; lastLogAt = now;
                remoteLog((stalled ? "Página parada há " + ((now - lastHeartbeat) / 1000) + " s: serviço conferindo" : "Serviço conferindo com o app fechado") + (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this) ? " (sem permissão de reabrir)" : ""));
            }
            long since = stalled && lastHeartbeat > 0 ? lastHeartbeat - 15000
                : MainActivity.closedAt > 0 ? MainActivity.closedAt - 15000 : System.currentTimeMillis() - 60000;
            JSONObject body = new JSONObject();
            body.put("p_key", key);
            body.put("p_since_epoch", since / 1000.0);
            HttpURLConnection c = (HttpURLConnection) new URL(url + "/rest/v1/rpc/app_device_new_orders").openConnection();
            c.setConnectTimeout(8000);
            c.setReadTimeout(8000);
            c.setRequestMethod("POST");
            c.setDoOutput(true);
            c.setRequestProperty("apikey", anon);
            c.setRequestProperty("Authorization", "Bearer " + anon);
            c.setRequestProperty("Content-Type", "application/json");
            try (OutputStream os = c.getOutputStream()) { os.write(body.toString().getBytes(StandardCharsets.UTF_8)); }
            if (c.getResponseCode() != 200) { c.disconnect(); return; }
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            try (InputStream is = c.getInputStream()) { byte[] b = new byte[4096]; int n; while ((n = is.read(b)) > 0) buf.write(b, 0, n); }
            c.disconnect();
            JSONArray list = new JSONArray(buf.toString("UTF-8"));
            boolean reopen = false;
            for (int i = 0; i < list.length(); i++) {
                JSONObject o = list.getJSONObject(i);
                String id = o.optString("id"), status = o.optString("status"), num = o.optString("order_number");
                boolean accepted = !"entrada".equals(status);
                boolean auto = o.optBoolean("auto_accept", false);
                String k = id + ":" + status;
                if (accepted && auto) {
                    // Aceito sozinho: o serviço imprime (a página está parada ou fechada)
                    if (isPrinted(this, id) || seen.contains(k)) continue;
                    seen.add(k);
                    String err = printNative(url, anon, key, id);
                    if (err == null) {
                        markPrinted(this, id);
                        notifyNew(id, "Pedido #" + num + " impresso", "Aceito automaticamente");
                        remoteLog("Pedido #" + num + " impresso pelo serviço" + (stalled ? " (página parada)" : " (app fechado)"));
                    } else {
                        seen.remove(k); // tenta de novo na próxima conferência
                        notifyNew(id, "Pedido #" + num + " aceito", "Não imprimiu: " + err);
                        remoteLog("Serviço não imprimiu #" + num + ": " + err);
                    }
                    continue;
                }
                if (seen.contains(k)) continue;
                seen.add(k);
                if (!accepted) {
                    notifyNew(id, "Pedido novo #" + num, "Toque para abrir e aceitar");
                    reopen = true;
                }
            }
            if (reopen) { remoteLog("Pedido novo esperando aceite: avisando e reabrindo"); reopenApp(); }
        } catch (Exception ignored) {
            // sem rede ou resposta inválida: tenta de novo em 10 s
        }
    }

    // ---------- impressão pelo serviço ----------

    /** Busca o cupom no banco, monta e manda para a impressora configurada. Devolve null se imprimiu, ou o motivo. */
    private String printNative(String url, String anon, String key, String orderId) {
        try {
            SharedPreferences p = getSharedPreferences(PREFS, MODE_PRIVATE);
            String pj = p.getString("printer", null);
            if (pj == null) return "impressora não configurada no app";
            JSONObject cfg = new JSONObject(pj);
            JSONObject printer = cfg.optJSONObject("printer");
            if (printer == null) return "impressora não escolhida";
            JSONObject body = new JSONObject();
            body.put("p_key", key);
            body.put("p_order_id", orderId);
            HttpURLConnection c = (HttpURLConnection) new URL(url + "/rest/v1/rpc/app_device_order_receipt").openConnection();
            c.setConnectTimeout(8000);
            c.setReadTimeout(8000);
            c.setRequestMethod("POST");
            c.setDoOutput(true);
            c.setRequestProperty("apikey", anon);
            c.setRequestProperty("Authorization", "Bearer " + anon);
            c.setRequestProperty("Content-Type", "application/json");
            try (OutputStream os = c.getOutputStream()) { os.write(body.toString().getBytes(StandardCharsets.UTF_8)); }
            if (c.getResponseCode() != 200) { c.disconnect(); return "banco respondeu " + c.getResponseCode(); }
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            try (InputStream is = c.getInputStream()) { byte[] b = new byte[4096]; int n; while ((n = is.read(b)) > 0) buf.write(b, 0, n); }
            c.disconnect();
            String txt = buf.toString("UTF-8").trim();
            if (txt.isEmpty() || "null".equals(txt)) return "pedido não encontrado";
            JSONObject data = new JSONObject(txt);

            NativeReceipt.Options opt = new NativeReceipt.Options();
            opt.paper = cfg.optInt("paper", 58);
            opt.codepage = cfg.optString("codepage", "pc850");
            opt.cutter = cfg.has("cutter") && !cfg.isNull("cutter") ? cfg.optBoolean("cutter") : opt.paper == 80;
            opt.copies = cfg.optInt("copies", 1);
            opt.kitchenSize = cfg.optString("kitchenSize", "mid");
            JSONArray vias = cfg.optJSONArray("vias");
            if (vias != null) for (int i = 0; i < vias.length(); i++) opt.vias.add(vias.optString(i));
            byte[] bytes = NativeReceipt.build(data, opt);

            NativePrinterOut.send(this, printer.optString("kind", "bluetooth"), printer.optString("address", ""),
                printer.optString("ip", ""), printer.optInt("port", 9100), bytes);
            return null;
        } catch (Exception e) {
            return e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
        }
    }

    /** Pedidos já impressos neste celular (página ou serviço), para não imprimir duas vezes. */
    static synchronized boolean isPrinted(Context ctx, String id) {
        return ctx.getSharedPreferences(PREFS, MODE_PRIVATE).getString("printed", "").contains(id);
    }

    static synchronized void markPrinted(Context ctx, String id) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, MODE_PRIVATE);
        String cur = p.getString("printed", "");
        if (cur.contains(id)) return;
        String next = cur.isEmpty() ? id : cur + "," + id;
        String[] parts = next.split(",");
        if (parts.length > 200) {
            StringBuilder b = new StringBuilder();
            for (int i = parts.length - 200; i < parts.length; i++) { if (b.length() > 0) b.append(','); b.append(parts[i]); }
            next = b.toString();
        }
        p.edit().putString("printed", next).apply();
    }

    private void notifyNew(String id, String title, String text) {
        createChannels(this);
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        nm.notify(Math.abs(id.hashCode()), new NotificationCompat.Builder(this, CH_ORDERS)
            .setSmallIcon(android.R.drawable.stat_notify_more)
            .setContentTitle(title)
            .setContentText(text)
            .setAutoCancel(true)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setContentIntent(openApp(this))
            .build());
    }

    /** Reabre o app ou traz para a frente (o Android só deixa com a permissão "Sobrepor a outros apps"). */
    private void reopenApp() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) return;
        try {
            Intent i = new Intent(this, MainActivity.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(i);
        } catch (Exception ignored) { }
    }

    @Override
    public void onDestroy() {
        running = false;
        if (poller != null) { poller.shutdownNow(); poller = null; }
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        wakeLock = null;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
