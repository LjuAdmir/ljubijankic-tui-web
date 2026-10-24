import { describe, expect, it } from 'vitest'
import { suggestCommand } from '..'

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
})
