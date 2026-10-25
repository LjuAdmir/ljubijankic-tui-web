import { withBase } from '@/lib/site'
import type { Command } from '../types'

export default {
  name: 'hello',
  aliases: ['hi'],
  summary: 'Say hello',
  hidden: true,
  run(_args, ctx) {
    ctx.print([
      { text: 'Hello, visitor! Nice of you to say hi. If you want to talk, ' },
      { text: 'contact.md', command: 'open ~/contact.md', href: withBase('/contact') },
      { text: ' has where to find me.' },
    ])
  },
} satisfies Command
