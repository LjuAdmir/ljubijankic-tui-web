<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from 'vue'
import { useTerminalStore } from '@/stores/terminal'
import { useHistory } from '@/composables/useHistory'
import PromptBreadcrumb from './PromptBreadcrumb.vue'
import PromptLabel from './PromptLabel.vue'
import HistorySearch from './HistorySearch.vue'

const store = useTerminalStore()
const input = ref('')
const inputEl = useTemplateRef('prompt-input')
const history = useHistory()
const searching = ref(false)

function submit() {
  const value = input.value
  input.value = ''
  history.add(value)
  store.execute(value)
}

function walk(entry: string | undefined) {
  if (entry !== undefined) input.value = entry
}

async function closeSearch(command?: string) {
  if (command !== undefined) input.value = command
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
      :initial="input"
      @pick="closeSearch"
      @cancel="closeSearch()"
    />
    <PromptLabel :cwd="store.cwd"><PromptBreadcrumb /></PromptLabel>
    <input
      ref="prompt-input"
      v-model="input"
      aria-label="Command"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      enterkeyhint="go"
      @input="history.reset()"
      @keydown.up.prevent="walk(history.older(input))"
      @keydown.down.prevent="walk(history.newer(input))"
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
