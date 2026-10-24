import { list, resolve, type Entry } from '@/lib/fs'
import { hasFlag } from '@/lib/parse'
import { entrySegment } from './segments'
import type { Command, Line } from './types'

function format(entry: Entry, label: string, width: number): Line {
  const type = entry.kind === 'dir' ? 'd' : '-'
  const date = entry.meta.date?.slice(0, 10) ?? '—'
  return [
    { text: `${type}  ${date.padEnd(10)}  `, style: 'muted' },
    entrySegment(entry, label),
    { text: `${' '.repeat(width - label.length + 2)}${entry.meta.description ?? '—'}` },
  ]
}

export default {
  name: 'ls',
  summary: 'List files',
  usage: 'ls [-a] [path]',
  run(args, ctx) {
    const all = hasFlag(args, 'a', 'all')
    const path = args.find((arg) => !arg.startsWith('-')) ?? '.'
    const target = resolve(path, ctx.cwd)
    if (!target) {
      ctx.print([{ text: `ls: no such file or directory: ${path}`, style: 'error' }])
      return
    }

    const rows: [Entry, string][] = []
    if (target.kind === 'file') rows.push([target, target.name])
    else {
      if (all) rows.push([target, './'])
      if (all && target.path !== '~') rows.push([resolve('..', target.path)!, '../'])
      for (const entry of list(target, { all })) {
        rows.push([entry, entry.kind === 'dir' ? `${entry.name}/` : entry.name])
      }
    }

    const width = Math.max(...rows.map(([, label]) => label.length))
    ctx.print(...rows.map(([entry, label]) => format(entry, label, width)))
  },
} satisfies Command
