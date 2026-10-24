import { useHistory } from '@/composables/useHistory'
import { hasFlag } from '@/lib/parse'
import type { Command, Line } from './types'

export default {
  name: 'history',
  summary: 'Show the commands you typed',
  usage: 'history [-c]',
  run(args, ctx) {
    const { entries, clear } = useHistory()
    if (hasFlag(args, 'c', 'clear')) return clear()

    const width = String(entries.value.length).length
    ctx.print(
      ...entries.value.map((entry, index): Line => [
        { text: `${String(index + 1).padStart(width + 4)}  `, style: 'muted' },
        { text: entry, command: entry },
      ]),
    )
  },
} satisfies Command
