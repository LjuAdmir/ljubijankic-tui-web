import { withBase } from '@/lib/site'
import type { Command } from './types'

export default {
  name: 'whoami',
  summary: 'Print your user name',
  run(_args, ctx) {
    ctx.print(
      [{ text: 'visitor' }],
      [
        { text: "A curious one, apparently. Try '", style: 'muted' },
        { text: 'cat ~/about.md', command: 'cat ~/about.md', href: withBase('/about') },
        { text: "' to see who I am.", style: 'muted' },
      ],
    )
  },
} satisfies Command
