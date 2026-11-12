<template>
  <div class="tree-node" @contextmenu.stop.prevent="rightClick(node)">
    <div 
      class="node-row"
      @click="handleClickNode(node)"
    >
      <span class="arrow" v-if="node.props.isDir">
        {{ expandedSet.has(node.getFullPath()) ? '▼' : '▶' }}
      </span>
      <span v-else>&nbsp;&nbsp;</span>

      <span class="icon">
        {{ node.props.isDir ? '📁' : '📄' }}
      </span>
      <span class="name">{{ node.getFileName() }}</span>
    </div>

    <!-- 选中高亮 -->
    <div 
      v-if="node.getFullPath() === selectedPath" 
      class="active-bg"
    ></div>

    <!-- 递归调用自己 -->
    <div v-if="node.props.isDir && expandedSet.has(node.getFullPath())" class="children">
      <FileTree
        v-for="child in node.props.children"
        :key="child.getFullPath()"
        :node="child"
        :selected-path="selectedPath"
        @select="handleTreeSelect"
        @mouse-right="rightClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FileTreeNode } from '@/types/fileTree'

const props = defineProps<{
  node: FileTreeNode
  selectedPath: string
}>()

const emit = defineEmits(['select','mouse-right'])

const expandedSet = ref<Set<string>>(new Set())

// 把API返回的原始属性传入FileTreeNode构造函数
function toFileTreeNode(rawNode: { isDir: boolean, path: { dir: string, name: string, ext: string }, children: FileTreeNode[] | null }): FileTreeNode {
  return new FileTreeNode({
    isDir: rawNode.isDir,
    path: rawNode.path,
    children: null
  })
}

async function expandNode(node: FileTreeNode) {
  if (!node.props.isDir) return
  if (node.props.children !== null) return
  const children = await window.fileAPI?.loadDirChildren(node.getFullPath())
  if (!children) return

  const treeNodeList = children.map(raw => toFileTreeNode(raw))

  // 拷贝数组，避免直接修改原始响应式对象
  const sorted = [...treeNodeList].sort((a, b) => {
    // 文件夹优先
    if (a.props.isDir !== b.props.isDir) {
      return a.props.isDir ? -1 : 1
    }
    // VSCode风格自然排序
    return a.getFileName().localeCompare(b.getFileName(), undefined, { sensitivity: 'base', numeric: true })
  })
  node.props.children = sorted
}

async function handleClickNode(node: FileTreeNode) {
  if (node.props.isDir) {
    if (node.props.children === null) {
      await expandNode(node)
    }
    // TS逻辑内必须加 .value
    if (expandedSet.value.has(node.getFullPath())) {
      expandedSet.value.delete(node.getFullPath())
    } else {
      expandedSet.value.add(node.getFullPath())
    }
  } else {
    // 文件点击，向上抛出 select 事件
    emit('select', node)
  }
}

// 接收子组件往上冒泡的选中事件，继续向上传递
function handleTreeSelect(node: FileTreeNode) {
  emit('select', node)
}

function rightClick(node: FileTreeNode) {
  emit('mouse-right', node)
}
</script>

<style scoped>
.tree-node {
  position: relative;
  padding-left: 12px;
}
.node-row {
  display: flex;
  gap: 6px;
  cursor: pointer;
  padding: 3px 0;
  position: relative;
  z-index:2;
}
.children {
  margin-left: 14px;
  border-left: 1px solid #3335;
}
.active-bg {
  position:absolute;
  left:0;right:0;top:0;bottom:0;
  background:#254b8044;
  z-index:1;
}
.name {
  white-space: nowrap; /* 禁止换行，全部挤一行 */
  overflow: hidden;    /* 超出容器直接隐藏 */
  text-overflow: ellipsis; /* 末尾显示 ... */
}
</style>
