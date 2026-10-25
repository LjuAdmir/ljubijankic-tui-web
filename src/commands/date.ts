import type { Command } from './types'

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// GNU date's default output, e.g. `Sun Oct 25 14:03:12 CET 2026`, in the visitor's time zone
export function formatDate(date: Date): string {
  const zone = new Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value
  const time = [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')
  const day = String(date.getDate()).padStart(2, ' ')
  return `${days[date.getDay()]} ${months[date.getMonth()]} ${day} ${time} ${zone} ${date.getFullYear()}`
}

export default {
  name: 'date',
  summary: 'Print the current date and time',
  run(_args, ctx) {
    ctx.print([{ text: formatDate(new Date()) }])
  },
} satisfies Command
