const fs = require('fs');
const path = require('path');

const wasmPath = path.resolve('node_modules/@resvg/resvg-wasm/index_bg.wasm');
if (!fs.existsSync(wasmPath)) {
    console.error('WASM file not found at:', wasmPath);
    process.exit(1);
}

const buffer = fs.readFileSync(wasmPath);
const base64 = buffer.toString('base64');

const content = `// Auto-generated. Do not edit.
// Contains base64-encoded resvg.wasm binary.

export const resvgWasm = '${base64}';
`;

fs.writeFileSync('src/resvg-wasm.ts', content);
console.log('✅ Generated src/resvg-wasm.ts');
