<script setup lang="ts">
import { withBase } from '@/lib/site'
import { useTerminalStore } from '@/stores/terminal'

const links = [
  { label: 'home', command: ['cd ~', 'ls'] },
  { label: 'about me', command: 'open ~/about.md', href: withBase('/about') },
  { label: 'projects', command: ['cd ~/projects', 'ls'] },
  { label: 'articles', command: ['cd ~/articles', 'ls'] },
  { label: 'contact', command: 'open ~/contact.md', href: withBase('/contact') },
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
      <template v-for="link in links" :key="link.label">
        <a
          v-if="link.href"
          :href="link.href"
          is-="button"
          size-="small"
          variant-="background1"
          @click.exact.prevent="go(link.command)"
        >
          {{ link.label }}
        </a>
        <button v-else type="button" size-="small" variant-="background1" @click="go(link.command)">
          {{ link.label }}
        </button>
      </template>
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

nav a {
  text-decoration: none;
}

.copyright {
  color: var(--foreground2);
}
</style>
