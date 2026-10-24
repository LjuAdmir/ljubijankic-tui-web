<script setup lang="ts">
defineProps<{ cwd: string }>()
</script>

<template>
  <span class="prompt-label">
    <span class="user">visitor@ljubijankic</span> <span class="path">{{ cwd }}</span> &gt;
  </span>
</template>

<style scoped>
.prompt-label {
  display: inline-block;
  white-space: nowrap;
  margin-right: 1ch;
}

.user {
  color: var(--mauve);
}

.path {
  color: var(--blue);
}
</style>
