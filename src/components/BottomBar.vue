<script setup lang="ts">
const links = ['home', 'about me', 'projects', 'articles', 'contact']
const year = new Date().getFullYear()
</script>

<template>
  <footer class="bottom-bar">
    <nav>
      <button v-for="link in links" :key="link" type="button" size-="small" variant-="background1">
        {{ link }}
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
