import './assets/main.css'

import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'

import App from './App.vue'
import { routes } from './router'

export const createApp = ViteSSG(App, { routes }, ({ app, initialState }) => {
  const pinia = createPinia()
  app.use(pinia)

  // the client starts from the prerendered state, so hydration matches the HTML
  if (import.meta.env.SSR) initialState.pinia = pinia.state.value
  else pinia.state.value = initialState.pinia ?? {}
})
