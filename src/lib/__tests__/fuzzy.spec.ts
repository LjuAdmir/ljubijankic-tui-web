import { describe, expect, it } from 'vitest'
import { closest, distance, match } from '../fuzzy'

describe('distance', () => {
  it.each([
    ['ls', 'ls', 0],
    ['lss', 'ls', 1],
    ['l', 'ls', 1],
    ['ks', 'ls', 1],
    ['sl', 'ls', 1],
    ['claer', 'clear', 1],
    ['hlep', 'help', 1],
    ['histroy', 'history', 1],
    ['', 'cd', 2],
    ['tree', 'pwd', 4],
  ])('%s → %s is %i', (a, b, expected) => {
    expect(distance(a, b)).toBe(expected)
    expect(distance(b, a)).toBe(expected)
  })
})

describe('closest', () => {
  const names = ['cat', 'cd', 'clear', 'help', 'history', 'ls', 'tree', 'll', 'neofetch']

  it('finds the command a typo meant', () => {
    expect(closest('lss', names)).toBe('ls')
    expect(closest('claer', names)).toBe('clear')
    expect(closest('neofecth', names)).toBe('neofetch')
    expect(closest('histry', names)).toBe('history')
  })

  it('picks the earlier candidate on a tie', () => {
    expect(closest('cs', names)).toBe('cd')
    expect(closest('lss', ['ls', 'less'])).toBe('ls')
    expect(closest('lss', ['less', 'ls'])).toBe('less')
  })

  it('allows one edit for short words and two for longer ones', () => {
    expect(closest('ct', names)).toBe('cat')
    expect(closest('hep', names)).toBe('help')
    expect(closest('xyz', names)).toBeUndefined()
    expect(closest('hstoy', names)).toBe('history')
    expect(closest('txxxe', names)).toBeUndefined()
  })
})

describe('match', () => {
  const rank = (query: string, texts: string[]) =>
    texts
      .map((text) => ({ text, result: match(query, text) }))
      .filter(({ result }) => result)
      .sort((a, b) => b.result!.score - a.result!.score)
      .map(({ text }) => text)

  it('matches letters in order, ignoring case', () => {
    expect(match('cdp', 'cd projects')?.positions).toEqual([0, 1, 3])
    expect(match('CD', 'cd ~')).not.toBeNull()
    expect(match('dc', 'cd ~')).toBeNull()
    expect(match('lsx', 'ls')).toBeNull()
  })

  it('matches everything with an empty query', () => {
    expect(match('', 'anything')).toEqual({ score: 0, positions: [] })
  })

  it('prefers runs and word starts', () => {
    expect(match('proj', 'open projects/tui-web.md')?.positions).toEqual([5, 6, 7, 8])
    expect(rank('tw', ['cat tree-wide', 'open projects/tui-web.md', 'twitter'])[0]).toBe('twitter')
    expect(rank('cd', ['echo cloud', 'cd projects', 'ls docs'])).toEqual([
      'cd projects',
      'echo cloud',
    ])
  })
})
