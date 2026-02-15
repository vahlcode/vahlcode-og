import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchImage } from '../src/image'

describe('fetchImage', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('fetches an image and returns a base64 data-URI', async () => {
        const imageBytes = Buffer.from('fake-png-data')
        const fetchMock = vi.fn().mockResolvedValueOnce(
            new Response(imageBytes, {
                status: 200,
                headers: { 'Content-Type': 'image/png' },
            })
        )
        vi.stubGlobal('fetch', fetchMock)

        const result = await fetchImage('https://example.com/image.png')

        expect(result).toMatch(/^data:image\/png;base64,/)
        expect(fetchMock).toHaveBeenCalledWith('https://example.com/image.png')
    })

    it('infers MIME type from URL extension', async () => {
        const imageBytes = Buffer.from('fake-jpeg-data')
        const fetchMock = vi.fn().mockResolvedValueOnce(
            new Response(imageBytes, { status: 200 })
        )
        vi.stubGlobal('fetch', fetchMock)

        const result = await fetchImage('https://example.com/photo.jpg')

        expect(result).toMatch(/^data:image\/jpeg;base64,/)
    })

    it('infers MIME type from content-type header', async () => {
        const imageBytes = Buffer.from('fake-webp-data')
        const fetchMock = vi.fn().mockResolvedValueOnce(
            new Response(imageBytes, {
                status: 200,
                headers: { 'Content-Type': 'image/webp; charset=utf-8' },
            })
        )
        vi.stubGlobal('fetch', fetchMock)

        const result = await fetchImage('https://example.com/image')

        expect(result).toMatch(/^data:image\/webp;base64,/)
    })

    it('defaults to image/png when MIME cannot be inferred', async () => {
        const imageBytes = Buffer.from('mystery-data')
        const fetchMock = vi.fn().mockResolvedValueOnce(
            new Response(imageBytes, { status: 200 })
        )
        vi.stubGlobal('fetch', fetchMock)

        const result = await fetchImage('https://example.com/image')

        expect(result).toMatch(/^data:image\/png;base64,/)
    })

    it('throws when fetch fails', async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce(
            new Response('Not Found', { status: 404, statusText: 'Not Found' })
        )
        vi.stubGlobal('fetch', fetchMock)

        await expect(
            fetchImage('https://example.com/missing.png')
        ).rejects.toThrow('Failed to fetch image')
    })

    it('correctly base64-encodes the image data', async () => {
        const originalData = Buffer.from('Hello World PNG')
        const expectedBase64 = originalData.toString('base64')
        const fetchMock = vi.fn().mockResolvedValueOnce(
            new Response(originalData, {
                status: 200,
                headers: { 'Content-Type': 'image/png' },
            })
        )
        vi.stubGlobal('fetch', fetchMock)

        const result = await fetchImage('https://example.com/test.png')

        expect(result).toBe(`data:image/png;base64,${expectedBase64}`)
    })

    it('handles images with query parameters in URL', async () => {
        const imageBytes = Buffer.from('gif-data')
        const fetchMock = vi.fn().mockResolvedValueOnce(
            new Response(imageBytes, { status: 200 })
        )
        vi.stubGlobal('fetch', fetchMock)

        const result = await fetchImage('https://example.com/anim.gif?v=2')

        expect(result).toMatch(/^data:image\/gif;base64,/)
    })
})
