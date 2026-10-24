<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, useTemplateRef } from 'vue'

const viewport = useTemplateRef('viewport')
const content = useTemplateRef('content')
const size = reactive({ top: 0, height: 1, client: 1, line: 1 })

function update() {
  const el = viewport.value!
  size.top = el.scrollTop
  size.height = el.scrollHeight
  size.client = el.clientHeight
  size.line = parseFloat(getComputedStyle(el).lineHeight)
}

let observer: ResizeObserver | undefined
onMounted(() => {
  update()
  observer = new ResizeObserver(update)
  observer.observe(viewport.value!)
  observer.observe(content.value!)
})
onUnmounted(() => observer?.disconnect())

const overflows = computed(() => size.height > size.client + 1)
const progress = computed(() =>
  overflows.value ? Math.min(1, size.top / (size.height - size.client)) : 0,
)
const trackLines = computed(() => Math.floor(size.client / size.line))
const thumbLines = computed(() =>
  Math.max(1, Math.round((trackLines.value * size.client) / size.height)),
)
const thumbStart = computed(() =>
  Math.round(progress.value * (trackLines.value - thumbLines.value)),
)

// scroll distance per pixel of thumb movement
const scale = computed(
  () =>
    (size.height - size.client) /
    Math.max(size.line, (trackLines.value - thumbLines.value) * size.line),
)

let drag: { y: number; top: number } | null = null

function startDrag(event: PointerEvent) {
  ;(event.target as Element).setPointerCapture(event.pointerId)
  drag = { y: event.clientY, top: viewport.value!.scrollTop }
}

function moveDrag(event: PointerEvent) {
  if (drag) viewport.value!.scrollTop = drag.top + (event.clientY - drag.y) * scale.value
}

function stopDrag() {
  drag = null
}

function jump(event: PointerEvent) {
  const track = (event.target as Element).getBoundingClientRect()
  const thumb = thumbLines.value * size.line
  const ratio = (event.clientY - track.top - thumb / 2) / (track.height - thumb)
  viewport.value!.scrollTop = Math.min(1, Math.max(0, ratio)) * (size.height - size.client)
}

defineExpose({ viewport, overflows, progress })
</script>

<template>
  <div class="scroll-area">
    <div ref="viewport" class="viewport" @scroll.passive="update">
      <div ref="content"><slot /></div>
    </div>
    <div :class="['track', { hidden: !overflows }]" aria-hidden="true" @pointerdown.self="jump">
      <div
        class="thumb"
        :style="{ top: `${thumbStart}lh`, height: `${thumbLines}lh` }"
        @pointerdown="startDrag"
        @pointermove="moveDrag"
        @pointerup="stopDrag"
        @pointercancel="stopDrag"
      />
    </div>
  </div>
</template>

<style scoped>
.scroll-area {
  display: flex;
  min-height: 0;
}

.viewport {
  flex: 1;
  min-width: 0;
  padding-right: 1ch;
  overflow-y: auto;
  scrollbar-width: none;
}

.viewport::-webkit-scrollbar {
  display: none;
}

.track {
  position: relative;
  flex: none;
  width: 1ch;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
}

.track::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 50%;
  width: 2px;
  translate: -50%;
  background: var(--scroll-track, var(--foreground2));
}

.thumb {
  position: absolute;
  left: 0;
  width: 100%;
  background: var(--foreground1);
  touch-action: none;
}

.hidden {
  visibility: hidden;
}
</style>
