import { ref } from 'vue'
import { load, save } from '@/lib/storage'

// index.html repeats this list in its no-flash script
export const themes = [
  'catppuccin-mocha',
  'catppuccin-macchiato',
  'catppuccin-frappe',
  'catppuccin-latte',
]

const key = 'tui.theme'
const fallback = themes[0]!
const stored = load(key, fallback)
const current = ref(themes.includes(stored) ? stored : fallback)

export function useTheme() {
  function setTheme(theme: string) {
    current.value = theme
    document.documentElement.dataset.webtuiTheme = theme
    save(key, theme)
  }

  return { current, setTheme }
}
