import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useHistory } from '../useHistory'

function setup(...commands: string[]) {
  const history = useHistory()
  for (const command of commands) history.add(command)
  return history
}

beforeEach(() => {
  useHistory().clear()
  localStorage.clear()
})

describe('useHistory', () => {
  it('keeps the last 50 commands', () => {
    const { entries } = setup(...Array.from({ length: 60 }, (_, i) => `echo ${i}`))
    expect(entries.value).toHaveLength(50)
    expect(entries.value[0]).toBe('echo 10')
    expect(entries.value.at(-1)).toBe('echo 59')
  })

  it('skips empty input and consecutive duplicates', () => {
    const { entries } = setup('ls', ' ls ', '', '   ', 'pwd', 'ls')
    expect(entries.value).toEqual(['ls', 'pwd', 'ls'])
  })

  it('saves to localStorage and loads it on start', async () => {
    setup('ls', 'pwd')
    expect(JSON.parse(localStorage.getItem('tui.history')!)).toEqual(['ls', 'pwd'])

    vi.resetModules()
    const fresh = await import('../useHistory')
    expect(fresh.useHistory().entries.value).toEqual(['ls', 'pwd'])
  })

  it('clears everything', () => {
    const { entries, clear } = setup('ls')
    clear()
    expect(entries.value).toEqual([])
    expect(localStorage.getItem('tui.history')).toBe('[]')
  })

  it('walks back and forth, restoring the draft', () => {
    const { older, newer } = setup('ls', 'pwd', 'tree')
    expect(older('')).toBe('tree')
    expect(older('tree')).toBe('pwd')
    expect(older('pwd')).toBe('ls')
    expect(older('ls')).toBeUndefined()
    expect(newer('ls')).toBe('pwd')
    expect(newer('pwd')).toBe('tree')
    expect(newer('tree')).toBe('')
    expect(newer('')).toBeUndefined()
  })

  it('only walks commands starting with what was typed', () => {
    const { older, newer } = setup('cd projects', 'ls', 'cd articles', 'pwd')
    expect(older('cd')).toBe('cd articles')
    expect(older('cd articles')).toBe('cd projects')
    expect(older('cd projects')).toBeUndefined()
    expect(newer('cd projects')).toBe('cd articles')
    expect(newer('cd articles')).toBe('cd')
  })

  it('shows each command once', () => {
    const { older } = setup('ls', 'pwd', 'ls', 'tree', 'ls')
    expect(older('')).toBe('ls')
    expect(older('ls')).toBe('tree')
    expect(older('tree')).toBe('pwd')
    expect(older('pwd')).toBeUndefined()
  })

  it('starts over after typing or submitting', () => {
    const history = setup('ls', 'pwd')
    history.older('')
    history.reset()
    expect(history.older('l')).toBe('ls')
    history.add('tree')
    expect(history.older('')).toBe('tree')
  })
})
