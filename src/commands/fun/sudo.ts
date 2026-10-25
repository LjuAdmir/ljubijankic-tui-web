import type { Command } from '../types'

export default {
  name: 'sudo',
  summary: 'Run a command as root',
  usage: 'sudo <command>',
  gag: true,
  run(_args, ctx) {
    ctx.print([
      {
        text: 'visitor is not in the sudoers file. This incident will be reported.',
        style: 'error',
      },
    ])
  },
} satisfies Command
