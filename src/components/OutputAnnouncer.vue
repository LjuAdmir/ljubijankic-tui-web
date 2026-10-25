<script setup lang="ts">
import { computed } from 'vue'
import { useTerminalStore, type OutputEntry } from '@/stores/terminal'
import { themes } from '@/composables/useTheme'

const store = useTerminalStore()

function describe(entry: OutputEntry): string {
  if (entry.kind === 'prompt') return ''
  if (entry.kind === 'line') {
    return entry.line
      .filter((segment) => !('decorative' in segment && segment.decorative))
      .map((segment) => segment.text)
      .join('')
      .trim()
  }
  switch (entry.name) {
    case 'lifefetch':
      return "Admir Ljubijankić's home screen. Type help to see available commands."
    case 'themes':
      return `Themes: ${themes.map((theme) => (theme === entry.props?.current ? `${theme} (current)` : theme)).join(', ')}`
    case 'cowsay':
      return `A cow says: ${entry.props?.text}`
  }
}

// the output since the last prompt, not the echoed command the visitor just typed or clicked
const lines = computed(() => {
  const start = store.output.map((entry) => entry.kind).lastIndexOf('prompt')
  return store.output
    .slice(start + 1)
    .map((entry) => ({ id: entry.id, text: describe(entry) }))
    .filter((line) => line.text)
})
</script>

<template>
  <div class="announcer" aria-live="polite">
    <p v-for="line in lines" :key="line.id">{{ line.text }}</p>
  </div>
</template>

<style scoped>
/* read by screen readers, invisible on screen */
.announcer {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
