<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { cowsay } from '@/lib/cowsay'

const props = defineProps<{ text: string }>()

const root = useTemplateRef('root')
const probe = useTemplateRef('probe')
const columns = ref(44)
// the bubble's borders take 4 columns; real cowsay wraps at 40
const lines = computed(() => cowsay(props.text, Math.max(10, Math.min(40, columns.value - 4))))

let observer: ResizeObserver | undefined

onMounted(() => {
  observer = new ResizeObserver(() => {
    columns.value = Math.floor(root.value!.clientWidth / probe.value!.getBoundingClientRect().width)
  })
  observer.observe(root.value!)
})

onUnmounted(() => observer?.disconnect())
</script>

<template>
  <div ref="root" class="cowsay">
    <span ref="probe" class="probe" aria-hidden="true">0</span>{{ lines.join('\n') }}
  </div>
</template>

<style scoped>
.cowsay {
  position: relative;
}

.probe {
  position: absolute;
  visibility: hidden;
}
</style>
