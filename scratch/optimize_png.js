const fs = require('fs');
const zlib = require('zlib');

// Read the WPF 280x280 png or standard 280x280 png
const buf = fs.readFileSync('backend/public/images/logo-email.png');

// Parse PNG chunks
let pos = 8; // skip 8-byte signature
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

const fullIdat = Buffer.concat(idatParts);
const uncompressed = zlib.inflateSync(fullIdat);

// Re-compress with max compression
const recompressed = zlib.deflateSync(uncompressed, { level: 9, strategy: zlib.constants.Z_DEFAULT_STRATEGY });

console.log('Original IDAT:', fullIdat.length);
console.log('Recompressed IDAT:', recompressed.length);
console.log('Uncompressed raw bytes:', uncompressed.length);
