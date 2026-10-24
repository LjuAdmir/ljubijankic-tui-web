import { copyFileSync } from 'node:fs'
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
      // pages are imported again as `?page` so their content lands in lazy chunks, see lib/fs.ts
      include: [/\.md$/, /\.md\?page$/],
      // also export the frontmatter as one object, for import.meta.glob(..., { import: 'frontmatter' })
      frontmatterPreprocess: (frontmatter, options, _id, defaults) => ({
        head: defaults(frontmatter, options),
        frontmatter: { ...frontmatter, frontmatter },
      }),
    }),
    vueDevTools(),
  ],
  ssgOptions: {
    // GitHub Pages serves 404.html for unknown paths, the app then handles them
    onFinished: () => copyFileSync('dist/index.html', 'dist/404.html'),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
