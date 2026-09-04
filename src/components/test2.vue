
<template>
  <div class="code-editor-container">
    <div class="editor-header">
      <select v-model="selectedLanguage" @change="handleLanguageChange" class="language-selector">
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
        <option value="html">HTML</option>
        <option value="css">CSS</option>
        <option value="python">Python</option>
      </select>
      <button @click="formatCode" class="format-btn">格式化代码</button>
      <button @click="initEditor" class="format-btn">测试</button>
    </div>
    <div ref="editorContainer" class="editor-wrapper"></div>
  </div>
</template>

<script setup>
import * as monaco from 'monaco-editor'
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

const editorContainer = ref(null)
const editor = ref(null)
const selectedLanguage = ref('html')

// 示例代码
const sampleCodes = {
  javascript: `function greet(name) {
  console.log("Hello, " + name + "!");
}

greet("World");`,
  typescript: `interface Person {
  name: string;
}

function greet(person: Person) {
  console.log("Hello, " + person.name);
}

greet({name: "TypeScript"});`,
  html: `<!DOCTYPE html>
<html>
<head>
  <title>示例页面</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`,
  css: `body {
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}`,
  python: `def greet(name):
    print(f"Hello, {name}!")

greet("Python")`
}

const initEditor = () => {
    console.log(editorContainer.value)
  if (!editorContainer.value) return
  
  editor.value = monaco.editor.create(editorContainer.value, {
    value: sampleCodes[selectedLanguage.value],
    language: selectedLanguage.value,
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: true }
  })
}

const handleLanguageChange = async () => {
  if (!editor.value) return
  
  // 使用nextTick确保DOM更新完成
  await nextTick()
  
  try {
    const model = ref(editor.value.getModel());
    if (model) {
      // monaco.editor.setModelLanguage(model, selectedLanguage.value)
      // 更新代码内容
      // editor.value.setValue(sampleCodes[selectedLanguage.value] || '')
    }
  } catch (error) {
    console.error('语言切换失败:', error)
  }
}

const formatCode = () => {
  if (editor.value) {
    editor.value.getAction('editor.action.formatDocument').run()
  }
}

onMounted(() => {
  initEditor()
})

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.dispose()
  }
})
</script>

<style scoped>
.code-editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  padding: 10px;
  background-color: #1e1e1e;
  display: flex;
  gap: 10px;
}

.language-selector {
  padding: 5px 10px;
  background-color: #3c3c3c;
  color: white;
  border: 1px solid #555;
  border-radius: 4px;
}

.format-btn {
  padding: 5px 15px;
  background-color: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.format-btn:hover {
  background-color: #005a9e;
}

.editor-wrapper {
  height: 500px;
}
</style>
