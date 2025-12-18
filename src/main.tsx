import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Registro do Service Worker para PWA e cache offline
// ✅ Em DEV (especialmente no preview do Lovable), desabilitamos e limpamos SW para evitar tela branca
const isLovablePreviewHost =
  location.hostname.includes('lovableproject.com') ||
  location.hostname.includes('lovable.app');

if (import.meta.env.DEV && isLovablePreviewHost && 'serviceWorker' in navigator) {
  // Em preview, um SW antigo pode devolver HTML para módulos do Vite (MIME text/html) e causar tela branca.
  const swCleanupFlag = 'mostralo_sw_cleanup_done';

  if (!sessionStorage.getItem(swCleanupFlag)) {
    sessionStorage.setItem(swCleanupFlag, '1');

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((r) => r.unregister())))
      .then(() => {
        if (navigator.serviceWorker.controller) {
          window.location.reload();
        }
      })
      .catch(() => {
        // silencioso: o app continua sem SW
      });
  }
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service Worker registrado com sucesso:', registration.scope);

        // Verificar atualizações a cada 60 minutos
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        // Listener para novas versões
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] Nova versão disponível! Recarregue a página para atualizar.');
                // Opcional: mostrar toast para o usuário
                if (window.confirm('Nova versão disponível! Deseja atualizar agora?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('[PWA] Service Worker não disponível:', error);
        // ✅ App continua funcionando normalmente sem SW
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
