import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Registro do Service Worker para PWA e cache offline
// ⚠️ CRÍTICO: No editor/preview do Lovable, NUNCA podemos ter SW ativo (causa cache quebrado e tela branca).
const isLovableEditorContext =
  location.hostname.includes('lovableproject.com') ||
  location.hostname.includes('lovable.app') ||
  new URLSearchParams(location.search).has('__lovable_token') ||
  document.referrer.includes('lovable.dev') ||
  document.referrer.includes('lovableproject.com');

async function cleanupServiceWorkersIfNeeded() {
  if (!('serviceWorker' in navigator)) return;

  const swCleanupFlag = 'mostralo_sw_cleanup_done';
  if (sessionStorage.getItem(swCleanupFlag)) return;
  sessionStorage.setItem(swCleanupFlag, '1');

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));

    // Limpar caches do SW (evita HTML/chunks antigos)
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }

    // Se havia controle de SW, recarrega para garantir estado limpo
    if (navigator.serviceWorker.controller) {
      window.location.reload();
    }
  } catch {
    // silencioso: o app continua sem SW
  }
}

// Em QUALQUER build, se estivermos no editor do Lovable, limpar e NÃO registrar SW
if (isLovableEditorContext) {
  cleanupServiceWorkersIfNeeded();
} else if (import.meta.env.PROD && 'serviceWorker' in navigator) {
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
