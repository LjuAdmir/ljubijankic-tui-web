<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from 'vue'
import { useTerminalStore } from '@/stores/terminal'
import { useHistory } from '@/composables/useHistory'
import { completeInput } from '@/commands'
import { commonPrefix } from '@/lib/complete'
import type { Line } from '@/commands/types'
import PromptBreadcrumb from './PromptBreadcrumb.vue'
import PromptLabel from './PromptLabel.vue'
import HistorySearch from './HistorySearch.vue'

const store = useTerminalStore()
const inputEl = useTemplateRef('prompt-input')
const history = useHistory()
const searching = ref(false)

// candidates clicked in the output fill the prompt, typing continues there
watch(
  () => store.input,
  () => inputEl.value?.focus(),
)

function submit() {
  const value = store.input
  store.input = ''
  history.add(value)
  store.execute(value)
}

function walk(entry: string | undefined) {
  if (entry !== undefined) store.input = entry
}

const finish = (candidate: string) => (candidate.endsWith('/') ? candidate : `${candidate} `)
const label = (candidate: string) => candidate.replace(/^.*\/(?=.)/, '')

// set after a Tab with several candidates, further Tabs cycle through them
let cycle: { start: number; candidates: string[]; index: number; shown: string } | null = null

function complete(event: KeyboardEvent) {
  // an empty prompt keeps Tab for moving focus through the page
  if (!store.input.trim()) return
  event.preventDefault()

  if (cycle && store.input === cycle.shown) {
    cycle.index = (cycle.index + 1) % cycle.candidates.length
    store.input = store.input.slice(0, cycle.start) + cycle.candidates[cycle.index]
    cycle.shown = store.input
    return
  }

  const { start, candidates } = completeInput(store.input, store.cwd)
  const before = store.input.slice(0, start)
  cycle = null
  if (candidates.length === 1) store.input = before + finish(candidates[0]!)
  if (candidates.length < 2) return

  store.echo(store.input)
  store.print(
    candidates.flatMap((candidate, index): Line => [
      ...(index ? [{ text: '  ' }] : []),
      {
        text: label(candidate),
        fill: before + finish(candidate),
        style: candidate.endsWith('/') ? 'dir' : undefined,
      },
    ]),
  )
  store.input = before + commonPrefix(candidates)
  cycle = { start, candidates, index: -1, shown: store.input }
}

async function closeSearch(command?: string) {
  if (command !== undefined) store.input = command
  searching.value = false
  await nextTick()
  inputEl.value?.focus()
}

defineExpose({
  focus: () => inputEl.value?.focus(),
  search: () => (searching.value = true),
})
</script>

<template>
  <form class="prompt-line" @submit.prevent="submit">
    <HistorySearch
      v-if="searching"
      class="search"
      :initial="store.input"
      @pick="closeSearch"
      @cancel="closeSearch()"
    />
    <PromptLabel :cwd="store.cwd"><PromptBreadcrumb /></PromptLabel>
    <input
      ref="prompt-input"
      v-model="store.input"
      aria-label="Command"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      enterkeyhint="go"
      @input="history.reset()"
      @keydown.up.prevent="walk(history.older(store.input))"
      @keydown.down.prevent="walk(history.newer(store.input))"
      @keydown.tab="complete"
    />
  </form>
</template>

<style scoped>
.prompt-line {
  position: relative;
  display: flex;
  padding: 0 1ch;
}

.search {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
}

input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  caret-color: var(--foreground0);
}
</style>
