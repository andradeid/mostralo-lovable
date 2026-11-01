package br.com.mostralo.pedidos;

import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.UUID;

/** Envia os bytes do cupom direto para a térmica (Bluetooth SPP ou rede 9100), sem a página. */
public class NativePrinterOut {
    private static final UUID SPP = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    /** kind = "bluetooth" (address) ou "network" (ip/port). Lança exceção com motivo legível. */
    @SuppressLint("MissingPermission")
    public static void send(Context ctx, String kind, String address, String ip, int port, byte[] data) throws Exception {
        if ("network".equals(kind)) {
            try (Socket s = new Socket()) {
                s.connect(new InetSocketAddress(ip, port > 0 ? port : 9100), 5000);
                OutputStream os = s.getOutputStream();
                write(os, data, 4096, 0);
                os.flush();
                Thread.sleep(300);
            }
            return;
        }
        BluetoothManager bm = (BluetoothManager) ctx.getSystemService(Context.BLUETOOTH_SERVICE);
        BluetoothAdapter ad = bm == null ? null : bm.getAdapter();
        if (ad == null) throw new Exception("sem Bluetooth");
        if (!ad.isEnabled()) throw new Exception("Bluetooth desligado");
        BluetoothDevice dev = ad.getRemoteDevice(address);
        try { ad.cancelDiscovery(); } catch (Exception ignored) { }
        BluetoothSocket sock = null;
        Exception last = null;
        // 2 tentativas: segura e, se falhar, insegura (algumas térmicas só aceitam assim)
        for (int i = 0; i < 2 && sock == null; i++) {
            BluetoothSocket s = i == 0 ? dev.createRfcommSocketToServiceRecord(SPP) : dev.createInsecureRfcommSocketToServiceRecord(SPP);
            try { s.connect(); sock = s; }
            catch (Exception e) { last = e; try { s.close(); } catch (Exception ignored) { } Thread.sleep(400); }
        }
        if (sock == null) throw new Exception("não conectou na impressora (" + (last != null ? last.getMessage() : "?") + ")");
        try {
            OutputStream os = sock.getOutputStream();
            // pedaços com pausa: térmica simples tem buffer pequeno
            write(os, data, 512, data.length > 4096 ? 25 : 5);
            os.flush();
            Thread.sleep(Math.min(4000, 400 + data.length / 20));
        } finally {
            try { sock.close(); } catch (Exception ignored) { }
        }
    }

    private static void write(OutputStream os, byte[] data, int chunk, int pauseMs) throws Exception {
        for (int i = 0; i < data.length; i += chunk) {
            os.write(data, i, Math.min(chunk, data.length - i));
            os.flush();
            if (pauseMs > 0) Thread.sleep(pauseMs);
        }
    }
}
