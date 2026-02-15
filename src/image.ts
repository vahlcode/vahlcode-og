import type { FetchImageOptions } from './types'

/**
 * Attempt to dynamically import `sharp`.
 * Returns `null` if sharp is not installed (it's an optional peer dep).
 */
async function tryImportSharp(): Promise<any> {
    try {
        return await import('sharp')
    } catch {
        return null
    }
}

/**
 * Infer a MIME type from a URL or content-type header.
 */
function inferMimeType(url: string, contentType?: string | null): string {
    if (contentType && contentType.startsWith('image/')) {
        return contentType.split(';')[0]!.trim()
    }
    const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase()
    switch (ext) {
        case 'png':
            return 'image/png'
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg'
        case 'gif':
            return 'image/gif'
        case 'webp':
            return 'image/webp'
        case 'svg':
            return 'image/svg+xml'
        default:
            return 'image/png'
    }
}

/**
 * Fetch an image from a URL and return it as a base64 data-URI string,
 * suitable for use in `<img src={...} />` within satori JSX.
 *
 * If `sharp` is installed and `width`/`height` options are provided,
 * the image will be resized before encoding. Without `sharp`, the
 * raw image bytes are base64-encoded as-is.
 *
 * @param url - URL of the image to fetch
 * @param options - Optional width/height for resizing
 * @returns A base64 data-URI string (e.g. `"data:image/png;base64,iVBOR..."`)
 *
 * @example
 * ```ts
 * import { fetchImage } from '@vahlcode/og'
 *
 * const avatar = await fetchImage('https://example.com/avatar.jpg', {
 *   width: 96,
 *   height: 96,
 * })
 * // Use in JSX: <img src={avatar} width={96} height={96} />
 * ```
 */
export async function fetchImage(
    url: string,
    options: FetchImageOptions = {}
): Promise<string> {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(
            `Failed to fetch image from "${url}": ${response.status} ${response.statusText}`
        )
    }

    const contentType = response.headers.get('content-type')
    let buffer = Buffer.from(await response.arrayBuffer())
    let mimeType = inferMimeType(url, contentType)

    // Resize with sharp if available and dimensions specified
    if (options.width || options.height) {
        const sharpModule = await tryImportSharp()
        if (sharpModule) {
            const sharp = sharpModule.default ?? sharpModule
            buffer = await sharp(buffer)
                .resize(options.width, options.height, { fit: 'cover' })
                .png()
                .toBuffer()
            mimeType = 'image/png'
        }
        // If sharp is not available, we just return the original image
    }

    const base64 = buffer.toString('base64')
    return `data:${mimeType};base64,${base64}`
}
