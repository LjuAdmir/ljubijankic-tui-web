<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useTerminalStore } from '@/stores/terminal'
import PromptLabel from './PromptLabel.vue'

const store = useTerminalStore()
const input = ref('')
const inputEl = useTemplateRef('prompt-input')

function submit() {
  const value = input.value
  input.value = ''
  store.execute(value)
}

defineExpose({ focus: () => inputEl.value?.focus() })
</script>

<template>
  <form class="prompt-line" @submit.prevent="submit">
    <PromptLabel :cwd="store.cwd" />
    <input
      ref="prompt-input"
      v-model="input"
      aria-label="Command"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      enterkeyhint="go"
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
