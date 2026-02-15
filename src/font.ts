import { LRUCache } from './cache'
import type { FontConfig, LoadGoogleFontOptions } from './types'

/** Internal cache for fetched font data — shared across calls. */
const fontCache = new LRUCache<string, FontConfig>({
    maxSize: 30,
    ttl: 30 * 60 * 1000, // 30 minutes
})

/**
 * Build a cache key from font parameters.
 */
function fontCacheKey(
    family: string,
    weight: number,
    style: string
): string {
    return `${family}:${weight}:${style}`
}

/**
 * Load a font from Google Fonts and return a {@link FontConfig} ready
 * to pass into `ImageResponseOptions.fonts`.
 *
 * Results are cached in memory — subsequent calls with the same
 * parameters return instantly.
 *
 * @param family - Google Font family name (e.g. `"Inter"`, `"Roboto Mono"`)
 * @param options - Weight, style, and optional text subset
 * @returns A fully-resolved `FontConfig` with the raw `data` populated
 *
 * @example
 * ```ts
 * import { loadGoogleFont } from '@vahlcode/og'
 *
 * const interBold = await loadGoogleFont('Inter', { weight: 700 })
 * // { name: 'Inter', data: ArrayBuffer, weight: 700, style: 'normal' }
 * ```
 */
export async function loadGoogleFont(
    family: string,
    options: LoadGoogleFontOptions = {}
): Promise<FontConfig> {
    const weight = options.weight ?? 400
    const style = options.style ?? 'normal'
    const key = fontCacheKey(family, weight, style)

    // Return from cache if available
    const cached = fontCache.get(key)
    if (cached) return cached

    // Build Google Fonts CSS URL
    const params = new URLSearchParams({
        family: `${family}:wght@${weight}`,
        display: 'swap',
    })
    if (options.text) {
        params.set('text', options.text)
    }

    const cssUrl = `https://fonts.googleapis.com/css2?${params.toString()}`

    // Fetch CSS with a user-agent that triggers woff2 format
    const cssResponse = await fetch(cssUrl, {
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
    })

    if (!cssResponse.ok) {
        throw new Error(
            `Failed to fetch Google Font CSS for "${family}": ${cssResponse.status} ${cssResponse.statusText}`
        )
    }

    const css = await cssResponse.text()

    // Extract the font file URL from the CSS
    const urlMatch = css.match(/src:\s*url\(([^)]+)\)/)
    if (!urlMatch?.[1]) {
        throw new Error(
            `Could not find font URL in Google Fonts CSS for "${family}" (weight: ${weight}, style: ${style})`
        )
    }

    const fontUrl = urlMatch[1]

    // Fetch the actual font binary
    const fontResponse = await fetch(fontUrl)
    if (!fontResponse.ok) {
        throw new Error(
            `Failed to fetch font file for "${family}": ${fontResponse.status} ${fontResponse.statusText}`
        )
    }

    const data = await fontResponse.arrayBuffer()

    const config: FontConfig = {
        name: family,
        data,
        weight,
        style,
    }

    // Cache for future calls
    fontCache.set(key, config)

    return config
}

/**
 * Resolve a {@link FontConfig} to ensure it has raw `data` populated.
 *
 * - If `data` is already present, returns as-is.
 * - If `url` is provided, fetches the font from that URL.
 * - Otherwise, fetches from Google Fonts using {@link loadGoogleFont}.
 *
 * @internal
 */
export async function resolveFont(font: FontConfig): Promise<FontConfig> {
    if (font.data) return font

    if (font.url) {
        const response = await fetch(font.url)
        if (!response.ok) {
            throw new Error(
                `Failed to fetch font from URL "${font.url}": ${response.status} ${response.statusText}`
            )
        }
        return {
            ...font,
            data: await response.arrayBuffer(),
        }
    }

    // Fallback: load from Google Fonts
    return loadGoogleFont(font.name, {
        weight: font.weight,
        style: font.style,
    })
}

/**
 * Clear the internal font cache.
 * Useful for testing or freeing memory in long-running processes.
 */
export function clearFontCache(): void {
    fontCache.clear()
}
