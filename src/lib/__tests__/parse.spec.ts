import { describe, it, expect } from 'vitest'
import { hasFlag, parse, tokenize } from '../parse'

describe('tokenize', () => {
  it('splits on any whitespace and ignores extra spaces', () => {
    expect(tokenize('  ls   projects\tarticles  ')).toEqual(['ls', 'projects', 'articles'])
  })

  it('returns nothing for empty or blank input', () => {
    expect(tokenize('')).toEqual([])
    expect(tokenize('   ')).toEqual([])
  })

  it('keeps quoted text together', () => {
    expect(tokenize('echo "hello world"')).toEqual(['echo', 'hello world'])
    expect(tokenize("echo 'hello world'")).toEqual(['echo', 'hello world'])
  })

  it('keeps the other quote type inside quotes', () => {
    expect(tokenize(`echo "it's" 'say "hi"'`)).toEqual(['echo', "it's", 'say "hi"'])
  })

  it('joins quoted and unquoted parts of one word', () => {
    expect(tokenize('cat my" "file.md')).toEqual(['cat', 'my file.md'])
  })

  it('keeps empty quoted strings', () => {
    expect(tokenize('echo ""')).toEqual(['echo', ''])
  })

  it('treats an unclosed quote as running to the end', () => {
    expect(tokenize('echo "hello world')).toEqual(['echo', 'hello world'])
  })
})

describe('parse', () => {
  it('splits the command name from its args', () => {
    expect(parse('cd ~/projects')).toEqual({ name: 'cd', args: ['~/projects'] })
  })

  it('passes flags through as args', () => {
    expect(parse('ls -a')).toEqual({ name: 'ls', args: ['-a'] })
    expect(parse('rm -rf /')).toEqual({ name: 'rm', args: ['-rf', '/'] })
  })

  it('returns an empty name for blank input', () => {
    expect(parse('  ')).toEqual({ name: '', args: [] })
  })
})

describe('hasFlag', () => {
  it('finds short flags alone or grouped', () => {
    expect(hasFlag(['-a'], 'a', 'all')).toBe(true)
    expect(hasFlag(['-la'], 'a', 'all')).toBe(true)
    expect(hasFlag(['-l', '-a', 'path'], 'a', 'all')).toBe(true)
  })

  it('finds the long flag', () => {
    expect(hasFlag(['--all'], 'a', 'all')).toBe(true)
  })

  it('ignores other flags and plain args', () => {
    expect(hasFlag(['-l'], 'a', 'all')).toBe(false)
    expect(hasFlag(['--human-readable'], 'a', 'all')).toBe(false)
    expect(hasFlag(['about.md'], 'a', 'all')).toBe(false)
  })
})
