import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadGoogleFont, clearFontCache } from '../src/font'

// Sample CSS response from Google Fonts
const MOCK_CSS = `
/* latin */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/inter/v13/mock-inter-bold.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}
`

// Minimal valid font data (just needs to be an ArrayBuffer for our tests)
const MOCK_FONT_DATA = new ArrayBuffer(100)

describe('loadGoogleFont', () => {
    beforeEach(() => {
        clearFontCache()
        vi.restoreAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('fetches a font from Google Fonts and returns a FontConfig', async () => {
        const fetchMock = vi.fn()
            // First call: CSS response
            .mockResolvedValueOnce(
                new Response(MOCK_CSS, { status: 200 })
            )
            // Second call: font binary
            .mockResolvedValueOnce(
                new Response(MOCK_FONT_DATA, { status: 200 })
            )

        vi.stubGlobal('fetch', fetchMock)

        const result = await loadGoogleFont('Inter', { weight: 700 })

        expect(result).toEqual({
            name: 'Inter',
            data: MOCK_FONT_DATA,
            weight: 700,
            style: 'normal',
        })

        // Verify the CSS URL was called correctly
        expect(fetchMock).toHaveBeenCalledTimes(2)
        const cssUrl = fetchMock.mock.calls[0][0] as string
        expect(cssUrl).toContain('fonts.googleapis.com/css2')
        expect(cssUrl).toContain('Inter')
    })

    it('caches fonts and returns cached result on second call', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(MOCK_CSS, { status: 200 }))
            .mockResolvedValueOnce(new Response(MOCK_FONT_DATA, { status: 200 }))

        vi.stubGlobal('fetch', fetchMock)

        const first = await loadGoogleFont('Inter', { weight: 700 })
        const second = await loadGoogleFont('Inter', { weight: 700 })

        expect(first).toEqual(second)
        // Should have only made 2 fetch calls total (CSS + font), not 4
        expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('uses default weight 400 and style normal when not specified', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(MOCK_CSS, { status: 200 }))
            .mockResolvedValueOnce(new Response(MOCK_FONT_DATA, { status: 200 }))

        vi.stubGlobal('fetch', fetchMock)

        const result = await loadGoogleFont('Roboto')

        expect(result.weight).toBe(400)
        expect(result.style).toBe('normal')
        const cssUrl = fetchMock.mock.calls[0][0] as string
        expect(cssUrl).toContain('Roboto')
        expect(decodeURIComponent(cssUrl)).toContain('wght@400')
    })

    it('throws when CSS fetch fails', async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce(
            new Response('Not Found', { status: 404, statusText: 'Not Found' })
        )
        vi.stubGlobal('fetch', fetchMock)

        await expect(loadGoogleFont('NonExistent')).rejects.toThrow(
            'Failed to fetch Google Font CSS'
        )
    })

    it('throws when font URL cannot be extracted from CSS', async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce(
            new Response('/* empty css */', { status: 200 })
        )
        vi.stubGlobal('fetch', fetchMock)

        await expect(loadGoogleFont('Inter')).rejects.toThrow(
            'Could not find font URL'
        )
    })

    it('throws when font binary fetch fails', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(MOCK_CSS, { status: 200 }))
            .mockResolvedValueOnce(
                new Response('Server Error', { status: 500, statusText: 'Internal Server Error' })
            )
        vi.stubGlobal('fetch', fetchMock)

        await expect(loadGoogleFont('Inter')).rejects.toThrow(
            'Failed to fetch font file'
        )
    })

    it('includes text parameter when specified', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(MOCK_CSS, { status: 200 }))
            .mockResolvedValueOnce(new Response(MOCK_FONT_DATA, { status: 200 }))
        vi.stubGlobal('fetch', fetchMock)

        await loadGoogleFont('Inter', { weight: 400, text: 'Hello' })

        const cssUrl = fetchMock.mock.calls[0][0] as string
        expect(cssUrl).toContain('text=Hello')
    })
})
