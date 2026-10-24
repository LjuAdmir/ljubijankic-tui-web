<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useTerminalStore } from '@/stores/terminal'
import { useHistory } from '@/composables/useHistory'
import PromptBreadcrumb from './PromptBreadcrumb.vue'
import PromptLabel from './PromptLabel.vue'

const store = useTerminalStore()
const input = ref('')
const inputEl = useTemplateRef('prompt-input')
const history = useHistory()

function submit() {
  const value = input.value
  input.value = ''
  history.add(value)
  store.execute(value)
}

function walk(entry: string | undefined) {
  if (entry !== undefined) input.value = entry
}

defineExpose({ focus: () => inputEl.value?.focus() })
</script>

<template>
  <form class="prompt-line" @submit.prevent="submit">
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
  display: flex;
  padding: 0 1ch;
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
