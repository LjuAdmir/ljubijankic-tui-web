import { describe, expect, it } from 'vitest'
import { completeInput, suggestCommand } from '..'

describe('suggestCommand', () => {
  it('prefers command names over aliases on a tie', () => {
    expect(suggestCommand('lss')).toBe('ls')
    expect(suggestCommand('l')).toBe('ls')
  })

  it('still suggests aliases', () => {
    expect(suggestCommand('neofecth')).toBe('neofetch')
  })

  it('gives nothing for unrelated input', () => {
    expect(suggestCommand('xyz')).toBeUndefined()
  })

  it('never suggests gags', () => {
    expect(suggestCommand('sudi')).toBeUndefined()
  })
})

describe('completeInput', () => {
  const candidates = (input: string, cwd = '~') => completeInput(input, cwd).candidates

  it('completes command names and aliases first', () => {
    expect(candidates('c')).toEqual(['cat', 'cd', 'clear'])
    expect(candidates('  l')).toEqual(['less', 'lifefetch', 'll', 'ls'])
    expect(completeInput('h', '~')).toEqual({ start: 0, candidates: ['help', 'history'] })
    expect(candidates('e')).toEqual(['echo'])
  })

  it('completes paths for arguments', () => {
    expect(completeInput('cat a', '~')).toEqual({ start: 4, candidates: ['articles/', 'about.md'] })
    expect(candidates('ls -a projects/')).toEqual(['projects/tui-web.md'])
    expect(candidates('unknown a')).toEqual(['articles/', 'about.md'])
  })

  it("uses a command's own completion", () => {
    expect(candidates('cd a')).toEqual(['articles/'])
    expect(candidates('help hi')).toEqual(['history'])
  })
})
