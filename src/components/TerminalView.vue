<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from 'vue'
import { useTerminalStore } from '@/stores/terminal'
import { useKeyboard } from '@/composables/useKeyboard'
import OutputLine from './OutputLine.vue'
import PromptLine from './PromptLine.vue'
import BottomBar from './BottomBar.vue'
import FilePager from './FilePager.vue'
import ScrollArea from './ScrollArea.vue'

const store = useTerminalStore()
const scrollback = useTemplateRef('scrollback')
const prompt = useTemplateRef('prompt')
const pager = useTemplateRef('pager')

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
  <div :class="['terminal', { glitch: store.glitching }]">
    <!-- FilePager awaits its page, so prerendering and hydration include the content -->
    <Suspense>
      <FilePager
        v-if="store.openFile"
        ref="pager"
        :key="store.openFile.path"
        :file="store.openFile"
      />
    </Suspense>
    <!-- v-show keeps the scroll position while a file is open -->
    <ScrollArea v-show="!store.openFile" ref="scrollback" class="scrollback">
      <OutputLine v-for="entry in store.output" :key="entry.id" :entry="entry" />
    </ScrollArea>
    <PromptLine v-show="!store.openFile && store.connected" ref="prompt" />
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

@media (prefers-reduced-motion: reduce) {
  .glitch {
    animation: none;
    filter: invert(1);
  }
}
</style>
