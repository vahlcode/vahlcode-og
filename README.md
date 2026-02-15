# @vahlcode/og

**Generate dynamic Open Graph images** with a `next/og`-style developer experience — built for TanStack Start and any Web-standard runtime.

[![npm version](https://img.shields.io/npm/v/@vahlcode/og)](https://www.npmjs.com/package/@vahlcode/og)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@vahlcode/og)](https://bundlephobia.com/package/@vahlcode/og)
[![license](https://img.shields.io/npm/l/@vahlcode/og)](./LICENSE)

Created by **[Valentine Elum](https://github.com/vahlcode)**.

## Features

- 🖼 **JSX → PNG** in one class — write JSX with inline CSS, get back a `Response` with a PNG
- 🎨 **Satori-powered** — full CSS flexbox, gradients, borders, shadows, and more
- 🔤 **Automatic font loading** — zero-config: auto-fetches Inter 700 from Google Fonts
- 📦 **Framework-agnostic core** — works with TanStack Start, Cloudflare Workers, Deno, Bun, Express
- 🧩 **TanStack Start helper** — optional `createOgRoute` for one-liner OG routes
- 💾 **Built-in LRU cache** — fonts cached in memory; no redundant fetches
- 🎯 **TypeScript-first** — full type safety, exported types, JSDoc on every API

## Quick Start

### Install

```bash
npm install @vahlcode/og satori @resvg/resvg-js
```

### Basic Usage

```tsx
import { ImageResponse } from '@vahlcode/og'

// Works in any handler that returns a Response
export async function GET() {
  return new ImageResponse(
    <div style={{
      display: 'flex',
      fontSize: 72,
      color: 'white',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      Hello World
    </div>,
    { width: 1200, height: 630 }
  )
}
```

### TanStack Start

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { createOgImage } from '@vahlcode/og/tanstack'

export const Route = createFileRoute('/og')(
  createOgImage(async ({ request }) => {
    const url = new URL(request.url)
    const title = url.searchParams.get('title') ?? 'My App'

    return new ImageResponse(
      <div style={{ display: 'flex', fontSize: 72, color: 'white', background: '#111' }}>
        {title}
      </div>
    )
  })
)
```

### Comparison with `next/og`

If you're coming from Next.js, `@vahlcode/og` will feel right at home. It offers the same `ImageResponse` API but works **anywhere**.

| Feature | `next/og` | `@vahlcode/og` |
|---------|-----------|------------|
| **Runtime** | Edge (Vercel) | **Any** (Node.js, Edge, Deno, Bun) |
| **Framework** | Next.js Only | **Framework Agnostic** (TanStack Start, Hono, Express, etc.) |
| **Font Loading** | Manual or Google Fonts (experimental) | **Automatic** (Auto-fetches Google Fonts) |
| **Caching** | Vercel Cache | **Built-in LRU Cache** (In-memory) |
| **Image Process** | Satori + Resvg (WASM) | Satori + Resvg (Node/WASM) + Sharp (Optional) |
| **Developer Experience** | ⭐️⭐️⭐️⭐️⭐️ | ⭐️⭐️⭐️⭐️⭐️ |



### `ImageResponse`

```ts
class ImageResponse extends Response {
  constructor(element: React.ReactElement, options?: ImageResponseOptions)
}
```

Renders a React element to a PNG image and returns it as a standard Web `Response`.

#### `ImageResponseOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | `number` | `1200` | Image width in pixels |
| `height` | `number` | `630` | Image height in pixels |
| `fonts` | `FontConfig[]` | Auto-loads Inter 700 | Fonts available to satori |
| `headers` | `HeadersInit` | See below | Merged with default headers |
| `status` | `number` | `200` | HTTP status code |
| `debug` | `boolean` | `false` | Satori debug mode (renders layout boxes) |
| `emoji` | `'twemoji' \| 'openmoji' \| 'noto' \| 'fluent'` | — | Emoji rendering source |

**Default headers:**
```
Content-Type: image/png
Cache-Control: public, max-age=3600, immutable
```

---

### `loadGoogleFont(family, options?)`

```ts
function loadGoogleFont(
  family: string,
  options?: LoadGoogleFontOptions
): Promise<FontConfig>
```

Fetches a font from Google Fonts and returns a `FontConfig` ready for `ImageResponseOptions.fonts`. Results are cached in memory.

```ts
import { loadGoogleFont } from '@vahlcode/og'

const interBold = await loadGoogleFont('Inter', { weight: 700 })
// { name: 'Inter', data: ArrayBuffer, weight: 700, style: 'normal' }
```

#### `LoadGoogleFontOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `weight` | `100-900` | `400` | Font weight |
| `style` | `'normal' \| 'italic'` | `'normal'` | Font style |
| `text` | `string` | — | Subset font to specific characters |

---

### `fetchImage(url, options?)`

```ts
function fetchImage(
  url: string,
  options?: FetchImageOptions
): Promise<string>
```

Fetches an image and returns a base64 data-URI string for use in JSX `<img>` tags.

If `sharp` is installed and dimensions are provided, the image is resized. Otherwise, the raw image is base64-encoded as-is.

```ts
import { fetchImage } from '@vahlcode/og'

const avatar = await fetchImage('https://example.com/avatar.jpg', {
  width: 96,
  height: 96,
})

// Use in JSX
<img src={avatar} width={96} height={96} />
```

---

### `createOgImage(render, options?)` — TanStack Start helper

```ts
import { createOgImage } from '@vahlcode/og/tanstack'
```

Helper that generates a route configuration for `createFileRoute`.

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { createOgImage } from '@vahlcode/og/tanstack'

export const Route = createFileRoute('/og')(
  createOgImage(async ({ request }) => {
    const url = new URL(request.url)
    const title = url.searchParams.get('title') ?? 'Default'

    return (
      <div style={{ display: 'flex', fontSize: 72,  color: 'white', background: '#111' }}>
        {title}
      </div>
    )
  }, {
    width: 1200,
    height: 630,
    cacheTTL: 60 * 60, // 1 hour
  })
)
```

---

### `LRUCache<K, V>`

An in-memory LRU cache with TTL support. Exported for advanced use cases.

```ts
import { LRUCache } from '@vahlcode/og'

const cache = new LRUCache<string, ArrayBuffer>({ maxSize: 20, ttl: 60_000 })
cache.set('key', data)
cache.get('key') // ArrayBuffer | undefined
```

## Dependencies

| Package | Role | Type |
|---------|------|------|
| `satori` | JSX → SVG | Peer dependency |
| `@resvg/resvg-js` | SVG → PNG | Peer dependency |
| `react` | JSX types | Peer dependency |
| `sharp` | Image resizing | Optional peer dependency |

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

MIT © [Valentine Elum](https://github.com/vahlcode)
