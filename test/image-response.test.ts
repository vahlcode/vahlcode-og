import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'

// Mock satori
vi.mock('satori', () => ({
    default: vi.fn().mockResolvedValue('<svg>mock</svg>'),
}))

// Mock @resvg/resvg-js
const mockAsPng = vi.fn().mockReturnValue(new Uint8Array([137, 80, 78, 71])) // PNG magic bytes
const mockRender = vi.fn().mockReturnValue({ asPng: mockAsPng })

vi.mock('@resvg/resvg-js', () => ({
    Resvg: vi.fn().mockImplementation(() => ({
        render: mockRender,
    })),
}))

// Mock the font module to avoid real fetch calls
vi.mock('../src/font', () => ({
    loadGoogleFont: vi.fn().mockResolvedValue({
        name: 'Inter',
        data: new ArrayBuffer(100),
        weight: 700,
        style: 'normal',
    }),
    resolveFont: vi.fn().mockImplementation(async (font: any) => ({
        name: font.name,
        data: font.data ?? new ArrayBuffer(100),
        weight: font.weight ?? 400,
        style: font.style ?? 'normal',
    })),
    clearFontCache: vi.fn(),
}))

describe('ImageResponse', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns a Response with Content-Type image/png', async () => {
        const { ImageResponse } = await import('../src/image-response')

        const response = new ImageResponse(
            React.createElement('div', { style: { display: 'flex' } }, 'Hello')
        )

        expect(response).toBeInstanceOf(Response)
        expect(response.headers.get('Content-Type')).toBe('image/png')

        // Consume the body to trigger the pipeline
        const buffer = await response.arrayBuffer()
        expect(buffer.byteLength).toBeGreaterThan(0)
    })

    it('returns status 200 by default', async () => {
        const { ImageResponse } = await import('../src/image-response')

        const response = new ImageResponse(
            React.createElement('div', null, 'Test')
        )

        expect(response.status).toBe(200)
    })

    it('allows custom status code', async () => {
        const { ImageResponse } = await import('../src/image-response')

        const response = new ImageResponse(
            React.createElement('div', null, 'Test'),
            { status: 201 }
        )

        expect(response.status).toBe(201)
    })

    it('sets Cache-Control header by default', async () => {
        const { ImageResponse } = await import('../src/image-response')

        const response = new ImageResponse(
            React.createElement('div', null, 'Test')
        )

        expect(response.headers.get('Cache-Control')).toBe(
            'public, max-age=3600, immutable'
        )
    })

    it('merges user-provided headers with defaults', async () => {
        const { ImageResponse } = await import('../src/image-response')

        const response = new ImageResponse(
            React.createElement('div', null, 'Test'),
            {
                headers: {
                    'X-Custom': 'custom-value',
                    'Cache-Control': 'no-cache',
                },
            }
        )

        expect(response.headers.get('X-Custom')).toBe('custom-value')
        // User headers should override defaults
        expect(response.headers.get('Cache-Control')).toBe('no-cache')
        // Content-Type should still be set
        expect(response.headers.get('Content-Type')).toBe('image/png')
    })

    it('calls satori with correct dimensions', async () => {
        const { ImageResponse } = await import('../src/image-response')
        const satori = (await import('satori')).default

        const response = new ImageResponse(
            React.createElement('div', null, 'Test'),
            { width: 800, height: 400 }
        )

        // Trigger the stream
        await response.arrayBuffer()

        expect(satori).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                width: 800,
                height: 400,
            })
        )
    })

    it('uses default 1200x630 dimensions when not specified', async () => {
        const { ImageResponse } = await import('../src/image-response')
        const satori = (await import('satori')).default

        const response = new ImageResponse(
            React.createElement('div', null, 'Test')
        )

        await response.arrayBuffer()

        expect(satori).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                width: 1200,
                height: 630,
            })
        )
    })

    it('auto-loads Inter font when no fonts provided', async () => {
        const { ImageResponse } = await import('../src/image-response')
        const { loadGoogleFont } = await import('../src/font')

        const response = new ImageResponse(
            React.createElement('div', null, 'Test')
        )

        await response.arrayBuffer()

        expect(loadGoogleFont).toHaveBeenCalledWith('Inter', { weight: 700 })
    })

    it('uses provided fonts instead of auto-loading', async () => {
        const { ImageResponse } = await import('../src/image-response')
        const { loadGoogleFont, resolveFont } = await import('../src/font')

        const response = new ImageResponse(
            React.createElement('div', null, 'Test'),
            {
                fonts: [
                    { name: 'Roboto', data: new ArrayBuffer(50), weight: 400 },
                ],
            }
        )

        await response.arrayBuffer()

        expect(loadGoogleFont).not.toHaveBeenCalled()
        expect(resolveFont).toHaveBeenCalled()
        expect(vi.mocked(resolveFont).mock.calls[0][0]).toEqual(
            expect.objectContaining({ name: 'Roboto' })
        )
    })

    it('produces a valid PNG buffer', async () => {
        const { ImageResponse } = await import('../src/image-response')

        const response = new ImageResponse(
            React.createElement('div', null, 'Test')
        )

        const buffer = new Uint8Array(await response.arrayBuffer())
        // Check PNG magic bytes (mocked)
        expect(buffer[0]).toBe(137) // 0x89
        expect(buffer[1]).toBe(80)  // P
        expect(buffer[2]).toBe(78)  // N
        expect(buffer[3]).toBe(71)  // G
    })
})
