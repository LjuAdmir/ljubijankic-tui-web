import { copyFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Markdown from 'unplugin-vue-markdown/vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// the deploy workflow sets BASE_PATH while the site lives on a github.io subpath
const base = process.env.BASE_PATH ?? ''
const contentDir = fileURLToPath(new URL('./content', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: `${base}/`,
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
      // external links open in a new tab, links to other .md files become their page URL
      markdownSetup(md) {
        md.core.ruler.push('links', (state) => {
          for (const token of state.tokens.flatMap((block) => block.children ?? [])) {
            if (token.type !== 'link_open') continue
            const href = token.attrGet('href') ?? ''
            if (/^https?:\/\//.test(href)) {
              token.attrSet('target', '_blank')
              token.attrSet('rel', 'noopener')
            } else if (/^[^/#:]+\.md$|^\.\.?\/.*\.md$/.test(href)) {
              const file = resolve(dirname(state.env.id.replace(/\?.*$/, '')), href)
              const url = relative(contentDir, file).replace(/(\/?index)?\.md$/, '')
              token.attrSet('href', `${base}/${url}`)
            }
          }
        })
      },
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
