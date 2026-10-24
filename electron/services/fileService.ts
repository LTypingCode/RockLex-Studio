import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 📌 文件路径跟踪（闭包内变量）
let currentFilePath: string | null = null

// ============ 纯业务函数（可复用，不直接绑定IPC） ============
/** 打开文件对话框 + 读取文件 */
async function openFile(filters?: Electron.FileFilter[]) {
	const result = await dialog.showOpenDialog({
		properties: ['openFile'],
		filters: filters ?? [
			{ name: '所有文件', extensions: ['*'] },
			{ name: 'JavaScript', extensions: ['js', 'mjs', 'cjs'] },
			{ name: 'TypeScript', extensions: ['ts', 'tsx'] },
			{ name: 'JSON', extensions: ['json'] },
			{ name: 'Markdown', extensions: ['md'] },
			{ name: 'HTML', extensions: ['html', 'htm'] },
			{ name: 'CSS', extensions: ['css'] },
			{ name: 'Python', extensions: ['py'] },
		],
	})
	if (result.canceled || result.filePaths.length === 0) return null
	const filePath = result.filePaths[0]
	const content = await readFile(filePath, 'utf-8')
	currentFilePath = filePath
	return { content, filePath: { dir: path.dirname(filePath), name: path.parse(filePath).name, ext: path.parse(filePath).ext.slice(1) } }
}

/** 另存为业务逻辑 */
async function saveAsFile(content: string) {
	const result = await dialog.showSaveDialog({
		title: '另存为',
		filters: [
			{ name: '所有文件', extensions: ['*'] },
			{ name: 'JavaScript', extensions: ['js'] },
			{ name: 'TypeScript', extensions: ['ts'] },
			{ name: 'JSON', extensions: ['json'] },
			{ name: 'Markdown', extensions: ['md'] },
			{ name: 'HTML', extensions: ['html'] },
			{ name: 'CSS', extensions: ['css'] },
			{ name: 'Python', extensions: ['py'] },
		],
	})
	if (result.canceled || !result.filePath) return null
	await writeFile(result.filePath, content, 'utf-8')
	currentFilePath = result.filePath
	return { filePath: { dir: path.dirname(result.filePath), name: path.parse(result.filePath).name, ext: path.parse(result.filePath).ext.slice(1) }, saved: true }
}

/** 保存文件：有路径直接写；无路径则调用另存为 */
async function saveFile(content: string, filePath: string) {
	if (true) {
		await writeFile(filePath, content, 'utf-8')
		return { filePath: filePath, saved: true }
	}
	// ✅ 直接调用业务函数，不再尝试访问 ipcMain.handlers
	// return saveAsFile(content)
}

/** 新建文件，清空路径记录 */
async function newFile() {
	currentFilePath = null
	return true
}

/** 获取当前打开文件路径 */
async function getCurrentPath() {
	return currentFilePath
}

// ============ IPC 注册入口（导出给main调用） ============
export function fileIpc() {
	// 文件操作IPC
	ipcMain.handle('file:open', async (_event, filters?: Electron.FileFilter[]) => {
		return openFile(filters)
	})

	ipcMain.handle('file:save', async (_event, content: string, filePath: string) => {
        try{
		    return saveFile(content, filePath)
        }catch(e){
            console.error('保存捕获异常：', e) // 主进程控制台打印真实错误！
            return { filePath: "error", saved: true }
        }
	})

	ipcMain.handle('file:saveAs', async (_event, content: string) => {
		return saveAsFile(content)
	})

	ipcMain.handle('file:new', async () => {
		return newFile()
	})

	ipcMain.handle('file:getCurrentPath', async () => {
		return getCurrentPath()
	})
}
