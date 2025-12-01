const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o renderer process
contextBridge.exposeInMainWorld('electron', {
  // Enviar notificação nativa
  showNotification: (title, body, sound) => {
    ipcRenderer.send('show-notification', { title, body, sound });
  },
  
  // Tocar som sem bloqueio de autoplay
  playSound: (soundPath) => {
    ipcRenderer.send('play-sound', soundPath);
  },
  
  // Verificar se está rodando no Electron
  isElectron: true,
  
  // Informações da plataforma
  platform: process.platform,
});
