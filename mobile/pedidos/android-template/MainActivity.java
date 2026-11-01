package br.com.mostralo.pedidos;

import android.Manifest;
import android.os.Build;
import android.content.Intent;
import android.os.Bundle;
import androidx.core.content.ContextCompat;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    /** Página do app viva (o serviço só confere sozinho quando ela está fechada). */
    static volatile boolean alive = false;
    /** Quando o app foi fechado (o serviço procura pedidos a partir daí). */
    static volatile long closedAt = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugin próprio: lista as impressoras já pareadas no Bluetooth do celular
        registerPlugin(PairedPrintersPlugin.class);
        // Segundo plano: serviço que mantém o app recebendo pedidos com a tela desligada
        registerPlugin(PedidosServicePlugin.class);
        super.onCreate(savedInstanceState);
        alive = true;
        // Tela sempre acesa enquanto o app de pedidos estiver aberto
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        // Deixa o alarme de pedido novo tocar sem precisar tocar na tela antes
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
        }

        ArrayList<String> perms = new ArrayList<>();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            perms.add(Manifest.permission.BLUETOOTH_SCAN);
            perms.add(Manifest.permission.BLUETOOTH_CONNECT);
        }
        perms.add(Manifest.permission.ACCESS_FINE_LOCATION);
        perms.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        if (Build.VERSION.SDK_INT >= 33) perms.add("android.permission.POST_NOTIFICATIONS");
        requestPermissions(perms.toArray(new String[0]), 1001);
    }

    /** Com a tela apagada ou o app minimizado, a página continua rodando (recebe e imprime pedidos). */
    private void keepWebViewRunning() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().onResume();
            getBridge().getWebView().resumeTimers();
        }
    }

    /** Liga o serviço de segundo plano com o app na tela (o Android 12+ só deixa ligar assim). */
    @Override
    public void onResume() {
        super.onResume();
        try {
            String store = getSharedPreferences(PedidosService.PREFS, MODE_PRIVATE).getString("store", "");
            Intent i = new Intent(this, PedidosService.class);
            i.putExtra("store", store);
            ContextCompat.startForegroundService(this, i);
        } catch (Exception ignored) {
            // sem permissão ainda: a página tenta de novo
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        keepWebViewRunning();
    }

    @Override
    public void onStop() {
        super.onStop();
        keepWebViewRunning();
    }

    @Override
    public void onDestroy() {
        alive = false;
        closedAt = System.currentTimeMillis();
        super.onDestroy();
    }
}
