<template>
  <div class="root" @click="clickMenu(false);">
    <!-- 顶部标题栏 -->
    <header data-tauri-drag-region @click="clickMenu($event);">
      <div class="menu_left" >
        <img alt="Vue logo" class="logo" src="./assets/logo.svg"/>
        <div class="menu_list">
          <div class="menu_button menu_click" @click="clickMenu();" @mouseenter="menuFiles($event);" id="file">文件</div>
          <div class="menu_button menu_click" @click="clickMenu();" @mouseenter="menuFiles($event);" id="edit">编辑</div>
          <div class="menu_button menu_click" @click="clickMenu();" @mouseenter="menuFiles($event);" id="selection">选择</div>
          <div class="menu_button menu_click" @click="clickMenu();" @mouseenter="menuFiles($event);" id="view">查看</div>
        </div>

        <div class="menu_context menu_click" v-if="menuContext.show" :style="{ left: menuContext.x + 'px', top: menuContext.y + 'px' }">
          <div v-if="menuContext.id == 'file'">
            <div class="menu_item" @click="clickMenu(false);createTab(new_file);">新建文本文件<div>Ctrl+N</div></div>
            <div class="menu_item">新建文件…<div>Ctrl+Alt+Windows+N</div></div>
            <div class="menu_line"></div>
            <div class="menu_item" @click="clickMenu(false);openFile();">打开文件…<div>Ctrl+O</div></div>
            <div class="menu_line"></div>
            <div class="menu_item" @click="clickMenu(false);saveFile();">保存<div>Ctrl+S</div></div>
            <div class="menu_item" @click="clickMenu(false);saveFile();">另存为…<div>Ctrl+Shift+S</div></div>
          </div>
          <div v-if="menuContext.id == 'edit'">
            <div class="menu_item">撤销</div>
            <div class="menu_item">恢复</div>
          </div>
          <div v-if="menuContext.id == 'selection'">
            <div class="menu_item">全选</div>
            <div class="menu_item">扩大选取</div>
          </div>
          <div v-if="menuContext.id == 'view'">
            <div class="menu_item">外观</div>
            <div class="menu_item">编辑器布局</div>
          </div>
        </div>

      </div>
      <div class="window-btns menu_click" v-if="system_platform == 'Windows'">
        <button class="window-btns-none" @click="minimize">&#xE921;</button>
        <button class="window-btns-none" @click="toggleMax">&#xE922;</button>
        <button class="window-btns-close" @click="close" id="test" style="">&#xE8BB;</button>
        <!-- <button @click="close" style="font-family: Segoe MDL2 Assets;font-size: 10px;">&#xE8BB;</button> -->
      </div>
    </header>

    <SplitPanel
      class="pane"
      orientation="horizontal"
      primary="start"
      size-unit="px"
      :size="200"
      :min-size="200"
      :collapse-threshold="100"
      collapsible
      divider-hit-area="6px"
    >
      <template #start>
        <div class="sidebar">
          <h4>资源管理器</h4>
        </div>
      </template>
      <template #divider>
        <div class="divider_height"></div>
      </template>
      <template #end>

        <SplitPanel
          class="pane"
          orientation="horizontal"
          primary="end"
          size-unit="px"
          :size="200"
          :min-size="200"
          :collapse-threshold="100"
          collapsible
          divider-hit-area="6px"
          style="height: 100%;"
        >
          <template #start>

            <SplitPanel
              class="pane"
              orientation="vertical"
              primary="end"
              size-unit="px"
              :size="100"
              :min-size="100"
              :collapse-threshold="50"
              collapsible
              divider-hit-area="6px"
              style="height: 100%;"
            >
              <template #start>

                <div class="main-content">
                  <div style="height: 40px;">
                    <TabBar
                      :tabs="tabs"
                      v-model:activePath="activeTabPath"
                      @close="handleCloseTab"
                      @closeOthers="handleCloseOthers"
                      @closeAll="handleCloseAll"
                      @create="createTab"
                      @open="openTab"
                    />
                  </div>
                  <div class="editor">
                    <monacoEditor ref="monacoRef" width="100%" height="100%" @editor-mounted="editorMounted" />
                  </div>
                </div>
                
              </template>
              <template #divider>
                <div class="divider_width"></div>
              </template>
              <template #end>
                <div class="sidebar">
                  <h4>控制台</h4>
                  <div class="control-row">
                    <input v-model="input_text">
                    <button @click="dsb">{{ abc }}</button>
                    <span>{{ input_text }}</span>
                    <select v-model="language">
                      <option value="typescript">TypeScript</option>
                      <option value="javascript">JavaScript</option>
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                      <option value="python">Python</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                </div>
              </template>
            </SplitPanel>

          </template>
          <template #divider>
            <div class="divider_height"></div>
          </template>
          <template #end>
            <div class="sidebar">
              <h4>属性编辑器</h4>
            </div>
          </template>
        </SplitPanel>

      </template>
    </SplitPanel>

    <div class="status_bar">
      <label>状态栏</label>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

import { SplitPanel } from '@directus/vue-split-panel'
import '@directus/vue-split-panel/index.css'

import HelloWorld from './components/HelloWorld.vue'
import TheWelcome from './components/TheWelcome.vue'
import monacoEditor from './components/monacoEditor.vue'
import type { MonacoEditorExposed } from './components/monacoEditor.vue'
import * as monaco from 'monaco-editor'

import TabBar from'./components/TabBar.vue'
import { TabItem } from '@/types/TabItem'
import type { TabPath } from '@/types/TabItem'

// import { open } from "@tauri-apps/plugin-dialog";
// import { readTextFile } from "@tauri-apps/plugin-fs";

// =============== menu 菜单 ===============

const menuContext = ref<{
  show: boolean
  id: string
  x: number
  y: number
}>({
  show: false,
  id: '',
  x: 0,
  y: 0,
})

function menuFiles(e: MouseEvent) {
  const el = e.target as HTMLElement;
  const rect = el.getBoundingClientRect();
  menuContext.value.id = el.id;
  menuContext.value.x = rect.left;
  menuContext.value.y = rect.bottom;
}

function clickMenu(e: MouseEvent | void | boolean) {
  if (typeof e === 'boolean') { // boolean
    menuContext.value.show = e;
  } else if (e === undefined) { // void → undefined
    menuContext.value.show = menuContext.value.show ? false : true;
  } else { // MouseEvent
    e.stopPropagation()
  }
}

var system_platform = ref<string>("unknown");

onMounted(async () => {
  try {
    const p = await window.systemInfo?.getPlatform()
    if (p) system_platform.value = p;
  } catch (err) {
  }
})

// =======================================


// ========= 文件内存缓存 =========
interface FileCacheItem {
  originContent: string
  content: string
  preview: boolean
}
const fileContentCache = new Map<string, FileCacheItem>()


// 后缀映射monaco语言
function extToLang(ext: string): string {
  const map: Record<string, string> = {
    ts: 'typescript',
    js: 'javascript',
    json: 'json',
    html: 'html',
    css: 'css',
    py: 'python'
  }
  return map[ext] ?? 'plaintext'
}

// 拼接唯一key
function makeFilePath(path: TabPath): string {
  return `${path.dir}\\${path.name}.${path.ext}`
}

// 模拟初始化测试文件缓存（你真实项目这里替换为读取磁盘）
function initMockCache() {
  for (const t of tabs.value) {
    const fp = makeFilePath(t.props.path);
    var text: string = '';
    if (t.props.path.ext == 'js') {
      text = `// ${fp}\n`+
      `const test = 2;\n`+
      `console.log(\`结果x2 = \${dsb(10) * 2}\`);\n`+
      `function dsb(fuck) {\n`+
      `    var num = fuck;\n`+
      `    for (var i = 0; i < 15; i++) {\n`+
      `        num--;\n`+
      `        console.log(num);\n`+
      `    }\n`+
      `    return num;\n`+
      `}\n`
      ;
    } else if (t.props.path.ext == 'ts') {
      text = `// ${fp}\n`+
      `const test: number = 2;\n`+
      `console.log(\`结果x2 = \${dsb(10) * 2}\`);\n`+
      `function dsb(fuck: number): number {\n`+
      `    var num: number = fuck;\n`+
      `    for (var i: number = 0; i < 15; i++) {\n`+
      `        num--;\n`+
      `        console.log(num);\n`+
      `    }\n`+
      `    return num;\n`+
      `}\n`
      ;
    } else if (t.props.path.ext == 'json') {
      text = `{\n`+
      `    "path": "${fp}",\n`+
      `    "string": "fuck",\n`+
      `    "bool": "true",\n`+
      `    "number": 114514,\n`+
      `    "list": [\n`+
      `        1,\n`+
      `        26,\n`+
      `        30\n`+
      `    ],\n`+
      `    "dict": {\n`+
      `        "bool": [ false, true ],\n`+
      `        "test": [\n`+
      `            { "lang": "zh_CN" },\n`+
      `            { "lang": "en_US" },\n`+
      `            "SB"\n`+
      `        ]\n`+
      `    }\n`+
      `}\n`
      ;
    } else if (t.props.path.ext == 'lang') {
      text = `lang\n`+
      `path = ${fp}\n`+
      `text = 这是 Rocklex Studio 的开发测试文本\n`+
      `pack.name = Microsoft VS code\n`
      ;
    }

    fileContentCache.set(fp, {
      originContent: text,
      content: text,
      preview: t.props.preview
    })
  }
}


const editorMounted = (editor: monaco.editor.IStandaloneCodeEditor) => {
	// editor = ins; // 保存编辑器实例
	initMockCache(); // 初始化mock缓存
	// 如果默认有激活tab，直接加载
	if (activeTabPath.value) {
		loadTabToEditor();
	}

  // 监听编辑器文本变更
	editor.onDidChangeModelContent(() => {
		if (!activeTabPath.value || !editor) return;
		const fp = makeFilePath(activeTabPath.value);
		const cacheItem = fileContentCache.get(fp);
		if (!cacheItem) return;

		const newText = editor.getValue();
		cacheItem.content = newText;
		// 判断是否修改，更新tab的dirty
		const targetTab = tabs.value.find(t => t.props.path === activeTabPath.value);
		if (targetTab) {
			targetTab.props.dirty = cacheItem.originContent !== cacheItem.content;
		}
	})
}

/**
 * 从缓存读取内容，加载到monaco编辑器（切换标签调用）
 */
function loadTabToEditor() {
  const fp = makeFilePath(activeTabPath.value)
  const cache = fileContentCache.get(fp)
  if (!cache || !monacoRef.value) return
  const lang = extToLang(activeTabPath.value.ext)
  monacoRef.value.loadFile(fp, cache.content, lang)
}


const value = ref('let a = 234')
const language = ref('javascript')
const input_text = ref("");
const abc = ref("none");
async function dsb() {
  const platform = await window.systemInfo?.getPlatform();
  abc.value = platform ?? "undefined"
}

// Tauri

// 对外暴露给渲染页面的API
// const isElectron = ref(!!window.electronWindow)

// const minimize = () => {
//   if (!isElectron.value) return
//   window.electronWindow!.minimize()
// }
// const toggleMax = () => {
//   if (!isElectron.value) return
//   window.electronWindow!.toggleMaximize()
// }
// const close = () => {
//   if (!isElectron.value) return
//   window.electronWindow!.close()
// }

// declare global {
//   interface Window {
//     electronWindow?: {
//       minimize: () => void
//       toggleMaximize: () => void
//       close: () => void
//       isMaximized: () => Promise<boolean>
//     }
//   }
// }



const minimize = async () => {
  const result = await window.electronWindow?.minimize()
}
const toggleMax = async () => {
  const result = await window.electronWindow?.toggleMaximize()
}
const close = async () => {
  const result = await window.electronWindow?.close()
}


const tabs = ref<TabItem[]>([
  new TabItem({ path: { dir: 'D:/vue_code_test', name: 'main',  ext: 'js'}, dirty: false, preview: false }),
  new TabItem({ path: { dir: 'D:/vue_code_test', name: 'command',  ext: 'js'}, dirty: true, preview: false }),
  new TabItem({ path: { dir: 'D:/vue_code_test', name: 'player.animation_controllers',  ext: 'json'}, dirty: false, preview: false }),
  new TabItem({ path: { dir: 'D:/vue_code_test', name: 'manifest',  ext: 'json'}, dirty: false, preview: true }),
  new TabItem({ path: { dir: 'D:/vue_code_test', name: 'player.geo',  ext: 'json'}, dirty: false, preview: true }),
  new TabItem({ path: { dir: 'D:/vue_code_test', name: 'player.animation',  ext: 'json'}, dirty: false, preview: true }),
  new TabItem({ path: { dir: 'D:/vue_code_test', name: 'new_item',  ext: 'json'}, dirty: true, preview: false }),
  new TabItem({ path: { dir: 'D:/vue_code_test', name: 'zh_CN',  ext: 'lang'}, dirty: true, preview: false }),
  new TabItem({ path: { dir: 'D:/vue_code_test', name: 'player.entity',  ext: 'json'}, dirty: false, preview: false }),
  new TabItem({ path: { dir: 'D:/vue_code_test', name: 'player',  ext: 'json'}, dirty: true, preview: false }),
  new TabItem({ path: { dir: 'D:/vue_code_test', name: 'en_US',  ext: 'lang'}, dirty: false, preview: true }),
  new TabItem({ path: { dir: 'D:/vue_code_test', name: 'test',  ext: 'ts'}, dirty: false, preview: false }),
])
const activeTabPath = ref<TabPath>({ dir: 'D:/vue_code_test', name: 'main',  ext: 'js'})
const currentFile = computed(() => tabs.value.find(item => item.props.path === activeTabPath.value))
const monacoRef = ref<InstanceType<typeof monacoEditor> & MonacoEditorExposed | null>(null)

// 👉 watch 放在定义之后！监听激活tab切换，加载到编辑器
watch(activeTabPath, () => {
  const fp = makeFilePath(activeTabPath.value)
  const cache = fileContentCache.get(fp)
  if (!cache || !monacoRef.value) return
  const lang = extToLang(activeTabPath.value.ext)
  monacoRef.value.loadFile(fp, cache.content, lang)
})


// 关闭单个tab
function handleCloseTab(path: TabPath) {
  const idx = tabs.value.findIndex(t => t.props.path === path)
  if (idx === -1) return
  const fp = makeFilePath(path)
  // 销毁monaco model
  monacoRef.value?.disposeFileModel(fp)
  // 删除业务缓存
  fileContentCache.delete(fp)

  tabs.value.splice(idx, 1)
  if (activeTabPath.value === path) {
    activeTabPath.value = tabs.value[tabs.value.length <= idx ? 0 : idx]?.props.path || { dir: '', name: '',  ext: ''}
  }
}

// 关闭其他标签
function handleCloseOthers(path: TabPath) {
  tabs.value.forEach(t=>{
    if(t.props.path !== path){
      const fp = makeFilePath(t.props.path)
      monacoRef.value?.disposeFileModel(fp)
      fileContentCache.delete(fp)
    }
  })
  tabs.value = tabs.value.filter(t => t.props.path === path)
  activeTabPath.value = path
}

// 全部关闭
function handleCloseAll() {
  tabs.value.forEach(t=>{
    const fp = makeFilePath(t.props.path)
    monacoRef.value?.disposeFileModel(fp)
    fileContentCache.delete(fp)
  })
  tabs.value = []
  activeTabPath.value = { dir: '', name: '',  ext: ''}
}

const new_file = new TabItem({ path: { dir: 'D:/vue_code_test', name: 'Untitled',  ext: ''}, dirty: true, preview: false });
// 新建一个tab
function createTab(file: TabItem) {
  const idx = tabs.value.findIndex(t => t.props.path === activeTabPath.value)
  let new_file= file.clone();
  var num = 0;
  while (true) {
    const exist = tabs.value.some(item => item.getFullPath() == new_file.getFullPath() )
    if (exist) {
      new_file.rename(`${file.props.path.name}-${++num}`);
    } else {
      tabs.value.splice(idx + 1, 0, new_file)
      const fp = makeFilePath(new_file.props.path)
      // 新建文件写入缓存
      fileContentCache.set(fp, {
        originContent: '',
        content: '',
        preview: new_file.props.preview
      })
      activeTabPath.value = new_file.props.path;
      return
    }
  }
}

// 打开一个tab
function openTab(file: TabItem) {
  const exist = tabs.value.some(item => item.getFullPath() == file.getFullPath() )
  if (exist) {
    activeTabPath.value = file.props.path;
    return
  }
  tabs.value.push(file)
  const fp = makeFilePath(file.props.path)
  if(!fileContentCache.has(fp)){
    fileContentCache.set(fp, {
      originContent: '',
      content: '',
      preview: file.props.preview
    })
  }
  activeTabPath.value = file.props.path
}


async function openFile() {
  const result = await window.fileAPI?.open()
  if (!result) return

  const newTab = new TabItem({ path: { dir: result.filePath.dir, name: result.filePath.name,  ext: result.filePath.ext}, dirty: false, preview: false });
  
  const fp = makeFilePath(result.filePath)
  fileContentCache.set(fp, {
    originContent: result.content,
    content: result.content,
    preview: false
  })
  openTab(newTab)
}

async function saveFile() {
  const filePath = activeTabPath.value
  const fp = makeFilePath(filePath)
  const cache = fileContentCache.get(fp)
  if (!cache) return

  const result = await window.fileAPI?.save(cache.content, makeFilePath(filePath))
  if (!result) return
  console.log("fuck")
  console.log(result.filePath)
  console.log(cache.content)

  // 更新缓存
  cache.originContent = cache.content
  cache.preview = false

  // 更新tab状态
  const tab = tabs.value.find(t => t.getFullPath() === fp)
  if (tab) {
    tab.props.dirty = false
    tab.props.preview = false
  }
}

</script>

<style scoped>
* {
  margin:0;
  padding:0;
  box-sizing: border-box;
}
.root {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1f1f1f;
  overflow: hidden;
}
header {
  height: 35px;
  background: #181818;
  color: #fff;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  justify-content: space-between;
  border-bottom: 2px solid var(--line_color);
  user-select: none;
  -webkit-app-region: drag;
}

.status_bar {
  height: 20px;
  background: #181818;
  color: #fff;
  padding: 0 20px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  justify-content: space-between;
  border-top: 2px solid var(--line_color);
}

.logo {
  height: 70%;
  object-fit: contain;
}

.menu_left {
  height: 80%;
  display: flex;
  flex-direction: row; 
  align-items: center;
  padding: 0 10px;
  gap: 8px;
}

.menu_list {
  /* gap: 5px; */
  display: flex;
  flex-direction: row; 
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: center;
}

.menu_button {
  border-radius: 5px;
  padding: 0 10px;
  font-size:13px;
  color: #ccc;
}
.menu_click {
  -webkit-app-region: no-drag;
}

.menu_button:hover {
  background: #2a2a2b;
  color: #ccc;
}

.menu_context {
  position: fixed;
  z-index: 999;
  background: #252526;
  border: 2px solid #444;
  padding: 4px 0;
  border-radius: 10px;
  overflow: hidden;
}

.menu_item {
  margin: 0 4px;
  padding: 2px 16px;
  color: #ccc;
  font-size:13px;
  cursor: pointer;
  border-radius: 6px;

  display: flex;
  flex-direction: row;
}
.menu_item:hover {
  background: #094771;
}
.menu_item div{
  padding-left: 30px;
  margin-left: auto;
  color: #808080;
}

.menu_line {
  height: 1px;
  margin-top: 4px;
  margin-bottom: 4px;
  background-color: #444;
}


.window-btns {
  display: flex;
  height: 100%;
}
.window-btns button {
  width: 45px;
  height: 100%;
  border: none;
  background: transparent;
  color: #fff;
  cursor: pointer;

  font-family: Segoe Fluent Icons;
  font-size: 10px;
}
.window-btns-none:not(:hover) {
  transition: background 0.2s ease;
}
.window-btns-none:hover {
  background: #333;
  transition: background 0.2s ease 0.0s;
}
.window-btns-close:not(:hover) {
  transition: background 0.2s ease;
}
.window-btns-close:hover {
  background: red;
  transition: background 0.2s ease 0.0s;
}
.pane {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.sidebar {
  width: 100%;
  height:100%;
  background:#252526;
  color:#ccc;
  padding:8px;
}
.main-content {
  width:100%;
  height:100%;
  display:flex;
  flex-direction:column;
  padding:0px;
  min-height:0;
  background:#1f1f1f;
}
.control-row {
  flex-shrink:0;
  margin-bottom:8px;
  color:#fff;
}
.editor {
  flex:1;
  min-height:0;
}
</style>
<!-- 全局覆盖分割线样式，去掉默认白色 -->
<style>
:root {
  --line_color: #808080;
}

.divider_height {
  height: 100%;
  background-color: var(--line_color);
  box-shadow: 0 0 0 1px var(--line_color);
}
.divider_height:hover {
  box-shadow: 0 0 0 2px #007acc;
  transition: box-shadow 0.2s ease 0.5s;
}
.divider_height:not(:hover) {
  transition: box-shadow 0.2s ease;
}
.divider_height:active {
  box-shadow: 0 0 0 2px #007acc;
  transition: none 0.2s ease 0.5s;
}

.divider_width {
  width: 100%;
  background-color: var(--line_color);
  box-shadow: 0 0 0 1px var(--line_color);
}
.divider_width:hover {
  box-shadow: 0 0 0 2px #007acc;
  transition: box-shadow 0.2s ease 0.5s;
}
.divider_width:not(:hover) {
  transition: box-shadow 0.2s ease;
}
.divider_width:active {
  box-shadow: 0 0 0 2px #007acc;
  transition: none 0.2s ease 0.5s;
}




</style>
