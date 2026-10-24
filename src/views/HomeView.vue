<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fromUrl, urlFor } from '@/lib/fs'
import { useTerminalStore } from '@/stores/terminal'
import TerminalView from '@/components/TerminalView.vue'

const route = useRoute()
const router = useRouter()
const store = useTerminalStore()

watch(
  () => route.path,
  (path) => {
    if (path === '/') return store.closeFile()

    const entry = fromUrl(path)
    if (entry?.kind === 'file') {
      if (store.openFile?.path === entry.path) return
      const dir = entry.path.slice(0, entry.path.lastIndexOf('/'))
      const commands = [`open ${entry.path}`]
      if (store.cwd !== dir) commands.unshift(`cd ${dir}`)
      store.execute(commands)
      return
    }

    if (entry) store.execute([`cd ${entry.path}`, 'ls'])
    else store.print([{ text: `open: ${path}: no such file`, style: 'error' }])
    router.replace('/')
  },
  { immediate: true },
)

watch(
  () => store.openFile,
  (file) => {
    const url = file ? urlFor(file) : '/'
    if (url === route.path) return
    // closing a file opened from the shell goes back instead of stacking another `/`
    if (!file && history.state?.back === '/') router.back()
    else router.push(url)
  },
)
</script>

<template>
  <TerminalView />
</template>
