import { ref } from 'vue'
import { load, save } from '@/lib/storage'

const key = 'tui.history'
const limit = 50

// shared by every caller, so the prompt and the `history` command see the same list
const entries = ref<string[]>(load(key, []))

export function useHistory() {
  // ↑/↓ position, per caller
  let index = entries.value.length
  let prefix = ''

  function add(command: string) {
    command = command.trim()
    reset()
    if (!command || entries.value.at(-1) === command) return
    entries.value = [...entries.value, command].slice(-limit)
    index = entries.value.length
    save(key, entries.value)
  }

  function clear() {
    entries.value = []
    reset()
    save(key, [])
  }

  function reset() {
    index = entries.value.length
    prefix = ''
  }

  // only entries starting with what was typed before the first ↑, each command once (its newest use)
  function matches(i: number, current: string) {
    const entry = entries.value[i]!
    return entry.startsWith(prefix) && entry !== current && entries.value.lastIndexOf(entry) === i
  }

  function older(current: string): string | undefined {
    if (index === entries.value.length) prefix = current
    for (let i = index - 1; i >= 0; i--) {
      if (matches(i, current)) {
        index = i
        return entries.value[i]
      }
    }
  }

  function newer(current: string): string | undefined {
    if (index === entries.value.length) return
    for (let i = index + 1; i < entries.value.length; i++) {
      if (matches(i, current)) {
        index = i
        return entries.value[i]
      }
    }
    // past the newest entry, back to what was typed
    const typed = prefix
    reset()
    return typed
  }

  return { entries, add, clear, reset, older, newer }
}
