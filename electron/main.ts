import { app, BrowserWindow, ipcMain, dialog, globalShortcut } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { systemInfo, fileIpc } from './services'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    titleBarStyle: 'hidden',
    minWidth: 400,
    minHeight: 250,
    height: 800,
    width: 1200,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, 
      contextIsolation: true,
    },
  })

  win.setMenu(null);

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // 监听窗口事件
  // maximize：窗口最大化
  win.on('maximize', () => {
    console.log('窗口最大化');
    // 通知前端更新按钮图标（方块→还原图标）
    win?.webContents.send('window:state', { isMaximized: true });
  })

  // unmaximize：窗口取消最大化（还原）
  win.on('unmaximize', () => {
    console.log('窗口取消最大化');
    win?.webContents.send('window:state', { isMaximized: false });
  })

  // minimize：窗口最小化
  win.on('minimize', () => {
    console.log('窗口最小化');
  })

  // restore：从最小化恢复窗口
  win.on('restore', () => {
    console.log('窗口从最小化还原');
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when th
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 注册全局快捷键 Ctrl+Shift+I (Windows/Linux) 或 Cmd+Option+I (Mac)
const registerDevToolsShortcut = () => {
  if (app.isPackaged) return // 如果是打包后的程序，取消调试快捷键的注册
  const debug = globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (win) {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools()
      } else {
        win.webContents.openDevTools()
      }
    }
  })

  if (!debug) {
    console.log('调试快捷键注册失败')
  } else {
    console.log('快捷键 Ctrl+Shift+I 已注册用于开发者进行调试')
  }
}

app.whenReady().then(()=>{
  // 注册整个IPC
  systemInfo();
  fileIpc();

  // ============ IPC 注册窗口控制 ============
  ipcMain.on('window:minimize', () => win?.minimize())
  ipcMain.on('window:toggleMaximize', () => {
    if (win?.isMaximized()) win.unmaximize()
    else win?.maximize()
  })
  ipcMain.on('window:close', () => win?.close())
  ipcMain.handle('window:isMaximized', () => win?.isMaximized() ?? false)
  // ==================================

  // 注册快捷键
  registerDevToolsShortcut()
  // 启动窗口
  createWindow()
})

// 应用退出时取消所有快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
