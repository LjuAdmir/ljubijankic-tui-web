<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'

const emit = defineEmits<{ exit: [] }>()

// the D51 and its smoke, from sl by Toyoda Masashi
const body = [
  '      ====        ________                ___________ ',
  '  _D _|  |_______/        \\__I_I_____===__|_________| ',
  '   |(_)---  |   H\\________/ |   |        =|___ ___|   ',
  '   /     |  |   H  |  |     |   |         ||_| |_||   ',
  '  |      |  |   H  |__--------------------| [___] |   ',
  '  | ________|___H__/__|_____/[][]~\\_______|       |   ',
  '  |/ |   |-----------I_____I [][] []  D   |=======|__ ',
]
const wheels = [
  [
    '__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ',
    ' |/-=|___|=    ||    ||    ||    |_____/~\\___/        ',
    '  \\_/      \\O=====O=====O=====O_/      \\_/            ',
  ],
  [
    '__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ',
    ' |/-=|___|=O=====O=====O=====O   |_____/~\\___/        ',
    '  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/            ',
  ],
  [
    '__/ =| o |=-O=====O=====O=====O \\ ____Y___________|__ ',
    ' |/-=|___|=    ||    ||    ||    |_____/~\\___/        ',
    '  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/            ',
  ],
  [
    '__/ =| o |=-~O=====O=====O=====O\\ ____Y___________|__ ',
    ' |/-=|___|=    ||    ||    ||    |_____/~\\___/        ',
    '  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/            ',
  ],
  [
    '__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ',
    ' |/-=|___|=   O=====O=====O=====O|_____/~\\___/        ',
    '  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/            ',
  ],
  [
    '__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ',
    ' |/-=|___|=    ||    ||    ||    |_____/~\\___/        ',
    '  \\_/      \\_O=====O=====O=====O/      \\_/            ',
  ],
]
const coal = [
  '                              ',
  '                              ',
  '    _________________         ',
  '   _|                \\_____A  ',
  ' =|                        |  ',
  ' -|                        |  ',
  '__|________________________|_ ',
  '|__________________________|_ ',
  '   |_D__D__D_|  |_D__D__D_|   ',
  '    \\_/   \\_/    \\_/   \\_/    ',
]
const smoke = [
  [
    '(   )',
    '(    )',
    '(    )',
    '(   )',
    '(  )',
    '(  )',
    '( )',
    '( )',
    '()',
    '()',
    'O',
    'O',
    'O',
    'O',
    'O',
    ' ',
  ],
  [
    '(@@@)',
    '(@@@@)',
    '(@@@@)',
    '(@@@)',
    '(@@)',
    '(@@)',
    '(@)',
    '(@)',
    '@@',
    '@@',
    '@',
    '@',
    '@',
    '@',
    '@',
    ' ',
  ],
]
const smokeDy = [2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
const smokeDx = [-2, -1, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3]
const length = 83
const funnel = 7

const root = useTemplateRef('root')
const probe = useTemplateRef('probe')
const screen = ref('')
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  const puffs: { y: number; x: number; stage: number; kind: number }[] = []
  let x: number | undefined

  timer = setInterval(() => {
    // measured every frame: on mount the scrollback still takes space, and the window can resize
    const columns = Math.floor(root.value!.clientWidth / probe.value!.getBoundingClientRect().width)
    const rows = Math.floor(
      root.value!.clientHeight / parseFloat(getComputedStyle(root.value!).lineHeight),
    )
    const top = Math.max(6, Math.floor(rows / 2) - 5)
    x ??= columns
    if (x < -length) return emit('exit')

    const grid = Array.from({ length: rows }, () => Array<string>(columns).fill(' '))
    const draw = (y: number, left: number, text: string) => {
      const row = grid[y]
      if (!row) return
      for (let i = 0; i < text.length; i++) {
        if (left + i >= 0 && left + i < columns) row[left + i] = text[i]!
      }
    }

    // like sl: every 4 columns the puffs drift and a new one leaves the funnel
    if (x % 4 === 0) {
      for (const puff of puffs) {
        puff.y -= smokeDy[puff.stage]!
        puff.x += smokeDx[puff.stage]!
        if (puff.stage < smokeDy.length - 1) puff.stage++
      }
      puffs.push({ y: top - 1, x: x + funnel, stage: 0, kind: puffs.length % 2 })
    }
    for (const puff of puffs) draw(puff.y, puff.x, smoke[puff.kind]![puff.stage]!)

    const frame = [...body, ...wheels[(length + x) % wheels.length]!]
    for (const [i, line] of frame.entries()) {
      draw(top + i, x, line)
      draw(top + i, x + 53, coal[i]!)
    }

    screen.value = grid.map((row) => row.join('')).join('\n')
    x--
  }, 40)
})

onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div ref="root" class="sl" aria-label="A steam locomotive crosses the screen" role="img">
    <span ref="probe" class="probe" aria-hidden="true">0</span>{{ screen }}
  </div>
</template>

<style scoped>
.sl {
  position: relative;
  overflow: hidden;
  white-space: pre;
}

.probe {
  position: absolute;
  visibility: hidden;
}
</style>
