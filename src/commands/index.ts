import type { Command } from './types'
import cd from './cd'
import clear from './clear'
import echo from './echo'
import help from './help'
import ls from './ls'
import pwd from './pwd'

const commands: Command[] = [cd, clear, echo, help, ls, pwd]

export function allCommands(): Command[] {
  return commands
}

export function findCommand(name: string): Command | undefined {
  return commands.find((command) => command.name === name || command.aliases?.includes(name))
}
