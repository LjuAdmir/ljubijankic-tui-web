import type { FileEntry } from '@/lib/fs'

type Style = 'dir' | 'file' | 'error' | 'muted' | 'accent'

export type Segment =
  | { text: string; style?: Style; hang?: boolean } // hang: wrapped lines continue under it
  | { text: string; command: string | string[]; href?: string; style?: Style }
  | { text: string; href: string }
  | { text: string; fill: string; style?: Style } // clickable, puts the text in the prompt

export type Line = Segment[]

// components are stored by name, so the output stays serialisable for the prerendered state
export type OutputComponent = 'lifefetch' | 'themes' | 'cowsay'

// full-screen programs, they take the scrollback's place until a key stops them
export type Program = 'sl' | 'matrix'

// short full-screen animations: the rm -rf flicker, the Konami code
export type Effect = 'glitch' | 'party'

export interface CommandContext {
  cwd: string
  cd(path: string): void
  print(...lines: Line[]): void
  printComponent(name: OutputComponent, props?: Record<string, unknown>): void
  startProgram(name: Program): void
  open(file: FileEntry): void
  clear(): void
  effect(name: Effect): Promise<void>
  disconnect(): void
}

export interface Command {
  name: string
  aliases?: string[]
  summary: string
  usage?: string
  hidden?: boolean
  // only listed by `help -a`
  gag?: boolean
  // candidates for the word being typed, paths by default
  complete?: (word: string, cwd: string) => string[]
  run: (args: string[], ctx: CommandContext) => void | Promise<void>
}
