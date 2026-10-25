import type { Command } from '../types'

export default {
  name: 'exit',
  summary: 'Log out',
  gag: true,
  run(_args, ctx) {
    ctx.clear()
    ctx.print(
      [{ text: 'logout' }],
      [{ text: 'Connection to ljubijankic closed.' }],
      [],
      [
        { text: 'reconnect', command: 'lifefetch' },
        { text: ' or press any key', style: 'muted' },
      ],
    )
    ctx.disconnect()
  },
} satisfies Command
