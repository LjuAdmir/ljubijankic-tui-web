import { closest } from '@/lib/fuzzy'
import type { Command } from './types'
import cat from './cat'
import cd from './cd'
import clear from './clear'
import echo from './echo'
import help from './help'
import history from './history'
import lifefetch from './lifefetch'
import ls from './ls'
import pwd from './pwd'
import share from './share'
import tree from './tree'

const commands: Command[] = [cat, cd, clear, echo, help, history, lifefetch, ls, pwd, share, tree]

export function allCommands(): Command[] {
  return commands
}

export function findCommand(name: string): Command | undefined {
  return commands.find((command) => command.name === name || command.aliases?.includes(name))
}

// hidden commands are never suggested, so typos don't give the easter eggs away
export function suggestCommand(name: string): string | undefined {
  const visible = commands.filter((command) => !command.hidden)
  // main names win ties over aliases, so `lss` suggests ls rather than less
  const names = visible.map((command) => command.name).sort()
  const aliases = visible.flatMap((command) => command.aliases ?? []).sort()
  return closest(name, [...names, ...aliases])
}
