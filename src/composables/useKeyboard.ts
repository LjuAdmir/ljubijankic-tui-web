import { onMounted, onUnmounted } from 'vue'
import { useTerminalStore } from '@/stores/terminal'

export function useKeyboard(
  focusPrompt: () => void,
  pagerBody: () => HTMLElement | null | undefined,
) {
  const store = useTerminalStore()
  let isTouch = false

  function onKeydown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (store.mode === 'pager') return onPagerKey(event)
    if (isTouch || store.mode !== 'shell' || event.key.length !== 1) return

    const target = event.target as HTMLElement
    if (target.matches('input, textarea')) return
    // Space still activates a focused button or link.
    if (event.key === ' ' && target.matches('button, a')) return

    focusPrompt()
  }

  function onPagerKey(event: KeyboardEvent) {
    const body = pagerBody()
    const target = event.target as HTMLElement
    if (!body || (target.matches('button, a') && [' ', 'Enter'].includes(event.key))) return

    const line = parseFloat(getComputedStyle(body).lineHeight)
    const page = body.clientHeight - line
    switch (event.key) {
      case 'q':
      case 'Escape':
        store.closeFile()
        break
      case 'j':
      case 'ArrowDown':
        body.scrollBy(0, line)
        break
      case 'k':
      case 'ArrowUp':
        body.scrollBy(0, -line)
        break
      case ' ':
      case 'PageDown':
        body.scrollBy(0, page)
        break
      case 'PageUp':
        body.scrollBy(0, -page)
        break
      case 'g':
      case 'Home':
        body.scrollTo(0, 0)
        break
      case 'G':
      case 'End':
        body.scrollTo(0, body.scrollHeight)
        break
      default:
        return
    }
    event.preventDefault()
  }

  onMounted(() => {
    isTouch = window.matchMedia('(pointer: coarse)').matches
    if (!isTouch) focusPrompt()
    window.addEventListener('keydown', onKeydown)
  })

  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
}
