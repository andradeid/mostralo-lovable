import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Registro do Service Worker para PWA e cache offline
// ✅ Com fallback seguro para Safari/iPhones
if ('serviceWorker' in navigator) {
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
        // Útil para Safari modo privado ou iPhones mais antigos
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
