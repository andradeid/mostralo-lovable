import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.mostralo.pedidos',
  appName: 'Mostralo Pedidos',
  webDir: 'dist',
  android: { allowMixedContent: true },
  plugins: {
    LocalNotifications: { iconColor: '#F26B1D' },
  },
};

export default config;
