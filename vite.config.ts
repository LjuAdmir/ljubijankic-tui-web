import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Markdown from 'unplugin-vue-markdown/vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({ include: [/\.vue$/, /\.md$/] }),
    Markdown({
      // also export the frontmatter as one object, for import.meta.glob(..., { import: 'frontmatter' })
      frontmatterPreprocess: (frontmatter, options, _id, defaults) => ({
        head: defaults(frontmatter, options),
        frontmatter: { ...frontmatter, frontmatter },
      }),
    }),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
