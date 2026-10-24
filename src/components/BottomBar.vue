<script setup lang="ts">
import { useTerminalStore } from '@/stores/terminal'

const links = [
  { label: 'home', command: ['cd ~', 'ls'] },
  { label: 'about me', command: 'open ~/about.md' },
  { label: 'projects', command: ['cd ~/projects', 'ls'] },
  { label: 'articles', command: ['cd ~/articles', 'ls'] },
  { label: 'contact', command: 'open ~/contact.md' },
]
const year = new Date().getFullYear()

const store = useTerminalStore()

function go(command: string | string[]) {
  store.closeFile()
  store.clear()
  store.execute(command)
}
</script>

<template>
  <footer class="bottom-bar">
    <nav>
      <button
        v-for="link in links"
        :key="link.label"
        type="button"
        size-="small"
        variant-="background1"
        @click="go(link.command)"
      >
        {{ link.label }}
      </button>
    </nav>
    <span class="copyright">© Ljubijankic {{ year }}</span>
  </footer>
</template>

<style scoped>
.bottom-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1ch;
  padding: 0 1ch;
}

nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1ch;
}

.copyright {
  color: var(--foreground2);
}
</style>
