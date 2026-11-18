const fs = require('fs');
const zlib = require('zlib');

// Read source PNG
const buf = fs.readFileSync('backend/public/images/logo-email.png');

let pos = 8;
let ihdr = null;
let idatParts = [];

while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') ihdr = data;
    if (type === 'IDAT') idatParts.push(data);
    pos += 12 + len;
}

const width = ihdr.readUInt32BE(0);
const height = ihdr.readUInt32BE(4);
const uncompressed = zlib.inflateSync(Buffer.concat(idatParts));

// Extract 280x280 RGBA pixels
// Filter type per row is at offset row * (1 + width * 4)
const pixels = [];
const rowStride = 1 + width * 4;

for (let y = 0; y < height; y++) {
    const rowFilter = uncompressed[y * rowStride];
    // In GDI+ output, filter is 0 (None)
    for (let x = 0; x < width; x++) {
        const offset = y * rowStride + 1 + x * 4;
        const r = uncompressed[offset];
        const g = uncompressed[offset + 1];
        const b = uncompressed[offset + 2];
        const a = uncompressed[offset + 3];
        pixels.push({ r, g, b, a });
    }
}

// Build palette of unique colors or quantize
// Count colors
const colorMap = new Map();
for (const p of pixels) {
    // If transparent, normalize to 0,0,0,0
    if (p.a < 8) {
        p.r = 0; p.g = 0; p.b = 0; p.a = 0;
    }
    const key = (p.r << 24) | (p.g << 16) | (p.b << 8) | p.a;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
}

console.log('Unique colors in 280x280:', colorMap.size);

// Simple color quantization if > 256
let palette = [];
// Put transparent at index 0
palette.push({ r: 0, g: 0, b: 0, a: 0 });

if (colorMap.size <= 256) {
    for (const [key] of colorMap) {
        const r = (key >>> 24) & 0xff;
        const g = (key >>> 16) & 0xff;
        const b = (key >>> 8) & 0xff;
        const a = key & 0xff;
        if (a > 0) palette.push({ r, g, b, a });
    }
} else {
    // Sort by frequency and pick top 255
    const sorted = Array.from(colorMap.entries()).sort((a, b) => b[1] - a[1]);
    for (const [key] of sorted) {
        if (palette.length >= 256) break;
        const r = (key >>> 24) & 0xff;
        const g = (key >>> 16) & 0xff;
        const b = (key >>> 8) & 0xff;
        const a = key & 0xff;
        if (a > 0) palette.push({ r, g, b, a });
    }
}

function findNearest(p) {
    if (p.a < 8) return 0;
    let bestDist = Infinity;
    let bestIdx = 0;
    for (let i = 0; i < palette.length; i++) {
        const pal = palette[i];
        // weighted euclidean distance
        const dr = p.r - pal.r;
        const dg = p.g - pal.g;
        const db = p.b - pal.b;
        const da = (p.a - pal.a) * 2;
        const dist = dr*dr*2 + dg*dg*4 + db*db*3 + da*da;
        if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
        }
    }
    return bestIdx;
}

// Build indexed scanlines
const indexedScanlines = Buffer.alloc(height * (1 + width));
for (let y = 0; y < height; y++) {
    indexedScanlines[y * (1 + width)] = 0; // Filter None
    for (let x = 0; x < width; x++) {
        const p = pixels[y * width + x];
        const idx = findNearest(p);
        indexedScanlines[y * (1 + width) + 1 + x] = idx;
    }
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
}

function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
    const len = data.length;
    const chunk = Buffer.alloc(12 + len);
    chunk.writeUInt32BE(len, 0);
    chunk.write(type, 4, 4, 'ascii');
    data.copy(chunk, 8);
    const toCrc = chunk.subarray(4, 8 + len);
    const crc = crc32(toCrc);
    chunk.writeUInt32BE(crc, 8 + len);
    return chunk;
}

// 1. Signature
const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// 2. IHDR: 280x280, 8-bit, color type 3 (indexed)
const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(width, 0);
ihdrData.writeUInt32BE(height, 4);
ihdrData[8] = 8; // 8 bits
ihdrData[9] = 3; // Color type 3 = Indexed-colour
ihdrData[10] = 0; // compression
ihdrData[11] = 0; // filter
ihdrData[12] = 0; // interlace
const ihdrChunk = makeChunk('IHDR', ihdrData);

// 3. PLTE chunk: 3 bytes per entry
const plteData = Buffer.alloc(palette.length * 3);
for (let i = 0; i < palette.length; i++) {
    plteData[i * 3] = palette[i].r;
    plteData[i * 3 + 1] = palette[i].g;
    plteData[i * 3 + 2] = palette[i].b;
}
const plteChunk = makeChunk('PLTE', plteData);

// 4. tRNS chunk: 1 byte per entry for indexed
const trnsData = Buffer.alloc(palette.length);
for (let i = 0; i < palette.length; i++) {
    trnsData[i] = palette[i].a;
}
const trnsChunk = makeChunk('tRNS', trnsData);

// 5. IDAT chunk
const compressed = zlib.deflateSync(indexedScanlines, { level: 9 });
const idatChunk = makeChunk('IDAT', compressed);

// 6. IEND chunk
const iendChunk = makeChunk('IEND', Buffer.alloc(0));

const finalPng = Buffer.concat([sig, ihdrChunk, plteChunk, trnsChunk, idatChunk, iendChunk]);

fs.writeFileSync('backend/public/images/logo-email.png', finalPng);
fs.writeFileSync('backend/public/images/logo-email-280.png', finalPng);

console.log('Optimized PNG created successfully!');
console.log('Final Size:', finalPng.length, 'bytes (', (finalPng.length / 1024).toFixed(2), 'KB )');
