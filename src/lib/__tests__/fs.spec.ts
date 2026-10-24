import { describe, expect, it } from 'vitest'
import { buildTree, fromUrl, list, loadPage, resolve, root, urlFor, type FileEntry } from '../fs'

const tree = buildTree(
  {
    '/content/about.md': { description: 'About', date: '2026-08-20T00:00:00.000Z' },
    '/content/contact.md': { description: 'Contact', date: '2026-09-01T00:00:00.000Z' },
    '/content/draft.md': { description: 'Draft', date: '2026-10-01T00:00:00.000Z', hidden: true },
    '/content/.secrets.md': { description: 'Secrets', date: '2026-01-01T00:00:00.000Z' },
    '/content/articles/index.md': { description: 'Articles', date: '2026-07-01T00:00:00.000Z' },
    '/content/articles/hello-world.md': { description: 'Hello', date: '2026-07-02T00:00:00.000Z' },
    '/content/projects/index.md': { description: 'Projects' },
    '/content/.ssh/id_rsa.md': { name: 'id_rsa', description: 'Key' },
  },
  ['/content/.ssh/known_hosts', '/content/notes.txt'],
)

const at = (path: string, cwd = '~') => resolve(path, cwd, tree)
const names = (path: string, all = false) => {
  const dir = at(path)
  return dir?.kind === 'dir' ? list(dir, { all }).map((entry) => entry.name) : null
}

describe('resolve', () => {
  it('resolves home', () => {
    expect(at('~')).toBe(tree)
    expect(at('$HOME')).toBe(tree)
    expect(at('', '~/articles')).toBe(at('~/articles'))
  })

  it('resolves absolute and relative paths', () => {
    expect(at('~/articles/hello-world.md')?.path).toBe('~/articles/hello-world.md')
    expect(at('$HOME/articles')?.kind).toBe('dir')
    expect(at('hello-world.md', '~/articles')?.path).toBe('~/articles/hello-world.md')
    expect(at('../about.md', '~/articles')?.path).toBe('~/about.md')
  })

  it('handles ., .. and trailing slashes', () => {
    expect(at('./articles/.')).toBe(at('~/articles'))
    expect(at('articles/')).toBe(at('~/articles'))
    expect(at('..', '~/articles')).toBe(tree)
    expect(at('../../..', '~/articles')).toBe(tree)
  })

  it('returns null for missing paths', () => {
    expect(at('nope')).toBeNull()
    expect(at('about.md/more')).toBeNull()
    expect(at('~nope')).toBeNull()
  })

  it('does not resolve paths starting with /', () => {
    expect(at('/')).toBeNull()
    expect(at('/about.md')).toBeNull()
  })

  it('finds hidden entries and drafts', () => {
    expect(at('.secrets.md')?.kind).toBe('file')
    expect(at('.ssh')?.kind).toBe('dir')
    expect(at('draft.md')?.kind).toBe('file')
  })

  it('uses the name override', () => {
    expect(at('~/.ssh/id_rsa')?.path).toBe('~/.ssh/id_rsa')
    expect(at('~/.ssh/id_rsa.md')).toBeNull()
  })

  it('keeps the source path', () => {
    expect(at('~/.ssh/id_rsa')).toMatchObject({ source: '/content/.ssh/id_rsa.md' })
    expect(at('notes.txt')).toMatchObject({ source: '/content/notes.txt', meta: {} })
  })
})

describe('list', () => {
  it('lists dirs A-Z, then files newest first', () => {
    expect(names('~')).toEqual(['articles', 'projects', 'contact.md', 'about.md', 'notes.txt'])
  })

  it('shows dot entries only with all', () => {
    expect(names('~', true)).toEqual([
      '.ssh',
      'articles',
      'projects',
      'contact.md',
      'about.md',
      '.secrets.md',
      'notes.txt',
    ])
  })

  it('never lists drafts', () => {
    expect(names('~', true)).not.toContain('draft.md')
  })

  it('does not list index.md but uses it for the dir', () => {
    expect(names('~/articles')).toEqual(['hello-world.md'])
    expect(at('~/articles')?.meta.description).toBe('Articles')
  })

  it('lists plain text files', () => {
    expect(names('~/.ssh')).toEqual(['id_rsa', 'known_hosts'])
  })
})

describe('urls', () => {
  const url = (path: string) => urlFor(at(path) as FileEntry)

  it('drops ~ and .md', () => {
    expect(url('~/articles/hello-world.md')).toBe('/articles/hello-world')
    expect(url('~/.secrets.md')).toBe('/.secrets')
    expect(url('~/notes.txt')).toBe('/notes.txt')
    expect(url('~/.ssh/id_rsa')).toBe('/.ssh/id_rsa')
  })

  it('round trips', () => {
    for (const path of [
      '~/about.md',
      '~/articles/hello-world.md',
      '~/notes.txt',
      '~/.ssh/id_rsa',
    ]) {
      expect(fromUrl(url(path), tree)).toBe(at(path))
    }
  })

  it('finds directories and ignores trailing slashes', () => {
    expect(fromUrl('/', tree)).toBe(tree)
    expect(fromUrl('/articles/', tree)).toBe(at('~/articles'))
    expect(fromUrl('/articles/hello-world/', tree)).toBe(at('~/articles/hello-world.md'))
  })

  it('returns null for unknown paths', () => {
    expect(fromUrl('/nope', tree)).toBeNull()
    expect(fromUrl('/about.md/x', tree)).toBeNull()
  })
})

describe('content', () => {
  it('builds the tree from content/', () => {
    expect(resolve('~/articles/hello-world.md', '~')?.meta.description).toBeTruthy()
    expect(root.children.length).toBeGreaterThan(0)
  })

  it('loads a markdown page as a component', async () => {
    const page = await loadPage(resolve('~/about.md', '~') as FileEntry)
    expect(typeof page).toBe('object')
  })
})
