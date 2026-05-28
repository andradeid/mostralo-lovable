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
    let isReloading = false;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[App] SW registrado com sucesso');

        // Verificar atualizações a cada 60 minutos
        setInterval(() => {
          registration.update().catch(err => console.warn('[App] Erro ao buscar atualização do SW:', err));
        }, 60 * 60 * 1000);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            console.log('[App] Novo worker detectado, estado:', newWorker.state);
            
            newWorker.addEventListener('statechange', () => {
              console.log('[App] Estado do worker alterado para:', newWorker.state);
              
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[App] Nova versão pronta para ser ativada');
                
                // Evitar loops de recarregamento
                if (!isReloading) {
                  const shouldUpdate = window.confirm(
                    'Uma nova versão do Mostralo está disponível! Deseja atualizar agora para garantir o melhor desempenho?'
                  );
                  
                  if (shouldUpdate) {
                    isReloading = true;
                    // Enviar mensagem para o SW pular espera se necessário
                    if (newWorker) {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                    window.location.reload();
                  }
                }
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('[App] Falha ao registrar Service Worker:', err);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);