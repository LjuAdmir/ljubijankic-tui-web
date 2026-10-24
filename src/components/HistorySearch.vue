<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useHistory } from '@/composables/useHistory'
import { match } from '@/lib/fuzzy'

const props = defineProps<{ initial: string }>()
const emit = defineEmits<{ pick: [command: string]; cancel: [] }>()

const { entries } = useHistory()
const query = ref(props.initial)
const selected = ref(0)
const inputEl = useTemplateRef('search-input')

// each command once, newest first, so equal scores rank by recency
const commands = computed(() => [...new Set([...entries.value].reverse())])
const results = computed(() =>
  commands.value
    .flatMap((text) => {
      const found = match(query.value, text)
      return found ? [{ text, positions: found.positions, score: found.score }] : []
    })
    .sort((a, b) => b.score - a.score),
)
const shown = computed(() => results.value.slice(0, 8))

watch(query, () => (selected.value = 0))

function move(step: number) {
  selected.value = Math.min(Math.max(selected.value + step, 0), shown.value.length - 1)
}

function pick() {
  const result = shown.value[selected.value]
  if (result) emit('pick', result.text)
  else emit('cancel')
}

onMounted(() => inputEl.value?.focus())
</script>

<template>
  <div class="history-search" box-="square" shear-="top">
    <header>
      <span>history</span>
      <span>{{ results.length }}/{{ commands.length }}</span>
    </header>
    <!-- best match at the bottom, next to the search line -->
    <ul>
      <li
        v-for="(result, index) in shown"
        :key="result.text"
        :class="{ selected: index === selected }"
        @mousedown.prevent
        @click="emit('pick', result.text)"
      >
        <span class="marker">{{ index === selected ? '> ' : '  ' }}</span>
        <span
          v-for="(char, i) in result.text"
          :key="i"
          :class="{ hit: result.positions.includes(i) }"
          >{{ char }}</span
        >
      </li>
    </ul>
    <label>
      search:
      <input
        ref="search-input"
        v-model="query"
        aria-label="Search history"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        @blur="emit('cancel')"
        @keydown.enter.prevent="pick"
        @keydown.esc.prevent="emit('cancel')"
        @keydown.up.prevent="move(1)"
        @keydown.down.prevent="move(-1)"
        @keydown.ctrl.r.prevent.stop="move(1)"
      />
    </label>
  </div>
</template>

<style scoped>
.history-search {
  background: var(--background0);
}

header {
  display: flex;
  justify-content: space-between;
  padding: 0 1ch;
}

/* labels sit on the border, the background hides the line behind them */
header span {
  padding: 0 1ch;
  background: var(--background0);
}

header span:last-child {
  color: var(--foreground2);
}

ul {
  display: flex;
  flex-direction: column-reverse;
  padding: 0;
}

ul li::before {
  content: none;
}

li {
  white-space: pre;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.selected {
  background: var(--background1);
}

.marker {
  color: var(--mauve);
}

.hit {
  color: var(--mauve);
}

label {
  display: flex;
  gap: 1ch;
  color: var(--foreground2);
}

input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--foreground0);
  font: inherit;
}
</style>
