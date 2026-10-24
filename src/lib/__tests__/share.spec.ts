import { afterEach, describe, expect, it, vi } from 'vitest'
import { share } from '../share'

const url = 'https://ljubijankic.si/about'

function setup({
  touch = false,
  canShare = true,
  shareError = undefined as Error | undefined,
} = {}) {
  vi.stubGlobal('matchMedia', () => ({ matches: touch }))
  const writeText = vi.fn<Clipboard['writeText']>().mockResolvedValue()
  const shareSheet = vi.fn<Navigator['share']>()
  if (shareError) shareSheet.mockRejectedValue(shareError)
  else shareSheet.mockResolvedValue()
  vi.stubGlobal('navigator', { clipboard: { writeText }, share: canShare ? shareSheet : undefined })
  return { writeText, shareSheet }
}

afterEach(() => vi.unstubAllGlobals())

describe('share', () => {
  it('copies the link on desktop', async () => {
    const { writeText, shareSheet } = setup()
    expect(await share(url, 'About me')).toBe('copied')
    expect(writeText).toHaveBeenCalledWith(url)
    expect(shareSheet).not.toHaveBeenCalled()
  })

  it('opens the share sheet on touch devices', async () => {
    const { writeText, shareSheet } = setup({ touch: true })
    expect(await share(url, 'About me')).toBe('shared')
    expect(shareSheet).toHaveBeenCalledWith({ title: 'About me', url })
    expect(writeText).not.toHaveBeenCalled()
  })

  it('copies on touch devices without a share sheet', async () => {
    const { writeText } = setup({ touch: true, canShare: false })
    expect(await share(url, 'About me')).toBe('copied')
    expect(writeText).toHaveBeenCalledWith(url)
  })

  it('treats closing the share sheet as done', async () => {
    setup({ touch: true, shareError: new DOMException('cancelled', 'AbortError') })
    expect(await share(url, 'About me')).toBe('shared')
  })

  it('fails when the clipboard is blocked', async () => {
    const { writeText } = setup()
    writeText.mockRejectedValue(new DOMException('denied', 'NotAllowedError'))
    expect(await share(url, 'About me')).toBe('failed')
  })
})
