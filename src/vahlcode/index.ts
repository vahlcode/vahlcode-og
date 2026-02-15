import { ImageResponse } from '../image-response'
import type { CreateOgImageOptions, OgRenderFunction } from '../types'

/**
 * Create an Open Graph image route configuration for TanStack Start.
 *
 * This function returns a route configuration object that should be passed
 * to `createFileRoute`. It automatically handles font loading, rendering,
 * and caching headers.
 *
 * @param render - An async function that receives the request context and returns a JSX element
 * @param options - Image dimensions, fonts, and caching configuration
 * @returns A route configuration object compatible with `createFileRoute`
 *
 * @example
 * ```tsx
 * import { createFileRoute } from '@tanstack/react-router'
 * import { createOgImage } from '@vahlcode/og/tanstack'
 *
 * export const Route = createFileRoute('/og')(
 *   createOgImage(async ({ request }) => {
 *     const url = new URL(request.url)
 *     const title = url.searchParams.get('title') ?? 'Hello World'
 *
 *     return (
 *       <div style={{ fontSize: 72 }}>
 *         {title}
 *       </div>
 *     )
 *   }, {
 *     width: 1200,
 *     height: 630,
 *   })
 * )
 * ```
 */
export function createOgImage(
    render: OgRenderFunction,
    options: CreateOgImageOptions = {}
) {
    const { cacheTTL, ...imageOptions } = options

    // If cacheTTL is set, override the Cache-Control header
    const headers: Record<string, string> = {}
    if (cacheTTL !== undefined && cacheTTL > 0) {
        headers['Cache-Control'] = `public, max-age=${cacheTTL}, immutable`
    }

    return {
        component: () => null,
        server: {
            handlers: {
                GET: async ({ request }: { request: Request }) => {
                    const element = await render({ request })
                    return new ImageResponse(element, {
                        ...imageOptions,
                        headers: {
                            ...headers,
                            ...(imageOptions.headers
                                ? Object.fromEntries(new Headers(imageOptions.headers))
                                : {}),
                        },
                    })
                },
            },
        },
    }
}
