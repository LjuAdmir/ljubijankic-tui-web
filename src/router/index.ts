import type { RouteRecordRaw } from 'vue-router'
import { files, urlFor } from '@/lib/fs'
import HomeView from '@/views/HomeView.vue'

// a route per Markdown file makes vite-ssg prerender it, everything else uses the catch-all
const pages = files().filter((file) => file.source.endsWith('.md') && !file.meta.hidden)

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  ...pages.map((file) => ({ path: urlFor(file), component: HomeView })),
  { path: '/:path(.*)*', component: HomeView },
]
