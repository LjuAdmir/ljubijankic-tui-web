export type ShareResult = 'shared' | 'copied' | 'failed'

// touch devices get the native share sheet, everything else copies the link
export async function share(url: string, title: string): Promise<ShareResult> {
  try {
    if (matchMedia('(pointer: coarse)').matches && navigator.share) {
      await navigator.share({ title, url })
      return 'shared'
    }
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch (error) {
    // closing the share sheet without picking anything isn't a failure
    return error instanceof DOMException && error.name === 'AbortError' ? 'shared' : 'failed'
  }
}
