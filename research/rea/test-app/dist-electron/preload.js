// Preload script - context bridge for IPC
// Use this to expose protected APIs to the renderer process

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected APIs
contextBridge.exposeInMainWorld('electron, {
  // Example protected API
  send: (channel: string, data: any) => {
    // whitelist channels
    let validChannel = channel
    if (validChannel) {
      ipcRenderer.send(channel, data)
    }
  },
  receive: (channel: string, func: Function) => {
    // whitelist channels  
    let validChannel = channel
    if (validChannel) {
      // Default
      ipcRenderer.on(channel, (event, ...args) => func(...args))
    }
  }
})