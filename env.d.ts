/// <reference types="vite/client" />

// Preload 暴露给 Renderer 的 API 类型（渲染进程 tsconfig 能读到这里）
interface Window {
  // 窗口控制 API
  electronWindow?: {
    minimize(): void
    toggleMaximize(): void
    close(): void
    isMaximized(): Promise<boolean>
  }
  // 系统信息 API
  systemInfo?: {
    getPlatform(): Promise<string>
  }
  // 文件操作 API
  fileAPI?: {
    open(filters?: { name: string; extensions: string[] }[]): Promise<{ content: string; filePath: { dir: string, name: string,  ext: string} } | null>
    save(content: string, filePath: string): Promise<{ filePath: { dir: string, name: string,  ext: string}; saved: boolean } | null>
    saveAs(content: string): Promise<{ filePath: { dir: string, name: string,  ext: string}; saved: boolean } | null>
    new(): Promise<boolean>
    getCurrentPath(): Promise<string | null>
  }
}

// invoke 封装
// ---- 请求-响应型（有返回值） ----
interface IpcChannelMap {
  'test:handel': {
    args: [{ name: string; extensions: string[] }[]]
    result: { content: string; filePath: string } | null
  }
}

// ---- 单向通知型（无返回值） ----
interface IpcSendChannelMap {
  'test:on': { args: [] }
}

// ============ preload 暴露的统一 API ============
interface Window {
  /** 统一 IPC 入口 */
  electronAPI: {
    /** 请求-响应（主进程 ipcMain.handle），频道和参数/返回值有类型提示 */
    invoke<K extends keyof IpcChannelMap>(
      channel: K,
      ...args: IpcChannelMap[K]['args']
    ): Promise<IpcChannelMap[K]['result']>
    /** 单向通知（主进程 ipcMain.on） */
    send<K extends keyof IpcSendChannelMap>(
      channel: K,
      ...args: IpcSendChannelMap[K]['args']
    ): void
  }
}

