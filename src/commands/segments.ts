import { urlFor, type Entry } from '@/lib/fs'
import type { Segment } from './types'

export function entrySegment(entry: Entry, label: string): Segment {
  return entry.kind === 'dir'
    ? { text: label, command: [`cd ${entry.path}`, 'ls'], style: 'dir' }
    : { text: label, command: `open ${entry.path}`, href: urlFor(entry), style: 'file' }
}
