// custom-language.worker.ts
import * as monaco from 'monaco-editor'

// 自定义语言的语法检查器
class CustomLanguageValidator {
  validate(code: string): monaco.editor.IMarkerData[] {
    const errors: monaco.editor.IMarkerData[] = []
    const lines = code.split('\n')
    
    // 示例：检查未闭合的括号
    lines.forEach((line, lineIndex) => {
      const openBrackets = (line.match(/$/g) || []).length
      const closeBrackets = (line.match(/$/g) || []).length
      
      if (openBrackets !== closeBrackets) {
        errors.push({
          severity: monaco.MarkerSeverity.Error,
          message: '括号未闭合',
          startLineNumber: lineIndex + 1,
          startColumn: 1,
          endLineNumber: lineIndex + 1,
          endColumn: line.length + 1
        })
      }
    })
    
    return errors
  }
}

// 自定义语言的代码补全提供者
class CustomLanguageCompleter {
  getSuggestions(code: string, position: monaco.Position): monaco.languages.CompletionItem[] {
    const suggestions: monaco.languages.CompletionItem[] = [
      {
        label: 'function',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'function ${1:name}() {\n\t$0\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: '定义函数'
      },
      {
        label: 'if',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'if (${1:condition}) {\n\t$0\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: '条件语句'
      },
      {
        label: 'for',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t$0\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: '循环语句'
      }
    ]
    
    return suggestions
  }
}

// Worker主逻辑
self.onmessage = function (e) {
  const message = e.data
  
  switch (message.type) {
    case 'validate':
      const validator = new CustomLanguageValidator()
      const errors = validator.validate(message.code)
      self.postMessage({ type: 'validationResult', errors })
      break
      
    case 'suggest':
      const completer = new CustomLanguageCompleter()
      const suggestions = completer.getSuggestions(message.code, message.position)
      self.postMessage({ type: 'suggestions', suggestions })
      break
      
    case 'format':
      // 代码格式化逻辑
      const formatted = formatCode(message.code)
      self.postMessage({ type: 'formatted', code: formatted })
      break
  }
}

function formatCode(code: string): string {
  // 简单的格式化逻辑
  return code
    .replace(/\s+/g, ' ')
    .replace(/\s*{\s*/g, ' { ')
    .replace(/\s*}\s*/g, ' } ')
    .trim()
}
