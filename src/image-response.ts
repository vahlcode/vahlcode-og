import type { ReactElement } from 'react'
import type { ImageResponseOptions, FontConfig } from './types'
import { loadGoogleFont, resolveFont } from './font'

/**
 * Default image dimensions matching the standard OG image spec.
 */
const DEFAULT_WIDTH = 1200
const DEFAULT_HEIGHT = 630

/**
 * A Web-standard `Response` that renders a React element to a PNG image.
 *
 * The pipeline is:
 * 1. Resolve fonts (auto-loads Inter 700 if none provided)
 * 2. `satori(element, options)` → SVG string
 * 3. `Resvg(svg).render().asPng()` → PNG buffer
 * 4. Return as `Response` with `Content-Type: image/png`
 *
 * Compatible with TanStack Start, Cloudflare Workers, Deno, and any
 * runtime that supports the Web `Response` API.
 *
 * @example
 * ```tsx
 * import { ImageResponse } from '@vahlcode/og'
 *
 * export async function GET() {
 *   return new ImageResponse(
 *     <div style={{ display: 'flex', fontSize: 72, color: 'white', background: '#111' }}>
 *       Hello World
 *     </div>,
 *     { width: 1200, height: 630 }
 *   )
 * }
 * ```
 */
export class ImageResponse extends Response {
    constructor(element: ReactElement, options: ImageResponseOptions = {}) {
        const {
            width = DEFAULT_WIDTH,
            height = DEFAULT_HEIGHT,
            fonts,
            headers: userHeaders,
            status = 200,
            debug = false,
            emoji,
        } = options

        // Build the async PNG generation pipeline as a ReadableStream
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // 1. Resolve fonts
                    let resolvedFonts: FontConfig[]
                    if (fonts && fonts.length > 0) {
                        resolvedFonts = await Promise.all(fonts.map(resolveFont))
                    } else {
                        // Default: load Inter 700 for zero-config experience
                        resolvedFonts = [await loadGoogleFont('Inter', { weight: 700 })]
                    }

                    // 2. Convert JSX → SVG via satori
                    const satori = (await import('satori')).default
                    const satoriOptions: Record<string, unknown> = {
                        width,
                        height,
                        debug,
                        fonts: resolvedFonts.map((f) => ({
                            name: f.name,
                            data: f.data,
                            weight: f.weight ?? 400,
                            style: f.style ?? 'normal',
                        })),
                    }

                    if (emoji) {
                        satoriOptions.loadAdditionalAsset = async (
                            languageCode: string,
                            segment: string
                        ) => {
                            if (languageCode === 'emoji') {
                                // Fetch emoji SVG from CDN based on chosen source
                                const code = segment.codePointAt(0)?.toString(16)
                                const emojiUrls: Record<string, string> = {
                                    twemoji: `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${code}.svg`,
                                    openmoji: `https://cdn.jsdelivr.net/npm/openmoji@latest/color/svg/${code?.toUpperCase()}.svg`,
                                    noto: `https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji/svg/emoji_u${code}.svg`,
                                    fluent: `https://cdn.jsdelivr.net/gh/nicedoc/twemoji/assets/svg/${code}.svg`,
                                }
                                const url = emojiUrls[emoji]
                                if (url) {
                                    const res = await fetch(url)
                                    if (res.ok) {
                                        const svg = await res.text()
                                        return `data:image/svg+xml;base64,${btoa(svg)}`
                                    }
                                }
                            }
                            return ''
                        }
                    }

                    const svg = await satori(element, satoriOptions as any)

                    // 3. Convert SVG → PNG via resvg-wasm
                    const { Resvg, initWasm } = await import('@resvg/resvg-wasm')
                    const { resvgWasm } = await import('./resvg-wasm')

                    // Initialize WASM if not already done
                    // Note: initWasm usually handles multiple calls, but we can wrap it if needed.
                    // Converting base64 to Buffer/Uint8Array
                    // In Node/Edge with Buffer support:
                    const wasmBuffer = Buffer.from(resvgWasm, 'base64')

                    try {
                        await initWasm(wasmBuffer)
                    } catch (e) {
                        // If already initialized, it might throw, or just work.
                        // Check specific error if needed, but for now strict init.
                        // Actually, resvg-wasm initWasm checks if module is set.
                    }

                    const resvg = new Resvg(svg, {
                        fitTo: { mode: 'width', value: width },
                    })
                    const pngData = resvg.render()
                    const pngBuffer = pngData.asPng()

                    // 4. Enqueue the PNG buffer and close the stream
                    controller.enqueue(pngBuffer)
                    controller.close()
                } catch (error) {
                    controller.error(error)
                }
            },
        })

        // Merge default headers with user-provided headers
        const defaultHeaders: Record<string, string> = {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600, immutable',
        }

        const mergedHeaders = new Headers(defaultHeaders)
        if (userHeaders) {
            const h = new Headers(userHeaders)
            h.forEach((value, key) => {
                mergedHeaders.set(key, value)
            })
        }

        super(stream, {
            headers: mergedHeaders,
            status,
        })
    }
}
