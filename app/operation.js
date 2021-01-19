
const { contextBridge, ipcRenderer } = require('electron')
 // 隔离桥接，而不是渲染端直接发送事件
contextBridge.exposeInMainWorld(
  'electron',
  {
    small: () => ipcRenderer.send('browserOperation','small','main'),
    restore:()=> ipcRenderer.send('browserOperation','restore','main'),
    close:()=>ipcRenderer.send('browserOperation','close','main')
  }
)