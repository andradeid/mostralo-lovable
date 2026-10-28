"""Acrescenta as permissões de Bluetooth, rede, localização e notificação no AndroidManifest gerado pelo Capacitor."""
import re
import sys

path = sys.argv[1]
xml = open(path, encoding='utf-8').read()
perms = [
    '<uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />',
    '<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />',
    '<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />',
    '<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />',
    '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
    '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
    '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />',
    '<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />',
    '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
    '<uses-permission android:name="android.permission.WAKE_LOCK" />',
    '<uses-permission android:name="android.permission.VIBRATE" />',
    '<uses-feature android:name="android.hardware.bluetooth" android:required="false" />',
]
missing = [p for p in perms if re.search(r'android:name="([^"]+)"', p).group(1) not in xml]
xml = xml.replace('</manifest>', '    ' + '\n    '.join(missing) + '\n</manifest>')
open(path, 'w', encoding='utf-8').write(xml)
print(f'{len(missing)} permissões adicionadas')
