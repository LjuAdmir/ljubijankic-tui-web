<script setup lang="ts">
defineProps<{ cwd: string }>()
</script>

<template>
  <span class="prompt-label">
    <span class="user">visitor@ljubijankic</span>
    <span class="path">
      <slot>{{ cwd }}</slot>
    </span>
    <span>&gt;</span>
  </span>
</template>

<style scoped>
.prompt-label {
  display: inline-flex;
  gap: 1ch;
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
