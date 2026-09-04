const { ipcRenderer, contextBridge } = require("electron");
contextBridge.exposeInMainWorld("electronWindow", {
  // 窗口控制接口，对应主进程的IPC事件
  minimize: () => ipcRenderer.send("window:minimize"),
  toggleMaximize: () => ipcRenderer.send("window:toggleMaximize"),
  close: () => ipcRenderer.send("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized")
});
//# sourceMappingURL=preload.js.map
