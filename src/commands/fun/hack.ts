import { prefersReducedMotion } from '@/lib/motion'
import { sleep } from '@/lib/sleep'
import type { Command, Line } from '../types'

const lines: Line[] = [
  [{ text: 'Initializing hack.exe...' }],
  [{ text: 'Bypassing firewall.............. done' }],
  [{ text: 'Decrypting the mainframe........ done' }],
  [{ text: 'Downloading more RAM............ done' }],
  [{ text: 'Enhance... enhance... ENHANCE.' }],
  [{ text: 'ACCESS GRANTED', style: 'accent' }],
  [],
  [{ text: 'Welcome in. You now have full access to... this exact same website.', style: 'muted' }],
]

export default {
  name: 'hack',
  summary: 'Hack the mainframe',
  hidden: true,
  async run(_args, ctx) {
    const instant = prefersReducedMotion()
    for (const line of lines) {
      ctx.print(line)
      if (!instant) await sleep(500)
    }
  },
} satisfies Command
