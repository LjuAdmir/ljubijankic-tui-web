<script setup lang="ts">
import { computed, shallowRef, type Component } from 'vue'
import { loadPage, type FileEntry } from '@/lib/fs'
import { useTerminalStore } from '@/stores/terminal'

const props = defineProps<{ file: FileEntry }>()

const store = useTerminalStore()
const page = shallowRef<Component | string>()
loadPage(props.file).then((loaded) => (page.value = loaded))

const details = computed(() => {
  const { date, tags = [] } = props.file.meta
  return [date?.slice(0, 10), tags.map((tag) => `#${tag}`).join(' ')].filter(Boolean).join(' · ')
})

// odd indexes are the links
const textParts = computed(() =>
  typeof page.value === 'string' ? page.value.split(/(https?:\/\/\S+)/) : [],
)
</script>

<template>
  <article class="file-pager" box-="square" shear-="both">
    <header>
      <span>{{ file.path }}</span>
      <span v-if="details">{{ details }}</span>
    </header>
    <div class="body">
      <div v-if="typeof page === 'string'" class="text">
        <template v-for="(part, index) in textParts" :key="index">
          <a v-if="index % 2" :href="part" target="_blank" rel="noopener">{{ part }}</a>
          <template v-else>{{ part }}</template>
        </template>
      </div>
      <component :is="page" v-else-if="page" />
    </div>
    <footer>
      <button type="button" @click="store.closeFile()">[close]</button>
    </footer>
  </article>
</template>

<style scoped>
.file-pager {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

header,
footer {
  display: flex;
  justify-content: space-between;
  gap: 1ch;
  padding: 0 1ch;
}

footer {
  justify-content: flex-end;
}

header span {
  padding: 0 1ch;
  background: var(--background0);
  white-space: nowrap;
}

header span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--blue);
}

header span:last-child {
  color: var(--foreground2);
}

footer button {
  all: unset;
  padding: 0 1ch;
  background: var(--background0);
  cursor: pointer;
}

footer button:hover,
footer button:focus-visible {
  text-decoration: underline;
}

.body {
  flex: 1;
  overflow-y: auto;
  padding: 0 1ch;
  word-break: normal;
  overflow-wrap: break-word;
}

.body > *,
.body :deep(.markdown-body) {
  max-width: 80ch;
}

.body :deep(.markdown-body > * + *) {
  margin-top: 1lh;
}

.body :deep(h1)::before {
  content: '# ';
}

.body :deep(h2)::before {
  content: '## ';
}

.body :deep(h3)::before {
  content: '### ';
}

.body :deep(:is(h1, h2, h3))::before {
  color: var(--foreground2);
}

.body :deep(img) {
  max-width: 100%;
}

.text {
  white-space: pre-wrap;
}

a {
  color: inherit;
}
</style>
