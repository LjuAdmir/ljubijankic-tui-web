/// <reference types="vite/client" />

declare module '*.md' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent
  export const frontmatter: Record<string, unknown>
  export default component
}
