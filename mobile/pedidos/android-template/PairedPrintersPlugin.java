package br.com.mostralo.pedidos;

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothClass;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.content.pm.PackageManager;
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
 * Lista os aparelhos Bluetooth já pareados no celular.
 * A busca do plugin de impressão só acha aparelhos visíveis que se declaram "impressora";
 * a maioria das térmicas, depois de pareada, só aparece por aqui.
 */
@CapacitorPlugin(name = "PairedPrinters")
public class PairedPrintersPlugin extends Plugin {

    @SuppressLint("MissingPermission")
    @PluginMethod
    public void list(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
            && ContextCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            call.reject("Permita \"Dispositivos por perto\" para o Mostralo Pedidos nas configurações do celular");
            return;
        }
        BluetoothManager manager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        BluetoothAdapter adapter = manager == null ? null : manager.getAdapter();
        if (adapter == null) {
            call.reject("Este aparelho não tem Bluetooth");
            return;
        }
        if (!adapter.isEnabled()) {
            call.reject("Ligue o Bluetooth do celular");
            return;
        }

        JSArray devices = new JSArray();
        try {
            Set<BluetoothDevice> bonded = adapter.getBondedDevices();
            if (bonded != null) {
                for (BluetoothDevice d : bonded) {
                    // Térmicas são Bluetooth clássico (ou dual); fones BLE puros ficam de fora
                    if (d.getType() == BluetoothDevice.DEVICE_TYPE_LE) continue;
                    BluetoothClass cls = d.getBluetoothClass();
                    int major = cls == null ? BluetoothClass.Device.Major.UNCATEGORIZED : cls.getMajorDeviceClass();
                    boolean likely = major == BluetoothClass.Device.Major.IMAGING
                        || major == BluetoothClass.Device.Major.UNCATEGORIZED
                        || major == BluetoothClass.Device.Major.MISC;
                    JSObject o = new JSObject();
                    o.put("name", d.getName());
                    o.put("address", d.getAddress());
                    o.put("major", major);
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
