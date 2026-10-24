type Style = 'dir' | 'file' | 'error' | 'muted' | 'accent'

export type Segment =
  | { text: string; style?: Style }
  | { text: string; command: string | string[]; style?: Style }
  | { text: string; href: string }

export type Line = Segment[]

export interface CommandContext {
  cwd: string
  cd(path: string): void
  print(...lines: Line[]): void
  clear(): void
}

export interface Command {
  name: string
  aliases?: string[]
  summary: string
  usage?: string
  hidden?: boolean
  run: (args: string[], ctx: CommandContext) => void | Promise<void>
}
