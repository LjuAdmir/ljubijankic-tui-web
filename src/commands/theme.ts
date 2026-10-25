import { themes, useTheme } from '@/composables/useTheme'
import { matching } from '@/lib/complete'
import type { Command } from './types'

export default {
  name: 'theme',
  summary: 'List themes, or switch theme',
  usage: 'theme [name]',
  complete: (word) => matching(word, themes),
  run([name], ctx) {
    const { current, setTheme } = useTheme()

    if (!name) {
      ctx.printComponent('themes', { current: current.value })
      ctx.print([], [{ text: "Click a theme or type 'theme <name>'.", style: 'muted' }])
      return
    }

    if (!themes.includes(name)) {
      ctx.print(
        [{ text: `theme: unknown theme: ${name}`, style: 'error' }],
        [{ text: "Type 'theme' to list them.", style: 'muted' }],
      )
      return
    }

    setTheme(name)
    ctx.print([{ text: `theme: ${name}`, style: 'muted' }])
  },
} satisfies Command
