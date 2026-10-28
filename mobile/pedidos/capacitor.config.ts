import type { CapacitorConfig } from '@capacitor/cli';

// O app abre a tela de pedidos do Mostralo (mesma do painel) e dá a ela acesso à impressora térmica.
// APP_URL muda o endereço: prévia da branch para teste, mostralo.com.br em produção.
const url = process.env.APP_URL || 'https://mostralo.com.br/app/pedidos';
const host = new URL(url).hostname;

const config: CapacitorConfig = {
  appId: 'br.com.mostralo.pedidos',
  appName: 'Mostralo Pedidos',
  webDir: 'www',
  server: { url, allowNavigation: [host, 'mostralo.com.br', '*.mostralo.com.br', '*.mostralo.pages.dev'], errorPath: 'index.html' },
  android: { allowMixedContent: false, adjustMarginsForEdgeToEdge: 'force' } as CapacitorConfig['android'],
};

export default config;
