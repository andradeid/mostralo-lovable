const { app, BrowserWindow, Tray, Menu, ipcMain, Notification } = require('electron');
const path = require('path');

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Em desenvolvimento, carrega do Vite dev server
  // Em produção, carrega do build
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Criar tray icon (ícone na bandeja)
  createTray();

  // Minimizar para bandeja ao invés de fechar
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../build/icon.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir Mostralo',
      click: () => {
        mainWindow.show();
      },
    },
    {
      label: 'Sair',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Mostralo - Sistema de Delivery');
  tray.setContextMenu(contextMenu);

  // Abrir janela ao clicar no ícone da bandeja
  tray.on('click', () => {
    mainWindow.show();
  });
}

// IPC: Enviar notificação nativa
ipcMain.on('show-notification', (event, { title, body, sound }) => {
  const notification = new Notification({
    title,
    body,
    icon: path.join(__dirname, '../build/icon.png'),
    sound: sound || true, // Som padrão do sistema
  });

  notification.show();
});

// IPC: Tocar som sem bloqueio de autoplay
ipcMain.on('play-sound', (event, soundPath) => {
  // No Electron, podemos tocar som sem restrições de autoplay
  mainWindow.webContents.executeJavaScript(`
    const audio = new Audio('${soundPath}');
    audio.volume = 0.9;
    audio.play().catch(err => console.error('Erro ao tocar som:', err));
  `);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Prevenir múltiplas instâncias
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
