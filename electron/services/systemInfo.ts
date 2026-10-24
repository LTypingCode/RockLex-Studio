import { ipcMain, dialog, BrowserWindow } from 'electron'
import process from 'node:process'

function getPlatform() {
    var platform = "unknown";
    if (process.platform === 'win32') {
        // console.log('Windows');
        platform = "Windows";
    } else if (process.platform === 'darwin') {
        // console.log('macOS');
        platform = "macOS";
    } else if (process.platform === 'linux') {
        // console.log('Linux');
        platform = "Linux";
    }
    return platform;
}

export function systemInfo() {
    ipcMain.handle('system:platform', async () => {
		return getPlatform();
	});
}
