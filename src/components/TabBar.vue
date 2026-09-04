<template>
  <div class="vscode-tabbar">
    <!-- 左滚动按钮 -->
    <button v-if="showScrollLeft" class="scroll-btn" @click="scrollLeft">‹</button>

    <!-- Tab滚动容器 -->
    <div ref="scrollWrapRef" class="tab-scroll-wrap" @wheel.prevent="handleWheel" @contextmenu.prevent="openContextMenu($event, null)">
      <div ref="tabListRef" class="tab-list">
        <div
          v-for="tab in tabs"
          :key="tab.getFullPath()"
          class="tab-item"
          :class="{ active: tabPathJoin(activePath) == tabPathJoin(tab.props.path) }"
          @click="$emit('update:activePath', tab.props.path)"
          @mousedown.middle="$emit('close', tab.props.path)"
          @contextmenu.stop.prevent="openContextMenu($event, tab.props.path)"
          :title="tab.getFullPath()"
        >
          <!-- 文件图标 -->
          <span :style="getfileIconStyle(tab.props.path.ext)"></span>
          <!-- 文件名 -->
          <span class="tab-name" :class="{ preview: tab.props.preview }">{{ tab.getFileName() }}</span>
          <!-- 关闭按钮 -->
          <span  v-if="!tab.props.dirty" class="close-btn" @click.stop="$emit('close', tab.props.path)">×</span>
          <span  v-if="tab.props.dirty" class="close-btn" @click.stop="$emit('close', tab.props.path)">●</span>
        </div>
      </div>
    </div>

    <!-- 右滚动按钮 -->
    <button v-if="showScrollRight" class="scroll-btn" @click="scrollRight">›</button>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.show"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <div v-if="contextMenu.targetPath != null">
        <div class="menu_item" @click="$emit('close', contextMenu.targetPath); closeContextMenu()">关闭<div>Ctrl+F4</div></div>
        <div class="menu_item" @click="$emit('closeOthers', contextMenu.targetPath); closeContextMenu()">关闭其他</div>
        <div class="menu_item" @click="$emit('closeAll'); closeContextMenu()">全部关闭<div>Ctrl+K W</div></div>
        <div class="menu_line"></div>
        <div class="menu_item" @click="funcScrollIntoView()">快速定位</div>
      </div>
      <div v-if="contextMenu.targetPath == null">
        <div class="menu_item" @click="$emit('create', new_file);">新建文本文件<div>Ctrl+N</div></div>
        <div class="menu_item" @click="$emit('open', test_file);">打开文件<div>Ctrl+P</div></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

import { TabItem } from '@/types/TabItem'
import type { TabPath } from '@/types/TabItem'


function tabPathJoin(path: TabPath) {
  return path.dir+'/'+path.name+'.'+path.ext;
}

const props = defineProps<{
  tabs: TabItem[]
  activePath: TabPath
}>()
const emit = defineEmits<{
  'update:activePath': [path: TabPath]
  close: [path: TabPath]
  closeOthers: [path: TabPath]
  closeAll: []
  create: [tab: TabItem]
  open: [tab: TabItem]
}>()


const new_file = new TabItem({ path: { dir: 'D:/vue_code_test', name: 'Untitled',  ext: ''}, dirty: true, preview: false });
const test_file = new TabItem({ path: { dir: 'D:/vue_code_test', name: 'command',  ext: 'js'}, dirty: true, preview: false });

const scrollWrapRef = ref<HTMLDivElement | null>(null)
const tabListRef = ref<HTMLDivElement | null>(null)
const showScrollLeft = ref(false)
const showScrollRight = ref(false)

const contextMenu = ref<{
  show: boolean
  x: number
  y: number
  targetPath: TabPath | null
}>({
  show: false,
  x: 0,
  y: 0,
  targetPath: null
})

const default_icon: { path: string, color: string } = {
  path: '../images/project.svg',
  color: '#FFFFFF'
}
const icon_data: Record<string, { path: string, color: string }> = {
  'json': { path: '../images/json.svg', color: '#FFF700' },
  'js': { path: '../images/javascript.svg', color: '#FFF700' },
  'ts': { path: '../images/typescript.svg', color: '#4682B4' }
}

function getfileIconStyle(ext: string) {
  const icon = icon_data[ext]
  if (icon) {
    const jsonSvg = new URL(icon.path, import.meta.url).href
    return {
      width: '16px',
      height: '16px',
      background: icon.color,
      mask: `url(${jsonSvg}) no-repeat center`,
      WebkitMask: `url(${jsonSvg}) no-repeat center`,
    }
  }
  const jsonSvg = new URL(default_icon.path, import.meta.url).href
  return {
    width: '16px',
    height: '16px',
    background: default_icon.color,
    mask: `url(${jsonSvg}) no-repeat center`,
    WebkitMask: `url(${jsonSvg}) no-repeat center`,
  }
}



// 判断Tab是否溢出，控制滚动箭头
function checkOverflow() {
  if (!scrollWrapRef.value || !tabListRef.value) return
  const wrap = scrollWrapRef.value
  const list = tabListRef.value
  showScrollLeft.value = wrap.scrollLeft > 5
  showScrollRight.value = wrap.scrollLeft + wrap.clientWidth < list.scrollWidth - 5
}

// 左右滚动
function scrollLeft() {
  scrollWrapRef.value?.scrollBy({ left: -120, behavior: 'smooth' })
}
function scrollRight() {
  scrollWrapRef.value?.scrollBy({ left: 120, behavior: 'smooth' })
}
function handleWheel(e: WheelEvent) {
  scrollWrapRef.value?.scrollBy({ left: e.deltaY > 0 ? 40 : -40 })
}

// 右键菜单
function openContextMenu(e: MouseEvent, path: TabPath | null ) {
  contextMenu.value = {
    show: true,
    x: e.clientX,
    y: e.clientY,
    targetPath: path
  }
}
function closeContextMenu() {
  contextMenu.value.show = false
}


// 激活标签自动滚动到视野内
function funcScrollIntoView() {
  const activeDom = tabListRef.value?.querySelector<HTMLDivElement>('.tab-item.active')
  activeDom?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' })
  checkOverflow();
}

// 检测标签切换
watch(() => props.activePath, async () => {
  await nextTick()
  funcScrollIntoView();
})

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  checkOverflow()
  resizeObserver = new ResizeObserver(checkOverflow)
  if (scrollWrapRef.value) {
    resizeObserver.observe(scrollWrapRef.value)
  }
  scrollWrapRef.value?.addEventListener('scroll', checkOverflow)
  document.addEventListener('click', closeContextMenu)
})
onUnmounted(() => {
  resizeObserver?.disconnect()
  scrollWrapRef.value?.removeEventListener('scroll', checkOverflow)
  document.removeEventListener('click', closeContextMenu)
})
</script>

<style scoped>
.vscode-tabbar {
  display: flex;
  align-items: center;
  height: 35px;
  background: #252526;
  user-select: none;
}
.scroll-btn {
  width: 24px;
  height: 100%;
  border: none;
  background: #2d2d2d;
  color: #ccc;
  cursor: pointer;
  font-size: 16px;
}
.scroll-btn:hover {
  background: #383838;
}
.tab-scroll-wrap {
  flex: 1;
  height: 100%;
  overflow: hidden;
}
.tab-list {
  display: flex;
  height: 100%;
}
.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  height: 100%;
  box-sizing: border-box;
  color: #969696;
  border-right: 1px solid #1e1e1e;
  cursor: pointer;
  position: relative;
}
.tab-item.active {
  background: #1e1e1e;
  color: #fff;
}
.tab-item.active::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: #007acc;
}
.tab-item:hover:not(.active) {
  background: #2a2a2b;
  color: #ccc;
}
.dirty-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ccc;
  flex-shrink: 0;
}
.tab-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
}
.tab-name.preview {
  font-style: italic;
}
.close-btn {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  text-align: center;
  font-size: 14px;
  line-height: 16px;
}
.close-btn:hover {
  background: #444;
}
.context-menu {
  position: fixed;
  z-index: 999;
  background: #252526;
  border: 1px solid #444;
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
</style>

<style>
.icon_json {
  width:16px;
  height:16px;
  background: #FFF700; /* 这里就是svg最终颜色 */
  mask: url('../images/json.svg') no-repeat center;
  -webkit-mask: url('../images/json.svg') no-repeat center; /* 兼容webkit */
  filter: url(#bold);
}


.icon_js {
  width:16px;
  height:16px;
  background: #FFF700; /* 这里就是svg最终颜色 */
  mask: url('../images/javascript.svg') no-repeat center;
  -webkit-mask: url('../images/javascript.svg') no-repeat center; /* 兼容webkit */
}

</style>
