export const siteName = 'Admir Ljubijankić'
export const siteUrl = 'https://ljubijankic.si'

// adds the deploy base (a subpath on the github.io preview), routes and urlFor don't include it
export const withBase = (path: string) => import.meta.env.BASE_URL.replace(/\/$/, '') + path
