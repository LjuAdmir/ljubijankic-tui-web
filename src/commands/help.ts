import { allCommands, commandNames, findCommand } from '.'
import { matching } from '@/lib/complete'
import { hasFlag } from '@/lib/parse'
import type { Command, Line } from './types'

export default {
  name: 'help',
  summary: 'List commands, or show how to use one',
  usage: 'help [-a] [command]',
  complete: (word) => matching(word, commandNames()),
  run(args, ctx) {
    const [name] = args.filter((arg) => !arg.startsWith('-'))

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

    const all = hasFlag(args, 'a', 'all')
    const listed = allCommands()
      .filter((command) => !command.hidden && (all || !command.gag))
      .sort((a, b) => a.name.localeCompare(b.name))
    const width = Math.max(...listed.map((command) => command.name.length)) + 2
    const rows = (commands: Command[]) =>
      commands.map((command): Line => [
        { text: '  ' },
        { text: command.name, command: `help ${command.name}` },
        { text: ' '.repeat(width - command.name.length) + command.summary },
      ])

    const lines: Line[] = [
      [{ text: 'Available commands:' }],
      ...rows(listed.filter((command) => !command.gag)),
    ]
    if (all) {
      lines.push(
        [],
        [{ text: "Things you probably shouldn't run:" }],
        ...rows(listed.filter((command) => command.gag)),
      )
    }
    lines.push(
      [],
      [{ text: "Click a command or type 'help <command>' for details.", style: 'muted' }],
    )
    if (!all) {
      lines.push([
        { text: 'Some commands are hidden, like dotfiles. You know the flag.', style: 'muted' },
      ])
    }
    ctx.print(...lines)
  },
} satisfies Command
