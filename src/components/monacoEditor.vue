<template>
  <div ref="codeEditBox" class="codeEditBox"></div>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { editorProps } from './monacoEditorType'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import pyWorker from './py.worker?worker'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import * as monaco from 'monaco-editor'
import type { ITextModel, ICodeEditorViewState, IStandaloneCodeEditor } from 'monaco-editor'

export default defineComponent({
  name: 'monacoEditor',
  props: editorProps,
  emits: ['update:modelValue', 'change', 'editor-mounted'],
  setup(props, { emit, expose }) {
    // @ts-ignore
    self.MonacoEnvironment = {
      getWorker(_: string, label: string) {
        if (label === 'json') {
          return new jsonWorker()
        }
        if (['css', 'scss', 'less'].includes(label)) {
          return new cssWorker()
        }
        if (['html', 'handlebars', 'razor'].includes(label)) {
          return new htmlWorker()
        }
        if (['typescript', 'javascript'].includes(label)) {
          return new tsWorker()
        }
        if (['python'].includes(label)) {
          return new pyWorker()
        }
        return new EditorWorker()
      },
    }
    let editor: IStandaloneCodeEditor
    const codeEditBox = ref()

    // 新增：model缓存、视图状态缓存
    const modelCache = new Map<string, ITextModel>()
    const viewStateCache = new Map<string, ICodeEditorViewState | null>()

    const init = () => {
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      })
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
      })
      // model:null，不再初始化value，多文件模式
      editor = monaco.editor.create(codeEditBox.value, {
        ...props.options,
        model: null,
        language: props.language,
        theme: props.theme,
        automaticLayout: true,
      })
      editor.onDidChangeModelContent(() => {
        const value = editor.getValue()
        emit('update:modelValue', value)
        emit('change', value)
      })
      emit('editor-mounted', editor)
    }

    /**
     * 加载文件，复用model，保留撤销栈、光标、滚动
     * @param filePath 唯一文件路径
     * @param content 文件文本
     * @param lang 语言
     */
    const loadFile = (filePath: string, content: string, lang: string) => {
      if (!editor) return
      const currentModel = editor.getModel()
      const currentPath = currentModel?.uri.path
      if (currentPath) {
        viewStateCache.set(currentPath, editor.saveViewState())
      }

      let model = modelCache.get(filePath)
      if (!model) {
        const uri = monaco.Uri.parse(`file://${filePath}`)
        model = monaco.editor.createModel(content, lang, uri)
        modelCache.set(filePath, model)
      }

      editor.setModel(model)
      const savedView = viewStateCache.get(filePath)
      if (savedView) {
        editor.restoreViewState(savedView)
      }
      editor.focus()
    }

    /**
     * 关闭tab，销毁model释放内存
     */
    const disposeFileModel = (filePath: string) => {
      const model = modelCache.get(filePath)
      if (model) {
        model.dispose()
        modelCache.delete(filePath)
      }
      viewStateCache.delete(filePath)
    }

    // 对外暴露方法给父组件调用
    expose({
      loadFile,
      disposeFileModel,
      getEditor: () => editor
    })

    watch(
      () => props.modelValue,
      newValue => {
        if (editor) {
          const activeModel = editor.getModel()
          if (!activeModel) {
            editor.setValue(newValue ?? '')
            return
          }
          const value = activeModel.getValue()
          if (newValue !== value) {
            activeModel.setValue(newValue)
          }
        }
      }
    )
    watch(
      () => props.options,
      newValue => {
        editor.updateOptions(newValue)
      },
      { deep: true }
    )
    watch(
      () => props.language,
      newValue => {
        const m = editor.getModel()
        if (m) monaco.editor.setModelLanguage(m, newValue)
      }
    )

    onBeforeUnmount(() => {
      modelCache.forEach(m => m.dispose())
      modelCache.clear()
      viewStateCache.clear()
      editor.dispose()
    })
    onMounted(() => {
      init()
    })
    return { codeEditBox }
  },
})
</script>

<style lang="scss" scoped>
.codeEditBox {
  width: v-bind(width);
  height: v-bind(height);
}
</style>
