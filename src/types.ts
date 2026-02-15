import type { ReactElement } from 'react'

/**
 * Configuration for a font to use in OG image rendering.
 *
 * Provide either `data` (raw font bytes) or `url` (to auto-fetch).
 * If neither is provided, the font will be fetched from Google Fonts CDN.
 */
export interface FontConfig {
    /** Font family name (e.g. `"Inter"`, `"Roboto"`) */
    name: string
    /** Raw font file data. Takes precedence over `url`. */
    data?: ArrayBuffer
    /** Font weight (100–900). Defaults to `400`. */
    weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
    /** Font style. Defaults to `"normal"`. */
    style?: 'normal' | 'italic'
    /** URL to fetch the font from. Ignored if `data` is provided. */
    url?: string
}

/**
 * Options for the {@link ImageResponse} constructor.
 */
export interface ImageResponseOptions {
    /** Image width in pixels. @default 1200 */
    width?: number
    /** Image height in pixels. @default 630 */
    height?: number
    /** Fonts to make available to satori. Auto-loads Inter 700 if omitted. */
    fonts?: FontConfig[]
    /** Additional HTTP headers merged with defaults. */
    headers?: HeadersInit
    /** HTTP status code. @default 200 */
    status?: number
    /** Enable satori debug mode (renders layout boxes). @default false */
    debug?: boolean
    /** Emoji rendering source. */
    emoji?: 'twemoji' | 'openmoji' | 'noto' | 'fluent'
}

/**
 * Options for {@link fetchImage}.
 */
export interface FetchImageOptions {
    /** Desired output width in pixels. Requires `sharp`. */
    width?: number
    /** Desired output height in pixels. Requires `sharp`. */
    height?: number
}

/**
 * Options for loading a Google Font via {@link loadGoogleFont}.
 */
export interface LoadGoogleFontOptions {
    /** Font weight. @default 400 */
    weight?: FontConfig['weight']
    /** Font style. @default "normal" */
    style?: FontConfig['style']
    /** Specific text to subset the font for (reduces download size). */
    text?: string
}

/**
 * Options for the LRU cache.
 */
export interface CacheOptions {
    /** Maximum number of entries. @default 50 */
    maxSize?: number
    /** Time-to-live in milliseconds. @default Infinity */
    ttl?: number
}

/**
 * Options for {@link createOgRoute}.
 */
export interface CreateOgImageOptions extends ImageResponseOptions {
    /** Server-side cache TTL in seconds. Sets `Cache-Control: public, max-age=<cacheTTL>`. */
    cacheTTL?: number
}

/**
 * Render function signature for {@link createOgImage}.
 */
export type OgRenderFunction = (context: {
    request: Request
}) => ReactElement | Promise<ReactElement>
