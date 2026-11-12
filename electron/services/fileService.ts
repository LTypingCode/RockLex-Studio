import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFile, writeFile, readdir, open } from 'node:fs/promises'
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
	return openByPath(filePath)
	// const content = await readFile(filePath, 'utf-8')
	// currentFilePath = filePath
	// return { content, filePath: { dir: path.dirname(filePath), name: path.parse(filePath).name, ext: path.parse(filePath).ext.slice(1) } }
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

async function openDir() {
	const res = await dialog.showOpenDialog({properties:['openDirectory']})
	if(res.canceled) return null
	const fullDirPath = res.filePaths[0]
	const dir = path.dirname(fullDirPath)
	const name = path.basename(fullDirPath)
	return { filePath: { dir: dir, name: name, ext: ""} }
}

async function openByPath(fullPath: string) {
  try{
	const binary = await isBin(fullPath)
	if (binary) {
		const res = await dialog.showMessageBox({
			type: 'warning',
			title: 'RockLex Studio',
			message: '打开文件警告',
			detail: '此文件可能是二进制文件，不建议打开。',
			buttons: ['取消', '仍然打开'],
			defaultId: 0,
			cancelId: 0
		})
		if(res.response === 0) return {ok:false}
	}
    const content = await readFile(fullPath, 'utf8')
    const dir = path.dirname(fullPath)
    const name = path.basename(fullPath)
    const ext = path.extname(name).slice(1)
    const pureName = path.basename(name, '.'+ext)
    return {
      ok:true,
      content,
      filePath:{
        dir,
        name: pureName,
        ext
      }
    }
  }catch(e){
	console.log(e);
    return {ok:false}
  }
}

export interface FileTreeNode {
  isDir: boolean
  path: { dir: string, name: string, ext: string },
  children: FileTreeNode[] | null
}

// 读取单层目录，返回FileTreeNode数组
async function loadDirChildren(dirPath: string): Promise<FileTreeNode[]> {
  const entries = await readdir(dirPath, { withFileTypes: true })
  const list: FileTreeNode[] = []
  for (const entry of entries) {
    // const fullPath = path.join(dirPath, entry.name)
	const parsed = path.parse(entry.name)
	let name: string
    let ext: string
    if (entry.isDirectory()) {
      // 文件夹：ext为空，name为原始文件夹名
      name = entry.name
      ext = ""
    } else {
      // 文件：拆分名称 + 后缀
      name = parsed.name
      ext = parsed.ext.slice(1) // 去掉开头的 "."
    }

    list.push({
      isDir: entry.isDirectory(),
	  path: { dir: dirPath, name, ext },
      children: null,
    })
  }
  return list
}

async function isBin(filePath: string): Promise<boolean> {
  const fd = await open(filePath, 'r')
  try {
    const buf = Buffer.alloc(1024)
    // ✅ 接收返回值拿到 bytesRead
    const { bytesRead } = await fd.read(buf, 0, 1024)
    if (bytesRead === 0) return false // 空文件，当做文本

    // 缓冲区存在 0x00 空字节 → 判定二进制
    return buf.subarray(0, bytesRead).includes(0x00)
  } finally {
    await fd.close() // finally 保证一定关闭文件句柄，防止句柄泄漏
  }
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

	ipcMain.handle('file:openByPath', async (_evt, fullPath: string)=>{
		return openByPath(fullPath)
	})
	
	ipcMain.handle('file:openDir', async ()=>{
		return openDir()
	})

	ipcMain.handle('file:loadDirChildren', async (_evt, dirPath: string) => {
		try {
			return await loadDirChildren(dirPath)
		} catch (e) {
			console.error('读取目录失败', e)
			return []
		}
	})
}
