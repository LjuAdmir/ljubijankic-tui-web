<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useTerminalStore, type OutputEntry } from '@/stores/terminal'
import type { OutputComponent, Segment } from '@/commands/types'
import PromptLabel from './PromptLabel.vue'
import LifeFetch from './LifeFetch.vue'
import ThemeList from './ThemeList.vue'
import CowSay from './CowSay.vue'

const props = defineProps<{ entry: OutputEntry }>()

const components: Record<OutputComponent, Component> = {
  lifefetch: LifeFetch,
  themes: ThemeList,
  cowsay: CowSay,
}

const store = useTerminalStore()

const segments = computed<Segment[]>(() => (props.entry.kind === 'line' ? props.entry.line : []))

// wrapped lines continue under the `hang` segment, so columns (ls, help) stay aligned
const indent = computed(() => {
  const index = segments.value.findIndex((segment) => 'hang' in segment && segment.hang)
  if (index < 0) return undefined
  const width = segments.value
    .slice(0, index)
    .reduce((sum, segment) => sum + segment.text.length, 0)
  return { paddingLeft: `${width}ch`, textIndent: `-${width}ch` }
})

// a line with one link or command is tappable across its whole width on touch screens
const single = computed(
  () =>
    segments.value.filter(
      (segment) => 'command' in segment || 'fill' in segment || 'href' in segment,
    ).length === 1,
)
</script>

<template>
  <div :class="['output-line', { single }]" :style="indent">
    <template v-if="entry.kind === 'prompt'">
      <PromptLabel :cwd="entry.cwd" />{{ entry.input }}
    </template>
    <component
      :is="components[entry.name]"
      v-else-if="entry.kind === 'component'"
      v-bind="entry.props"
    />
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
        <button
          v-else-if="'fill' in segment"
          type="button"
          :class="['command', segment.style]"
          @click="store.input = segment.fill"
        >
          {{ segment.text }}
        </button>
        <a v-else-if="'href' in segment" :href="segment.href">{{ segment.text }}</a>
        <span
          v-else
          :class="segment.style"
          :aria-hidden="'decorative' in segment && segment.decorative ? 'true' : undefined"
        >
          {{ segment.text }}
        </span>
      </template>
    </template>
  </div>
</template>

<style scoped>
.output-line {
  min-height: 1lh;
  white-space: pre-wrap;
  /* WebTUI breaks anywhere; break at spaces, and inside a word only when it doesn't fit */
  word-break: normal;
  overflow-wrap: anywhere;
}

@media (pointer: coarse) {
  .single {
    position: relative;
  }

  .single :is(.command, a)::after {
    content: '';
    position: absolute;
    inset: 0;
  }
}

.command {
  all: unset;
  /* buttons stay inline-blocks, so they'd apply the line's hanging indent to their own text */
  text-indent: 0;
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
