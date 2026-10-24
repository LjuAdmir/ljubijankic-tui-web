<script setup lang="ts">
import { useTerminalStore, type OutputEntry } from '@/stores/terminal'
import PromptLabel from './PromptLabel.vue'

defineProps<{ entry: OutputEntry }>()

const store = useTerminalStore()
</script>

<template>
  <div class="output-line">
    <template v-if="entry.kind === 'prompt'">
      <PromptLabel :cwd="entry.cwd" />{{ entry.input }}
    </template>
    <template v-else>
      <template v-for="(segment, index) in entry.line" :key="index">
        <a
          v-if="'command' in segment && segment.href"
          :href="segment.href"
          :class="['command', segment.style]"
          @click.exact.prevent="store.execute(segment.command)"
        >
          {{ segment.text }}
        </a>
        <button
          v-else-if="'command' in segment"
          type="button"
          :class="['command', segment.style]"
          @click="store.execute(segment.command)"
        >
          {{ segment.text }}
        </button>
        <a v-else-if="'href' in segment" :href="segment.href">{{ segment.text }}</a>
        <span v-else :class="segment.style">{{ segment.text }}</span>
      </template>
    </template>
  </div>
</template>

<style scoped>
.output-line {
  min-height: 1lh;
  white-space: pre-wrap;
}

.command {
  all: unset;
  cursor: pointer;
  text-decoration: underline;
}

.command:focus-visible {
  outline: 1px solid var(--foreground0);
}

a {
  color: inherit;
}

.dir {
  color: var(--blue);
}

.error {
  color: var(--red);
}

.muted {
  color: var(--foreground2);
}

.accent {
  color: var(--mauve);
}
</style>
