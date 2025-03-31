const { app, BrowserWindow, ipcMain, desktopCapturer, Menu , dialog } = require('electron');
const fs = require('fs');
const path = require('path');

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Use preload script for security
      nodeIntegration: true,   // ✅ Enable Node.js modules
      contextIsolation: false  // ✅ Disable context isolation (for older Electron versions)
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools only in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


// Get video sources
ipcMain.handle('get-video-sources', async () => {
  return await desktopCapturer.getSources({ types: ['screen', 'window'] });
});

// Show context menu for video source selection
ipcMain.on('show-context-menu', (event, menuItems) => {
  const { Menu } = require('electron');
  const menu = Menu.buildFromTemplate(menuItems.map(item => ({
      label: item.label,
      click: () => event.sender.send('selected-source', item.id)
  })));
  menu.popup();
});

// Save video file
ipcMain.on('save-video', async (event, buffer) => {
  try {
      const { filePath } = await dialog.showSaveDialog({
          buttonLabel: 'Save video',
          defaultPath: `vid-${Date.now()}.webm`
      });

      if (filePath) {
          fs.writeFile(filePath, buffer, () => console.log('Video saved successfully!'));
      }
  } catch (error) {
      console.error("Error saving file:", error);
  }
});