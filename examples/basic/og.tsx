// Example: TanStack Start OG Image Route
// File: app/routes/og.tsx

import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse, loadGoogleFont, fetchImage } from '@vahlcode/og'

export const Route = createFileRoute('/og')({
    component: () => null,
    // @ts-expect-error - TanStack Start server handlers
    server: {
        handlers: {
            GET: async ({ request }: { request: Request }) => {
                const url = new URL(request.url)
                const title = url.searchParams.get('title') ?? 'Welcome to My App'
                const subtitle = url.searchParams.get('subtitle') ?? 'Built with TanStack Start'

                return new ImageResponse(
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            fontFamily: 'Inter',
                            padding: '60px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                fontSize: 72,
                                fontWeight: 700,
                                textAlign: 'center',
                                lineHeight: 1.2,
                                marginBottom: '20px',
                            }}
                        >
                            {title}
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                fontSize: 32,
                                opacity: 0.8,
                                textAlign: 'center',
                            }}
                        >
                            {subtitle}
                        </div>
                    </div>,
                    {
                        width: 1200,
                        height: 630,
                        fonts: [
                            { name: 'Inter', weight: 700 },
                            { name: 'Inter', weight: 400 },
                        ],
                    }
                )
            },
        },
    },
})
