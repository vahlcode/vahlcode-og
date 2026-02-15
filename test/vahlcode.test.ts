import { describe, it, expect, vi } from 'vitest'
import { createOgImage } from '../src/vahlcode/index'

describe('createOgImage', () => {
    it('returns a route configuration object compatible with createFileRoute', async () => {
        const render = vi.fn().mockResolvedValue({ type: 'div', props: {}, key: null })
        const config = createOgImage(render)

        expect(config).toHaveProperty('component')
        expect(config).toHaveProperty('server.handlers.GET')
        expect(typeof config.component).toBe('function')
        expect(config.component()).toBeNull()
    })

    it('passed GET handler invokes render and returns headers', async () => {
        const render = vi.fn().mockResolvedValue({ type: 'div', props: { children: 'test' }, key: null })
        const config = createOgImage(render, { cacheTTL: 60 })

        const request = new Request('http://localhost/og')
        const response = await config.server.handlers.GET({ request })

        expect(render).toHaveBeenCalledWith({ request })
        expect(response.headers.get('Cache-Control')).toBe('public, max-age=60, immutable')
        expect(response.headers.get('content-type')).toBe('image/png')
    })
})
