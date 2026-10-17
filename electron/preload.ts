const { ipcRenderer, contextBridge } = require('electron')

// 👉不要导出完整ipcRenderer！只暴露业务需要的接口
contextBridge.exposeInMainWorld('electronWindow', {
  // 窗口控制接口，对应主进程的IPC事件
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleMaximize: () => ipcRenderer.send('window:toggleMaximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized')
})

// 系统信息 API（必须和 main.ts 里的 ipcMain.handle 频道一一对应）
contextBridge.exposeInMainWorld('systemInfo', {
  getPlatform: () => ipcRenderer.invoke('system:platform'),
})

// 文件操作 API（必须和 main.ts 里的 ipcMain.handle 频道一一对应）
contextBridge.exposeInMainWorld('fileAPI', {
  open: (filters) => ipcRenderer.invoke('file:open', filters),
  save: (content, filePath) => ipcRenderer.invoke('file:save', content, filePath),
  saveAs: (content) => ipcRenderer.invoke('file:saveAs', content),
  new: () => ipcRenderer.invoke('file:new'),
  getCurrentPath: () => ipcRenderer.invoke('file:getCurrentPath'),
})


// invoke 封装
contextBridge.exposeInMainWorld('electronAPI', {
  /** 请求-响应型（有返回值），对应主进程 ipcMain.handle */
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  /** 单向通知型（无返回值），对应主进程 ipcMain.on */
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
})
