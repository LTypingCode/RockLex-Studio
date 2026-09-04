import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
const vueDevTools_Open = false
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'

  return {
    base: './', // Electron打包关键，修复静态资源404
    optimizeDeps: {
      include: [
        `monaco-editor/esm/vs/language/json/json.worker`,
        `monaco-editor/esm/vs/language/css/css.worker`,
        `monaco-editor/esm/vs/language/html/html.worker`,
        `monaco-editor/esm/vs/language/typescript/ts.worker`,
        `monaco-editor/esm/vs/editor/editor.worker`
      ],
    },
    plugins: [
      vue(),
      // 仅开发环境启用vueDevTools，生产自动不加载
      ...(isDev && vueDevTools_Open ? [vueDevTools()] : []),
      // Electron主进程 & preload
      electron([
        {
          entry: 'electron/main.ts',
          onstart(options) {
            options.startup()
          },
          vite: {
            build: {
              sourcemap: isDev
            }
          }
        },
        {
          entry: 'electron/preload.ts',
          onstart(options) {
            // preload编译完成后刷新渲染窗口
            options.reload()
          },
          vite: {
            build: {
              sourcemap: isDev
            }
          }
        }
      ]),
      renderer()
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
  }
})
