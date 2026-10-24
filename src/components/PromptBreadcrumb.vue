<script setup lang="ts">
import { computed } from 'vue'
import { useTerminalStore } from '@/stores/terminal'

const store = useTerminalStore()

const crumbs = computed(() => {
  const names = store.cwd.split('/')
  return names.map((name, index) => ({ name, path: names.slice(0, index + 1).join('/') }))
})
</script>

<template>
  <template v-for="(crumb, index) in crumbs" :key="crumb.path">
    <template v-if="index > 0">/</template>
    <button type="button" @click="store.execute(index ? [`cd ${crumb.path}`, 'ls'] : 'cd ~')">
      {{ crumb.name }}
    </button>
  </template>
</template>

<style scoped>
button {
  all: unset;
  cursor: pointer;
}

button:hover,
button:focus-visible {
  text-decoration: underline;
}
</style>
