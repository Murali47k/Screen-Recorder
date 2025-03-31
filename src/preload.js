const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getVideoSources: () => ipcRenderer.invoke('get-video-sources'),
    showContextMenu: (menuItems) => ipcRenderer.send('show-context-menu', menuItems),
    onSelectedSource: (callback) => ipcRenderer.on('selected-source', (event, sourceId) => callback(sourceId)),
    saveVideo: (buffer) => ipcRenderer.send('save-video', buffer)
});


