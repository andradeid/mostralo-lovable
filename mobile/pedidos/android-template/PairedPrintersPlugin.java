package br.com.mostralo.pedidos;

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothClass;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.os.Build;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Set;

/**
 * Lista os aparelhos Bluetooth já pareados no celular e informa o diagnóstico do Bluetooth.
 * A busca do plugin de impressão só acha aparelhos visíveis que se declaram "impressora";
 * a maioria das térmicas, depois de pareada, só aparece por aqui.
 */
@CapacitorPlugin(name = "PairedPrinters")
public class PairedPrintersPlugin extends Plugin {

    static final String VERSION = "nativo-2";

    private boolean granted(String perm) {
        return ContextCompat.checkSelfPermission(getContext(), perm) == PackageManager.PERMISSION_GRANTED;
    }

    private BluetoothAdapter adapter() {
        BluetoothManager manager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        return manager == null ? null : manager.getAdapter();
    }

    private static String typeName(int t) {
        switch (t) {
            case BluetoothDevice.DEVICE_TYPE_CLASSIC: return "clássico";
            case BluetoothDevice.DEVICE_TYPE_LE: return "BLE";
            case BluetoothDevice.DEVICE_TYPE_DUAL: return "duplo";
            default: return "desconhecido";
        }
    }

    private static String majorName(int m) {
        switch (m) {
            case BluetoothClass.Device.Major.IMAGING: return "impressora/imagem";
            case BluetoothClass.Device.Major.UNCATEGORIZED: return "sem categoria";
            case BluetoothClass.Device.Major.MISC: return "diversos";
            case BluetoothClass.Device.Major.AUDIO_VIDEO: return "áudio/vídeo";
            case BluetoothClass.Device.Major.PHONE: return "telefone";
            case BluetoothClass.Device.Major.COMPUTER: return "computador";
            case BluetoothClass.Device.Major.PERIPHERAL: return "periférico";
            case BluetoothClass.Device.Major.WEARABLE: return "vestível";
            default: return "classe " + m;
        }
    }

    /** Diagnóstico: versão, Android, permissões, Bluetooth e localização. */
    @SuppressLint("MissingPermission")
    @PluginMethod
    public void diag(PluginCall call) {
        JSObject r = new JSObject();
        r.put("version", VERSION);
        r.put("sdk", Build.VERSION.SDK_INT);
        r.put("device", Build.MANUFACTURER + " " + Build.MODEL);
        r.put("permConnect", Build.VERSION.SDK_INT < Build.VERSION_CODES.S || granted(Manifest.permission.BLUETOOTH_CONNECT));
        r.put("permScan", Build.VERSION.SDK_INT < Build.VERSION_CODES.S || granted(Manifest.permission.BLUETOOTH_SCAN));
        r.put("permLocation", granted(Manifest.permission.ACCESS_FINE_LOCATION));
        BluetoothAdapter a = adapter();
        r.put("hasBluetooth", a != null);
        r.put("bluetoothOn", a != null && a.isEnabled());
        try {
            LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            r.put("locationOn", lm != null && (lm.isProviderEnabled(LocationManager.GPS_PROVIDER) || lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)));
        } catch (Exception e) {
            r.put("locationOn", false);
        }
        call.resolve(r);
    }

    /** Todos os aparelhos pareados, sem filtro (o site decide o que mostrar). */
    @SuppressLint("MissingPermission")
    @PluginMethod
    public void list(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !granted(Manifest.permission.BLUETOOTH_CONNECT)) {
            call.reject("Permita \"Dispositivos por perto\" para o Mostralo Pedidos nas configurações do celular");
            return;
        }
        BluetoothAdapter a = adapter();
        if (a == null) {
            call.reject("Este aparelho não tem Bluetooth");
            return;
        }
        if (!a.isEnabled()) {
            call.reject("Ligue o Bluetooth do celular");
            return;
        }

        JSArray devices = new JSArray();
        try {
            Set<BluetoothDevice> bonded = a.getBondedDevices();
            if (bonded != null) {
                for (BluetoothDevice d : bonded) {
                    BluetoothClass cls = d.getBluetoothClass();
                    int major = cls == null ? BluetoothClass.Device.Major.UNCATEGORIZED : cls.getMajorDeviceClass();
                    int type = d.getType();
                    boolean likely = type != BluetoothDevice.DEVICE_TYPE_LE
                        && (major == BluetoothClass.Device.Major.IMAGING
                            || major == BluetoothClass.Device.Major.UNCATEGORIZED
                            || major == BluetoothClass.Device.Major.MISC);
                    JSObject o = new JSObject();
                    o.put("name", d.getName());
                    o.put("address", d.getAddress());
                    o.put("major", major);
                    o.put("majorName", majorName(major));
                    o.put("type", typeName(type));
                    o.put("likelyPrinter", likely);
                    devices.put(o);
                }
            }
        } catch (SecurityException e) {
            call.reject("Permita \"Dispositivos por perto\" para o Mostralo Pedidos nas configurações do celular");
            return;
        }

        JSObject ret = new JSObject();
        ret.put("devices", devices);
        call.resolve(ret);
    }
}
