import { allCommands, commandNames, findCommand } from '.'
import { matching } from '@/lib/complete'
import type { Command, Line } from './types'

export default {
  name: 'help',
  summary: 'List commands, or show how to use one',
  usage: 'help [command]',
  complete: (word) => matching(word, commandNames()),
  run(args, ctx) {
    const [name] = args

    if (name) {
      const command = findCommand(name)
      if (!command) {
        ctx.print([{ text: `help: no such command: ${name}`, style: 'error' }])
        return
      }

      const lines: Line[] = [
        [{ text: command.usage ?? command.name, style: 'accent' }],
        [{ text: `  ${command.summary}` }],
      ]
      if (command.aliases?.length) {
        lines.push([{ text: `  aliases: ${command.aliases.join(', ')}`, style: 'muted' }])
      }
      ctx.print(...lines)
      return
    }

    const commands = allCommands()
      .filter((command) => !command.hidden)
      .sort((a, b) => a.name.localeCompare(b.name))
    const width = Math.max(...commands.map((command) => command.name.length)) + 2

    ctx.print(
      [{ text: 'Available commands:' }],
      ...commands.map((command): Line => [
        { text: '  ' },
        { text: command.name, command: `help ${command.name}` },
        { text: ' '.repeat(width - command.name.length) + command.summary },
      ]),
      [],
      [{ text: "Click a command or type 'help <command>' for details.", style: 'muted' }],
    )
  },
} satisfies Command
