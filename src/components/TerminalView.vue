<script setup lang="ts">
import { useTemplateRef, watch } from 'vue'
import { useTerminalStore } from '@/stores/terminal'
import { useKeyboard } from '@/composables/useKeyboard'
import OutputLine from './OutputLine.vue'
import PromptLine from './PromptLine.vue'
import BottomBar from './BottomBar.vue'

const store = useTerminalStore()
const scrollback = useTemplateRef('scrollback')
const prompt = useTemplateRef('prompt')

useKeyboard(() => prompt.value?.focus())

watch(
  () => store.output.at(-1)?.id,
  () => scrollback.value?.scrollTo({ top: scrollback.value.scrollHeight }),
  { flush: 'post' },
)
</script>

<template>
  <div class="terminal">
    <div ref="scrollback" class="scrollback">
      <OutputLine v-for="entry in store.output" :key="entry.id" :entry="entry" />
    </div>
    <PromptLine ref="prompt" />
    <BottomBar />
  </div>
</template>

<style scoped>
.terminal {
  display: flex;
  flex-direction: column;
  height: 100dvh;
}

.scrollback {
  flex: 1;
  overflow-y: auto;
  padding: 1lh 1ch 0;
}
</style>
