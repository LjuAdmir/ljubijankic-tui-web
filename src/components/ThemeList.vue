<script setup lang="ts">
import { themes } from '@/composables/useTheme'
import { useTerminalStore } from '@/stores/terminal'

// the theme when the list was printed, so older lists in the scrollback don't change
defineProps<{ current: string }>()

const colours = ['red', 'peach', 'yellow', 'green', 'blue', 'mauve']

const store = useTerminalStore()
</script>

<template>
  <div class="theme-list">
    <template v-for="theme in themes" :key="theme">
      <span class="marker">{{ theme === current ? '*' : '' }}</span>
      <button type="button" @click="store.execute(`theme ${theme}`)">{{ theme }}</button>
      <!-- the theme's variables apply to anything carrying the attribute, so this shows its own colours -->
      <span class="swatch" :data-webtui-theme="theme" aria-hidden="true">
        <span v-for="colour in colours" :key="colour" :style="{ background: `var(--${colour})` }" />
      </span>
    </template>
  </div>
</template>

<style scoped>
.theme-list {
  display: grid;
  grid-template-columns: 1ch auto auto;
  justify-content: start;
  column-gap: 2ch;
}

.marker {
  color: var(--mauve);
}

button {
  all: unset;
  cursor: pointer;
  text-decoration: underline;
  white-space: nowrap;
}

button:focus-visible {
  outline: 1px solid var(--foreground0);
}

/* shorter than a line, so the rows don't run into each other */
.swatch {
  display: flex;
  align-self: center;
  height: 0.75lh;
  padding: 0 1ch;
  background: var(--background0);
}

.swatch span {
  width: 2ch;
}
</style>
