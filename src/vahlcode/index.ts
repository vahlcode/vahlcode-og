import { ImageResponse } from '../image-response'
import type { CreateOgRouteOptions, OgRenderFunction } from '../types'

/**
 * Create an Open Graph image route handler for TanStack Start.
 *
 * This is a convenience wrapper that creates a route configuration object
 * compatible with TanStack Start's `createFileRoute` handler pattern.
 * It automatically handles font loading, rendering, caching headers,
 * and returns a properly-formatted `ImageResponse`.
 *
 * @param path - The route path (e.g. `"/og"`)
 * @param render - An async function that receives the request context and returns a JSX element
 * @param options - Image dimensions, fonts, and caching configuration
 * @returns A route configuration object with a `GET` handler
 *
 * @example
 * ```tsx
 * import { createOgRoute } from '@vahlcode/og/tanstack'
 *
 * export const Route = createOgRoute('/og', async ({ request }) => {
 *   const url = new URL(request.url)
 *   const title = url.searchParams.get('title') ?? 'Hello World'
 *
 *   return (
 *     <div style={{
 *       display: 'flex',
 *       fontSize: 72,
 *       color: 'white',
 *       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
 *       width: '100%',
 *       height: '100%',
 *       alignItems: 'center',
 *       justifyContent: 'center',
 *     }}>
 *       {title}
 *     </div>
 *   )
 * }, {
 *   width: 1200,
 *   height: 630,
 *   cacheTTL: 3600,
 * })
 * ```
 */
export function createOgRoute(
    _path: string,
    render: OgRenderFunction,
    options: CreateOgRouteOptions = {}
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
