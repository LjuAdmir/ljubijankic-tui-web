import { nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useTerminalStore } from '@/stores/terminal'
import { prefersReducedMotion } from '@/lib/motion'

const konami = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
].join()
const modifiers = ['Shift', 'Control', 'Alt', 'Meta']

interface Prompt {
  focus(): void
  search(): void
  cancel(): void
}

interface Pager {
  body: HTMLElement | null | undefined
  share(): void
}

export function useKeyboard(
  prompt: () => Prompt | null | undefined,
  pager: () => Pager | null | undefined,
) {
  const store = useTerminalStore()
  let isTouch = false
  let recent: string[] = []

  function onKeydown(event: KeyboardEvent) {
    if (isKonami(event)) return party(event)
    if (store.mode === 'program') return onProgramKey(event)
    if (!store.connected) return onDisconnectedKey(event)
    if (event.ctrlKey || event.metaKey || event.altKey) {
      if (store.mode === 'shell' && event.ctrlKey && !event.altKey && !event.metaKey) {
        onShellShortcut(event)
      }
      return
    }
    if (store.mode === 'pager') return onPagerKey(event)
    if (isTouch || store.mode !== 'shell' || event.key.length !== 1) return

    const target = event.target as HTMLElement
    if (target.matches('input, textarea')) return
    // Space still activates a focused button or link.
    if (event.key === ' ' && target.matches('button, a')) return

    prompt()?.focus()
  }

  // works everywhere, also while typing: the arrows still walk history on the way
  function isKonami(event: KeyboardEvent) {
    if (modifiers.includes(event.key)) return false
    recent = [...recent, event.key.length === 1 ? event.key.toLowerCase() : event.key].slice(-10)
    return recent.join() === konami
  }

  function party(event: KeyboardEvent) {
    // the final A isn't typed, and the B and history entry the code left behind are cleared
    event.preventDefault()
    recent = []
    store.input = ''
    store.print([{ text: 'Konami code accepted. +30 lives.', style: 'accent' }])
    if (!prefersReducedMotion()) store.playEffect('party')
  }

  function onProgramKey(event: KeyboardEvent) {
    if (modifiers.includes(event.key)) return
    store.stopProgram()
    // the key only stops the program; browser shortcuts with Alt or Meta still work
    if (!event.altKey && !event.metaKey) event.preventDefault()
  }

  // the prompt was hidden while a program or file was open, so it lost focus. A file hands
  // focus back to what opened it first, so the prompt only gets it when nothing else did
  watch(
    () => store.mode,
    async (_, previous) => {
      if (previous === 'shell' || isTouch) return
      await nextTick()
      if (previous === 'program' || document.activeElement === document.body) prompt()?.focus()
    },
  )

  // after `exit`, any key reconnects
  async function onDisconnectedKey(event: KeyboardEvent) {
    const target = event.target as HTMLElement
    if (event.ctrlKey || event.metaKey || event.altKey || target.matches('button, a')) return
    if (event.key.length !== 1 && event.key !== 'Enter') return

    event.preventDefault()
    await store.execute('lifefetch')
    await nextTick()
    prompt()?.focus()
  }

  // handled here rather than on the input, so they work wherever focus is and the browser
  // doesn't reload or jump to the address bar
  function onShellShortcut(event: KeyboardEvent) {
    switch (event.key) {
      case 'r':
        prompt()?.search()
        break
      case 'l':
        store.clear()
        break
      case 'c':
        // copying selected text still works
        if (hasSelection(event.target)) return
        prompt()?.cancel()
        break
      default:
        return
    }
    event.preventDefault()
  }

  function hasSelection(target: EventTarget | null) {
    if (target instanceof HTMLInputElement) return target.selectionStart !== target.selectionEnd
    return !!getSelection()?.toString()
  }

  function onPagerKey(event: KeyboardEvent) {
    const body = pager()?.body
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
      case 's':
        pager()!.share()
        break
      default:
        return
    }
    event.preventDefault()
  }

  onMounted(() => {
    isTouch = window.matchMedia('(pointer: coarse)').matches
    if (!isTouch) prompt()?.focus()
    window.addEventListener('keydown', onKeydown)
  })

  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
}
