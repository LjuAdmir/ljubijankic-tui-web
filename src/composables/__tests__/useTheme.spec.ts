import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

const fresh = async () => (await import('../useTheme')).useTheme()

describe('useTheme', () => {
  it('starts with mocha', async () => {
    expect((await fresh()).current.value).toBe('catppuccin-mocha')
  })

  it('applies and saves a theme', async () => {
    const { current, setTheme } = await fresh()
    setTheme('catppuccin-latte')
    expect(current.value).toBe('catppuccin-latte')
    expect(document.documentElement.dataset.webtuiTheme).toBe('catppuccin-latte')
    expect((await fresh()).current.value).toBe('catppuccin-latte')
  })

  it('ignores an unknown saved theme', async () => {
    localStorage.setItem('tui.theme', JSON.stringify('solarized'))
    expect((await fresh()).current.value).toBe('catppuccin-mocha')
  })
})
