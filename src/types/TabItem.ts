
export class TabItem {
  constructor(
    public props: {
      path: { dir: string, name: string, ext: string },
      dirty: boolean,
      preview: boolean,
      // content: Map<string, {originContent: string, newContent: string}>
    }
  ) {}

  getFullPath(): string {
    var dir = `${this.props.path.dir}/`;
    if (this.props.path.dir == '@') {
      dir = '';
    }
    if (this.props.path.ext == '') {
      return `${dir}${this.props.path.name}`;
    }
    return `${dir}${this.props.path.name}.${this.props.path.ext}`;
  }

  getFileName(): string {
    if (this.props.path.ext == '') {
      return `${this.props.path.name}`;
    }
    return `${this.props.path.name}.${this.props.path.ext}`;
  }

  rename(new_name: string): void {
    this.props.path.name = new_name;
  }

  changeExt(new_ext: string): void {
    this.props.path.ext = new_ext;
  }

  changedir(new_dir: string): void {
    this.props.path.dir = new_dir;
  }

  clone(): TabItem {
    return new TabItem({
      path: { dir: this.props.path.dir, name: this.props.path.name, ext: this.props.path.ext },
      dirty: this.props.dirty,
      preview: this.props.preview
    });
  }
}

export interface TabPath {
  dir: string
  name: string
  ext: string
}

