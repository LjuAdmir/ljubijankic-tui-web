import { onMounted, onUnmounted } from 'vue'
import { useTerminalStore } from '@/stores/terminal'

export function useKeyboard(focusPrompt: () => void) {
  const store = useTerminalStore()
  let isTouch = false

  function onKeydown(event: KeyboardEvent) {
    if (isTouch || store.mode !== 'shell') return
    if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return

    const target = event.target as HTMLElement
    if (target.matches('input, textarea')) return
    // Space still activates a focused button or link.
    if (event.key === ' ' && target.matches('button, a')) return

    focusPrompt()
  }

  onMounted(() => {
    isTouch = window.matchMedia('(pointer: coarse)').matches
    if (!isTouch) focusPrompt()
    window.addEventListener('keydown', onKeydown)
  })

  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
}
