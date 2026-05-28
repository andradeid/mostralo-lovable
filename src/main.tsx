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
        console.log('[App] SW registrado com sucesso');

        // Verificar atualizações a cada 60 minutos
        setInterval(() => {
          registration.update().catch(err => console.warn('[App] Erro ao buscar atualização do SW:', err));
        }, 60 * 60 * 1000);

        // Lógica de atualização simplificada para evitar loops
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Nova versão disponível. Em vez de confirm automático,
                // vamos apenas avisar no console por enquanto para debugar o loop.
                console.log('[App] Nova versão disponível. Aguardando recarregamento manual ou próxima visita.');
                
                // Opcional: Notificar o usuário via UI (non-blocking)
                // toast.info('Uma nova versão está disponível. Recarregue para atualizar.');
              }
            }
          };
        };
      })
      .catch((err) => {
        console.warn('[App] Falha ao registrar Service Worker:', err);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
