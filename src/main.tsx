import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// ⚠️ CRÍTICO: Detectar se estamos em contexto do editor/preview Lovable
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true; // Cross-origin → assume iframe
  }
})();

const isPreviewHost =
  window.location.hostname.includes('lovableproject.com') ||
  window.location.hostname.includes('lovable.app') ||
  window.location.hostname.includes('id-preview--');

const isLovableEditorContext =
  isInIframe ||
  isPreviewHost ||
  new URLSearchParams(location.search).has('__lovable_token') ||
  document.referrer.includes('lovable.dev') ||
  document.referrer.includes('lovableproject.com');

// Limpar SWs antigos que podem causar tela branca
async function cleanupServiceWorkersIfNeeded() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // silencioso
  }
}

// No editor/preview do Lovable: limpar SWs e NÃO registrar
if (isLovableEditorContext) {
  cleanupServiceWorkersIfNeeded();
} else if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Verificar atualizações a cada 60 minutos
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                if (window.confirm('Nova versão disponível! Deseja atualizar agora?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch(() => {
        // App continua normalmente sem SW
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
