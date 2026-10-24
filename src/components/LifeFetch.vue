<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { useTerminalStore } from '@/stores/terminal'

const letters = [
  ['', ''],
  [' █████', '██'],
  ['██   ██', '██'],
  ['███████', '██'],
  ['██   ██', '██'],
  ['██   ██', '███████'],
  ['', ''],
] as const

// runs of █ get a solid background, which hides the seams browsers leave between block glyphs
function runs(text: string, colour: string) {
  return text
    .split(/(█+)/)
    .filter(Boolean)
    .map((run) => ({ text: run, class: run.startsWith('█') ? `${colour} fill` : '' }))
}

const logo = letters.map(([a, l]) => [
  { text: '│  ', class: 'frame' },
  ...runs(a.padEnd(8), 'a'),
  ...runs(l.padEnd(8), 'l'),
  { text: '│', class: 'frame' },
])

const info = reactive({
  Name: 'Admir Ljubijankić',
  Uptime: '',
  Location: 'Slovenia',
  Occupation: 'Web Developer',
  Employment: 'Employed @',
  OS: 'Arch Linux',
  CPU: 'AMD Ryzen 7 9800X3D (16) @ 5.27 GHz',
  GPU: 'AMD Radeon RX 9070XT',
  RAM: '64 GB',
})

const colours = ['red', 'peach', 'yellow', 'green', 'teal', 'blue', 'mauve', 'pink']
const title = 'visitor@ljubijankic'

const store = useTerminalStore()

// set after mounting, the prerendered HTML was built on a different day
onMounted(() => {
  const now = new Date()
  const birthday = new Date(now.getFullYear(), 2, 3)
  const years = now.getFullYear() - 1997 - (now < birthday ? 1 : 0)
  const isBirthday = now.getMonth() === 2 && now.getDate() === 3
  info.Uptime = `${years} years${isBirthday ? ' 🎂' : ''}`
})
</script>

<template>
  <div class="lifefetch">
    <div class="logo" aria-hidden="true">
      <div class="frame">╭──────────────────╮</div>
      <div v-for="(row, index) in logo" :key="index">
        <span v-for="(run, i) in row" :key="i" :class="run.class">{{ run.text }}</span>
      </div>
      <div class="frame">╰──────────────────╯</div>
    </div>

    <div>
      <div class="key">{{ title }}</div>
      <div class="frame">{{ '─'.repeat(title.length) }}</div>
      <div class="rows">
        <template v-for="(value, key) in info" :key="key">
          <span class="key">{{ key }}</span>
          <span
            >{{ value }}
            <a
              v-if="key === 'Employment'"
              href="https://agiledrop.com"
              target="_blank"
              rel="noopener"
              >Agiledrop</a
            ></span
          >
        </template>
      </div>
      <div class="colours" aria-hidden="true">
        <span
          v-for="colour in colours"
          :key="colour"
          :style="{ backgroundColor: `var(--${colour})` }"
        >
          ███
        </span>
      </div>
    </div>

    <p class="tip">
      Tip: type '<button type="button" @click="store.execute('help')">help</button>' to see
      available commands.
    </p>
  </div>
</template>

<style scoped>
.lifefetch {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 5ch;
  white-space: normal;
  word-break: normal;
}

.logo {
  white-space: pre;
  line-height: 1.1;
}

.frame {
  color: var(--foreground2);
}

.a {
  color: var(--mauve);
}

.l {
  color: var(--blue);
}

.key {
  color: var(--mauve);
}

.fill {
  background-color: currentColor;
}

.rows {
  display: grid;
  grid-template-columns: 12ch 1fr;
}

.colours {
  display: flex;
  gap: 1ch;
  margin-top: 1lh;
  color: transparent;
}

.tip {
  grid-column: 1 / -1;
  margin: 1lh 0;
}

a {
  color: inherit;
}

button {
  all: unset;
  cursor: pointer;
  text-decoration: underline;
}

@media (max-width: 48rem) {
  .lifefetch {
    grid-template-columns: 1fr;
    row-gap: 1lh;
  }

  .tip {
    margin-top: 0;
  }
}
</style>
