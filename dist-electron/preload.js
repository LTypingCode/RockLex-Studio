const { ipcRenderer: i, contextBridge: e } = require("electron");
e.exposeInMainWorld("electronWindow", {
  // 窗口控制接口，对应主进程的IPC事件
  minimize: () => i.send("window:minimize"),
  toggleMaximize: () => i.send("window:toggleMaximize"),
  close: () => i.send("window:close"),
  isMaximized: () => i.invoke("window:isMaximized")
});
