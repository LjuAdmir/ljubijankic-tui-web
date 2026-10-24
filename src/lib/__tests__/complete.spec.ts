import { describe, expect, it } from 'vitest'
import { buildTree } from '../fs'
import { commonPrefix, matching, paths } from '../complete'

const tree = buildTree(
  {
    '/content/about.md': {},
    '/content/articles/index.md': {},
    '/content/articles/hello-world.md': {},
    '/content/draft.md': { hidden: true },
    '/content/.secrets.md': {},
    '/content/.ssh/id_rsa.md': { name: 'id_rsa' },
  },
  ['/content/.ssh/known_hosts'],
)

const at = (word: string, cwd = '~', opts = {}) => paths(word, cwd, opts, tree)

describe('matching', () => {
  it('keeps options starting with the word, sorted and unique', () => {
    expect(matching('c', ['clear', 'cd', 'ls', 'cat', 'cd'])).toEqual(['cat', 'cd', 'clear'])
    expect(matching('', ['ls', 'cd'])).toEqual(['cd', 'ls'])
    expect(matching('x', ['ls'])).toEqual([])
  })
})

describe('paths', () => {
  it('completes names in the current directory, directories get a slash', () => {
    expect(at('a')).toEqual(['articles/', 'about.md'])
    expect(at('art')).toEqual(['articles/'])
    expect(at('nope')).toEqual([])
  })

  it('completes inside other directories, keeping what was typed', () => {
    expect(at('articles/h')).toEqual(['articles/hello-world.md'])
    expect(at('~/articles/')).toEqual(['~/articles/hello-world.md'])
    expect(at('../a', '~/articles')).toEqual(['../articles/', '../about.md'])
    expect(at('h', '~/articles')).toEqual(['hello-world.md'])
  })

  it('only offers dotfiles once the name starts with a dot', () => {
    expect(at('')).not.toContain('.secrets.md')
    expect(at('.')).toEqual(['.ssh/', '.secrets.md'])
    expect(at('.ssh/')).toEqual(['.ssh/id_rsa', '.ssh/known_hosts'])
  })

  it('never offers drafts', () => {
    expect(at('d')).toEqual([])
  })

  it('can offer directories only', () => {
    expect(at('a', '~', { dirs: true })).toEqual(['articles/'])
  })

  it('gives nothing for paths through files or missing directories', () => {
    expect(at('about.md/')).toEqual([])
    expect(at('nope/a')).toEqual([])
  })
})

describe('commonPrefix', () => {
  it('finds the shared start', () => {
    expect(commonPrefix(['articles/', 'about.md'])).toBe('a')
    expect(commonPrefix(['clear', 'cd'])).toBe('c')
    expect(commonPrefix(['ls'])).toBe('ls')
    expect(commonPrefix([])).toBe('')
  })
})
