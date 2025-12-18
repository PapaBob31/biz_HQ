const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  authorizeDevice: (data) => ipcRenderer.invoke('clover-authorize', data),
  loginUser: (credentials) => ipcRenderer.invoke('user-login', credentials),
  saveAuthSession: (session) => ipcRenderer.send('save-session', session)
});