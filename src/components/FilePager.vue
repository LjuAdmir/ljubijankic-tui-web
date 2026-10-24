<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useHead, useSeoMeta } from '@unhead/vue'
import { loadPage, urlFor, type FileEntry } from '@/lib/fs'
import { share } from '@/lib/share'
import { siteName, siteUrl, withBase } from '@/lib/site'
import { useTerminalStore } from '@/stores/terminal'
import ScrollArea from './ScrollArea.vue'

const props = defineProps<{ file: FileEntry }>()

const store = useTerminalStore()
const area = useTemplateRef('area')

const { title = props.file.name, description, image } = props.file.meta
const fullTitle = `${title} · ${siteName}`
const url = siteUrl + urlFor(props.file)
useSeoMeta({
  title: fullTitle,
  description,
  ogTitle: fullTitle,
  ogDescription: description,
  ogType: 'article',
  ogUrl: url,
  ogImage: image && siteUrl + image,
  twitterCard: image ? 'summary_large_image' : 'summary',
})
useHead({ link: [{ rel: 'canonical', href: url }] })

const shareLabel = ref('[share]')

async function shareFile() {
  const result = await share(location.origin + withBase(urlFor(props.file)), title)
  if (result === 'shared') return
  shareLabel.value = result === 'copied' ? '[copied]' : '[copy failed]'
  setTimeout(() => (shareLabel.value = '[share]'), 2000)
}

defineExpose({ body: computed(() => area.value?.viewport), share: shareFile })

const page = await loadPage(props.file)

const details = computed(() => {
  const { date, tags = [] } = props.file.meta
  return [date?.slice(0, 10), tags.map((tag) => `#${tag}`).join(' ')].filter(Boolean).join(' · ')
})

// odd indexes are the links
const textParts = typeof page === 'string' ? page.split(/(https?:\/\/\S+)/) : []
</script>

<template>
  <article class="file-pager" box-="square" shear-="both">
    <header>
      <span>{{ file.path }}</span>
      <span v-if="details">{{ details }}</span>
    </header>
    <ScrollArea ref="area" class="body">
      <div v-if="typeof page === 'string'" class="text">
        <template v-for="(part, index) in textParts" :key="index">
          <a v-if="index % 2" :href="part" target="_blank" rel="noopener">{{ part }}</a>
          <template v-else>{{ part }}</template>
        </template>
      </div>
      <component :is="page" v-else />
    </ScrollArea>
    <footer>
      <span class="hints">q close · j/k scroll · space page · g/G top/bottom · s share</span>
      <span v-if="area?.overflows" class="progress">{{ Math.round(area.progress * 100) }}%</span>
      <button type="button" @click="shareFile">{{ shareLabel }}</button>
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

/* labels sit on the border, the background hides the line behind them */
header span,
footer > * {
  flex: none;
  padding: 0 1ch;
  background: var(--background0);
  white-space: nowrap;
}

header span:first-child,
.hints {
  flex: initial;
  overflow: hidden;
  text-overflow: ellipsis;
}

header span:first-child {
  color: var(--blue);
}

header span:last-child,
.hints,
.progress {
  color: var(--foreground2);
}

.hints {
  margin-right: auto;
}

@media (pointer: coarse) {
  .hints {
    display: none;
  }
}

footer button {
  all: unset;
  flex: none;
  padding: 0 1ch;
  background: var(--background0);
  white-space: nowrap;
  cursor: pointer;
}

footer button:hover,
footer button:focus-visible {
  text-decoration: underline;
}

.body {
  --scroll-track: transparent;
  flex: 1;
  margin-right: -1ch;
  padding-left: 1ch;
  word-break: normal;
  overflow-wrap: break-word;
}

.text,
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
