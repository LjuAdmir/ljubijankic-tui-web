import { describe, expect, it } from 'vitest'
import { closest, distance } from '../fuzzy'

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
