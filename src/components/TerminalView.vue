<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch, type Component } from 'vue'
import { useTerminalStore } from '@/stores/terminal'
import { useKeyboard } from '@/composables/useKeyboard'
import OutputLine from './OutputLine.vue'
import PromptLine from './PromptLine.vue'
import BottomBar from './BottomBar.vue'
import FilePager from './FilePager.vue'
import ScrollArea from './ScrollArea.vue'
import SlTrain from './SlTrain.vue'
import MatrixRain from './MatrixRain.vue'
import type { Program } from '@/commands/types'

const store = useTerminalStore()
const scrollback = useTemplateRef('scrollback')
const prompt = useTemplateRef('prompt')
const pager = useTemplateRef('pager')

const programs: Record<Program, Component> = { sl: SlTrain, matrix: MatrixRain }
const shell = computed(() => !store.openFile && !store.program)

useKeyboard(
  () => prompt.value,
  () => pager.value,
)

// also when the pager closes: lines printed while it was open couldn't scroll a hidden scrollback
watch(
  () => (store.openFile ? null : store.output.at(-1)?.id),
  async () => {
    await nextTick()
    scrollback.value?.viewport?.scrollTo({ top: scrollback.value.viewport.scrollHeight })
  },
  { flush: 'post' },
)
</script>

<template>
  <div :class="['terminal', store.effect]">
    <!-- FilePager awaits its page, so prerendering and hydration include the content -->
    <Suspense>
      <FilePager
        v-if="store.openFile"
        ref="pager"
        :key="store.openFile.path"
        :file="store.openFile"
      />
    </Suspense>
    <div v-if="store.program" class="program" @click="store.stopProgram()">
      <component :is="programs[store.program]" @exit="store.stopProgram()" />
    </div>
    <!-- v-show keeps the scroll position while a file or program is open -->
    <ScrollArea v-show="shell" ref="scrollback" class="scrollback">
      <OutputLine v-for="entry in store.output" :key="entry.id" :entry="entry" />
    </ScrollArea>
    <PromptLine v-show="shell && store.connected" ref="prompt" />
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
  padding: 1lh 0 0 1ch;
}

.program {
  position: relative;
  flex: 1;
  cursor: pointer;
}

.program > * {
  position: absolute;
  inset: 0;
}

/* the rm -rf meltdown: three inversions at most, the limit for flashing content */
.glitch {
  /* the page background is on body, out of the filter's reach */
  background-color: var(--background0);
  animation: glitch 1.2s steps(1) both;
}

@keyframes glitch {
  0% {
    filter: invert(1);
  }
  8% {
    filter: invert(1) brightness(1.4);
  }
  14% {
    filter: none;
  }
  30% {
    filter: invert(1) hue-rotate(90deg);
  }
  38% {
    filter: invert(1) hue-rotate(90deg) brightness(0.7);
  }
  46% {
    filter: none;
  }
  64% {
    filter: invert(1) contrast(1.5);
  }
  72% {
    filter: invert(1) brightness(1.4);
  }
  84% {
    filter: none;
  }
}

/* the Konami code */
.party {
  animation: party 1s linear 3;
}

@keyframes party {
  from {
    filter: saturate(3) hue-rotate(0deg);
  }
  to {
    filter: saturate(3) hue-rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .glitch {
    animation: none;
    filter: invert(1);
  }
}
</style>
