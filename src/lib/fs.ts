import type { Component } from 'vue'

export interface Meta {
  description?: string
  date?: string
  title?: string
  tags?: string[]
  image?: string
  hidden?: boolean
  name?: string
}

export interface FileEntry {
  kind: 'file'
  name: string
  path: string
  source: string
  meta: Meta
}

export interface DirEntry {
  kind: 'dir'
  name: string
  path: string
  meta: Meta
  children: Entry[]
}

export type Entry = DirEntry | FileEntry

// exhaustive: Vite's build skips dotfiles (.secrets.md, .ssh/) otherwise, while dev doesn't
const meta = import.meta.glob<Meta>('/content/**/*.md', {
  eager: true,
  import: 'frontmatter',
  exhaustive: true,
})
const pages = import.meta.glob<Component>('/content/**/*.md', {
  query: '?page',
  import: 'default',
  exhaustive: true,
})
const texts = import.meta.glob<string>(
  ['/content/**/*', '!/content/**/*.{md,png,jpg,jpeg,webp,gif,svg,avif}'],
  { query: '?raw', import: 'default', exhaustive: true },
)

export function buildTree(meta: Record<string, Meta>, texts: string[]): DirEntry {
  const root: DirEntry = { kind: 'dir', name: '~', path: '~', meta: {}, children: [] }

  function dirAt(segments: string[]): DirEntry {
    let dir = root
    for (const name of segments) {
      let next = dir.children.find(
        (entry): entry is DirEntry => entry.kind === 'dir' && entry.name === name,
      )
      if (!next) {
        next = { kind: 'dir', name, path: `${dir.path}/${name}`, meta: {}, children: [] }
        dir.children.push(next)
      }
      dir = next
    }
    return dir
  }

  function add(source: string, meta: Meta) {
    const segments = source.replace('/content/', '').split('/')
    const fileName = segments.pop()!
    const dir = dirAt(segments)
    if (fileName === 'index.md') {
      dir.meta = meta
      return
    }
    const name = meta.name ?? fileName
    dir.children.push({ kind: 'file', name, path: `${dir.path}/${name}`, source, meta })
  }

  for (const [source, fileMeta] of Object.entries(meta)) add(source, fileMeta)
  for (const source of texts) add(source, {})
  return root
}

export const root = buildTree(meta, Object.keys(texts))

export function resolve(path: string, cwd: string, from: DirEntry = root): Entry | null {
  if (path.startsWith('/')) return null

  const home = /^(~|\$HOME)(\/|$)/
  const parts = home.test(path) ? [] : cwd.split('/').slice(1)
  for (const part of path.replace(home, '').split('/')) {
    if (part === '..') parts.pop()
    else if (part && part !== '.') parts.push(part)
  }

  let entry: Entry = from
  for (const part of parts) {
    if (entry.kind !== 'dir') return null
    const next: Entry | undefined = entry.children.find((child) => child.name === part)
    if (!next) return null
    entry = next
  }
  return entry
}

function compare(a: Entry, b: Entry): number {
  if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1
  if (a.kind === 'file' && a.meta.date !== b.meta.date) {
    if (!a.meta.date) return 1
    if (!b.meta.date) return -1
    return b.meta.date.localeCompare(a.meta.date)
  }
  return a.name.localeCompare(b.name)
}

export function list(dir: DirEntry, opts: { all: boolean }): Entry[] {
  return dir.children
    .filter((entry) => !entry.meta.hidden && (opts.all || !entry.name.startsWith('.')))
    .sort(compare)
}

export function files(dir: DirEntry = root): FileEntry[] {
  return dir.children.flatMap((entry) => (entry.kind === 'dir' ? files(entry) : [entry]))
}

export function loadPage(file: FileEntry): Promise<Component | string> {
  return (pages[file.source] ?? texts[file.source])!()
}

export function urlFor(file: FileEntry): string {
  return file.path.replace(/^~/, '').replace(/\.md$/, '')
}

export function fromUrl(url: string, from: DirEntry = root): Entry | null {
  const path = `~${url.replace(/\/+$/, '')}`
  return resolve(`${path}.md`, '~', from) ?? resolve(path, '~', from)
}
