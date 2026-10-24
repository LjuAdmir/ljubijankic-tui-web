import { list, resolve, root, type DirEntry } from './fs'

// options starting with the word, sorted and without repeats
export function matching(word: string, options: string[]): string[] {
  return [...new Set(options.filter((option) => option.startsWith(word)))].sort()
}

// paths the word could become, directories end with `/`. Dotfiles only once the name starts with `.`
export function paths(
  word: string,
  cwd: string,
  opts: { dirs?: boolean } = {},
  from: DirEntry = root,
): string[] {
  const base = word.slice(0, word.lastIndexOf('/') + 1)
  const name = word.slice(base.length)
  const dir = resolve(base, cwd, from)
  if (dir?.kind !== 'dir') return []
  return list(dir, { all: name.startsWith('.') })
    .filter((entry) => entry.name.startsWith(name) && (!opts.dirs || entry.kind === 'dir'))
    .map((entry) => base + entry.name + (entry.kind === 'dir' ? '/' : ''))
}

export function commonPrefix(words: string[]): string {
  return words.reduce((prefix, word) => {
    let i = 0
    while (i < prefix.length && prefix[i] === word[i]) i++
    return prefix.slice(0, i)
  }, words[0] ?? '')
}
