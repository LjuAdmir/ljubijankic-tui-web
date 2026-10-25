import { urlFor, type Entry } from '@/lib/fs'
import { withBase } from '@/lib/site'
import type { Segment } from './types'

// real links, so middle-click and screen readers work; a directory's URL runs cd and ls
export function entrySegment(entry: Entry, label: string): Segment {
  if (entry.path === '~') return { text: label, command: 'cd ~', href: withBase('/'), style: 'dir' }
  const href = withBase(urlFor(entry))
  return entry.kind === 'dir'
    ? { text: label, command: [`cd ${entry.path}`, 'ls'], href, style: 'dir' }
    : { text: label, command: `open ${entry.path}`, href, style: 'file' }
}
