import type { Command } from '../types'

const fortunes = [
  'You will be surprised by a loud noise.',
  'Your lucky number has been disconnected.',
  'You will have good luck and overcome many hardships.',
  'Today is the first day of the rest of the mess.',
  'Never put off till tomorrow what you can avoid altogether.',
  'Beware of low-flying butterflies.',
  'A day without sunshine is like night.',
  'You have a deep interest in all that is artistic.',
  "Don't look back, the lemmings are gaining on you.",
  'You will be advanced socially, without any special effort on your part.',
  'Everything will be all right in the end. If it is not all right, it is not the end.',
  'You are fighting for survival in your own sweet and gentle way.',
  'Try to relax and enjoy the crisis.',
  "If at first you don't succeed, redefine success.",
  'You will soon meet a person who will play an important role in your life.',
  "Help! I'm trapped in a fortune cookie factory!",
  'It is a good day to have a good day.',
  'Avoid reality at all costs.',
  'You will step on the soil of many countries.',
  'There is no time like the present for postponing what you ought to be doing.',
]

export default {
  name: 'fortune',
  summary: 'Print a random fortune',
  run(_args, ctx) {
    ctx.print([{ text: fortunes[Math.floor(Math.random() * fortunes.length)]! }])
  },
} satisfies Command
