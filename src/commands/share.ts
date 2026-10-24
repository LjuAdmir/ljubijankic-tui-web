import { resolve, urlFor } from '@/lib/fs'
import { share } from '@/lib/share'
import type { Command } from './types'

export default {
  name: 'share',
  summary: "Copy a file's link",
  usage: 'share <file>',
  async run([path], ctx) {
    if (!path) {
      ctx.print(
        [{ text: 'share: missing file', style: 'error' }],
        [{ text: 'usage: share <file>', style: 'muted' }],
      )
      return
    }

    const entry = resolve(path, ctx.cwd)
    if (entry?.kind !== 'file') {
      const reason = entry ? 'is a directory' : 'no such file'
      ctx.print([{ text: `share: ${path}: ${reason}`, style: 'error' }])
      return
    }

    const url = location.origin + urlFor(entry)
    const result = await share(url, entry.meta.title ?? entry.name)
    if (result === 'copied')
      ctx.print([
        { text: 'copied: ', style: 'muted' },
        { text: url, href: url },
      ])
    if (result === 'failed') ctx.print([{ text: url, href: url }])
  },
} satisfies Command
