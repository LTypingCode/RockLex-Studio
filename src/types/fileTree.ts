
type PathInfo = { dir: string; name: string; ext: string }
type FileTreeNodeProps = {
  isDir: boolean
  path: PathInfo
  children: FileTreeNode[] | null
}

export class FileTreeNode {
  public props: FileTreeNodeProps

  constructor(
    rawProps: {
      isDir: boolean
      path: PathInfo
      children: FileTreeNode[] | null
    }
  ) {
    // ===== 闭包私有，不属于实例 this！=====
    let _isNormalizing = false

    function normalizePath(p: typeof rawProps.path) {
      _isNormalizing = true
      p.dir = p.dir.trim().replace(/\\/g, '/').replace(/^[/]+|[/]+$/g, '')
      // p.dir = p.dir.replace(/\\/g, '/').replace(/^[/]+|[/]+$/g, '')
      p.name = p.name.trim().replace(/\\/g, '/').replace(/^[/]+|[/]+$/g, '')
      p.ext = p.ext.trim().replace(/\\/g, '/').replace(/^[/]+|[/]+$/g, '')
      _isNormalizing = false
    }

    const watchedPath = new Proxy(rawProps.path, {
      set(target, prop, newValue) {
        const ok = Reflect.set(target, prop, newValue)
        if (!_isNormalizing) {
          normalizePath(target)
        }
        return ok
      },
    })

    this.props = {
      ...rawProps,
      path: watchedPath,
    }

    normalizePath(this.props.path)
  }

  getFullPath(): string {
    var dir = `${this.props.path.dir}/`
    if (this.props.path.dir == '@') {
      dir = ''
    }
    if (this.props.path.ext == '') {
      return `${dir}${this.props.path.name}`
    }
    return `${dir}${this.props.path.name}.${this.props.path.ext}`
  }

  getFileName(): string {
    if (this.props.path.ext == '') {
      return `${this.props.path.name}`
    }
    return `${this.props.path.name}.${this.props.path.ext}`
  }
}

