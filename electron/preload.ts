const { ipcRenderer, contextBridge } = require('electron')

// 👉不要导出完整ipcRenderer！只暴露业务需要的接口
contextBridge.exposeInMainWorld('electronWindow', {
  // 窗口控制接口，对应主进程的IPC事件
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleMaximize: () => ipcRenderer.send('window:toggleMaximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  // 注册状态回调，返回取消函数，用来解绑
  onStateChange: (callback: (state: { isMaximized: boolean }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { isMaximized: boolean }) => {
      callback(data)
    }
    ipcRenderer.on('window:state', handler)
    // 返回解绑函数，组件卸载时调用
    return () => {
      ipcRenderer.removeListener('window:state', handler)
    }
  }
})

// 系统信息 API（必须和 main.ts 里的 ipcMain.handle 频道一一对应）
contextBridge.exposeInMainWorld('systemInfo', {
  getPlatform: () => ipcRenderer.invoke('system:platform'),
})

// 文件操作 API（必须和 main.ts 里的 ipcMain.handle 频道一一对应）
contextBridge.exposeInMainWorld('fileAPI', {
  open: (filters?: { name: string; extensions: string[] }[]) => ipcRenderer.invoke('file:open', filters),
  save: (content: string, filePath: string) => ipcRenderer.invoke('file:save', content, filePath),
  saveAs: (content: string) => ipcRenderer.invoke('file:saveAs', content),
  new: () => ipcRenderer.invoke('file:new'),
  getCurrentPath: () => ipcRenderer.invoke('file:getCurrentPath'),
})


// invoke 封装
contextBridge.exposeInMainWorld('electronAPI', {
  /** 请求-响应型（有返回值），对应主进程 ipcMain.handle */
  invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
  /** 单向通知型（无返回值），对应主进程 ipcMain.on */
  send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
})
