import { defineConfig } from 'tsup'

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        'vahlcode/index': 'src/vahlcode/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: true,
    clean: true,
    target: 'node18',
    outDir: 'dist',
    external: ['react', 'satori', '@resvg/resvg-js', 'sharp'],
    treeshake: true,
})
