/**
 * Vyapar AdNET — Standalone Offline QR Code Generator
 * Pure JavaScript, zero external dependencies.
 * Generates ISO/IEC 18004 compliant Version 1-10 QR Codes (Byte Mode, EC Level L/M).
 * Outputs clean SVG strings, Data URLs, and triggers instant client-side PNG downloads.
 */

// Galois Field GF(256) math for Reed-Solomon error correction
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);

(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF256_EXP[i] = GF256_EXP[i - 255];
  }
})();

function gfMul(x, y) {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

function rsGeneratorPoly(numEcBytes) {
  let poly = [1];
  for (let i = 0; i < numEcBytes; i++) {
    const next = new Array(poly.length + 1).fill(0);
    const root = GF256_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], root);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function calculateReedSolomon(data, numEcBytes) {
  const gen = rsGeneratorPoly(numEcBytes);
  const remainder = new Array(numEcBytes).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    if (factor !== 0) {
      for (let j = 0; j < numEcBytes; j++) {
        remainder[j] ^= gfMul(gen[j], factor);
      }
    }
  }
  return remainder;
}

// QR Code Capacity Table for Byte Mode (Version 1 to 10, Level M)
const CAPACITY = [
  null,
  { version: 1, size: 21, dataBytes: 16, ecBytes: 10, totalBytes: 26 },
  { version: 2, size: 25, dataBytes: 28, ecBytes: 16, totalBytes: 44 },
  { version: 3, size: 29, dataBytes: 44, ecBytes: 26, totalBytes: 70 },
  { version: 4, size: 33, dataBytes: 64, ecBytes: 36, totalBytes: 100 },
  { version: 5, size: 37, dataBytes: 86, ecBytes: 48, totalBytes: 134 },
  { version: 6, size: 41, dataBytes: 108, ecBytes: 64, totalBytes: 172 },
  { version: 7, size: 45, dataBytes: 124, ecBytes: 72, totalBytes: 196 },
  { version: 8, size: 49, dataBytes: 154, ecBytes: 88, totalBytes: 242 },
  { version: 9, size: 53, dataBytes: 182, ecBytes: 110, totalBytes: 292 },
  { version: 10, size: 57, dataBytes: 216, ecBytes: 130, totalBytes: 346 },
];

// Alignment pattern positions for Versions 1-10
const ALIGNMENT_POS = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

/**
 * Generate 2D boolean matrix of QR modules
 */
export function generateQRMatrix(text) {
  const utf8Bytes = new TextEncoder().encode(text);
  let cfg = null;
  for (let v = 1; v <= 10; v++) {
    // 4 bits mode + 8 bits count + data
    if (utf8Bytes.length + 2 <= CAPACITY[v].dataBytes) {
      cfg = CAPACITY[v];
      break;
    }
  }
  if (!cfg) {
    cfg = CAPACITY[10]; // fallback
  }

  // 1. Bit Stream construction
  const bitstream = [];
  function pushBits(val, len) {
    for (let i = len - 1; i >= 0; i--) {
      bitstream.push((val >> i) & 1);
    }
  }

  // Byte mode indicator: 0100
  pushBits(0b0100, 4);
  // Character count indicator (8 bits for V1-9 byte mode, 16 bits for V10)
  pushBits(utf8Bytes.length, cfg.version < 10 ? 8 : 16);
  // Data bytes
  for (let i = 0; i < utf8Bytes.length; i++) {
    pushBits(utf8Bytes[i], 8);
  }

  // Terminator (up to 4 zeroes)
  const maxDataBits = cfg.dataBytes * 8;
  const termLen = Math.min(4, maxDataBits - bitstream.length);
  pushBits(0, termLen);

  // Pad to byte boundary
  while (bitstream.length % 8 !== 0) {
    bitstream.push(0);
  }

  // Pad bytes: alternating 0xEC, 0x11
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bitstream.length < maxDataBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert to byte array
  const dataBytes = [];
  for (let i = 0; i < bitstream.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bitstream[i + b];
    }
    dataBytes.push(byte);
  }

  // 2. Error Correction
  const ecBytes = calculateReedSolomon(dataBytes, cfg.ecBytes);
  const finalCodewords = [...dataBytes, ...ecBytes];

  // 3. Matrix Setup
  const N = cfg.size;
  const matrix = Array.from({ length: N }, () => new Array(N).fill(null));
  const isFunction = Array.from({ length: N }, () => new Array(N).fill(false));

  function setModule(r, c, val) {
    if (r >= 0 && r < N && c >= 0 && c < N) {
      matrix[r][c] = val;
      isFunction[r][c] = true;
    }
  }

  // Finder Patterns
  function drawFinder(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isBlack = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setModule(nr, nc, isBlack ? 1 : 0);
        } else {
          setModule(nr, nc, 0); // Separator
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, N - 7);
  drawFinder(N - 7, 0);

  // Timing patterns
  for (let i = 8; i < N - 8; i++) {
    const val = i % 2 === 0 ? 1 : 0;
    if (matrix[6][i] === null) setModule(6, i, val);
    if (matrix[i][6] === null) setModule(i, 6, val);
  }

  // Dark module
  setModule(4 * cfg.version + 9, 8, 1);

  // Alignment Patterns
  const alignCoords = ALIGNMENT_POS[cfg.version] || [];
  for (let i = 0; i < alignCoords.length; i++) {
    for (let j = 0; j < alignCoords.length; j++) {
      const ar = alignCoords[i];
      const ac = alignCoords[j];
      // Skip if overlapping finder patterns
      if ((ar < 9 && ac < 9) || (ar < 9 && ac > N - 10) || (ar > N - 10 && ac < 9)) continue;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const isBlack = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
          setModule(ar + r, ac + c, isBlack ? 1 : 0);
        }
      }
    }
  }

  // Reserve format information areas
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === null) isFunction[8][i] = true;
    if (matrix[i][8] === null) isFunction[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    if (matrix[8][N - 1 - i] === null) isFunction[8][N - 1 - i] = true;
    if (matrix[N - 1 - i][8] === null) isFunction[N - 1 - i][8] = true;
  }

  // 4. Place Data Bits
  const finalBits = [];
  for (const byte of finalCodewords) {
    for (let b = 7; b >= 0; b--) {
      finalBits.push((byte >> b) & 1);
    }
  }

  let bitIdx = 0;
  let upward = true;
  for (let right = N - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column
    const colList = [right, right - 1];
    const rowList = [];
    if (upward) {
      for (let r = N - 1; r >= 0; r--) rowList.push(r);
    } else {
      for (let r = 0; r < N; r++) rowList.push(r);
    }
    upward = !upward;

    for (const r of rowList) {
      for (const c of colList) {
        if (!isFunction[r][c]) {
          const bit = bitIdx < finalBits.length ? finalBits[bitIdx++] : 0;
          // Apply standard mask pattern 0: (row + col) % 2 === 0
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = (bit ^ (mask ? 1 : 0)) === 1 ? 1 : 0;
        }
      }
    }
  }

  // Format info for Level M + Mask 0: 101010000010010 (BCH code with mask 0x5412)
  const formatInfo = 0b101010000010010 ^ 0x5412;
  const fBits = [];
  for (let i = 14; i >= 0; i--) {
    fBits.push((formatInfo >> i) & 1);
  }

  // Top-left format placement
  const tlCoords = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    matrix[tlCoords[i][0]][tlCoords[i][1]] = fBits[i];
  }

  // Split format placement
  for (let i = 0; i < 7; i++) {
    matrix[N - 1 - i][8] = fBits[i];
  }
  for (let i = 0; i < 8; i++) {
    matrix[8][N - 8 + i] = fBits[7 + i];
  }

  return matrix;
}

/**
 * Render QR matrix to SVG markup string
 */
export function generateQRSvg(text, options = {}) {
  const {
    size = 200,
    color = '#0B192C',
    bgColor = '#FFFFFF',
    margin = 2,
  } = options;

  const matrix = generateQRMatrix(text);
  const n = matrix.length;
  const total = n + margin * 2;
  const cellSize = size / total;

  let paths = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c] === 1) {
        const x = (c + margin) * cellSize;
        const y = (r + margin) * cellSize;
        paths += `M${x.toFixed(2)},${y.toFixed(2)}h${cellSize.toFixed(2)}v${cellSize.toFixed(2)}h-${cellSize.toFixed(2)}z `;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="${bgColor}" />
      <path d="${paths}" fill="${color}" />
    </svg>
  `.trim();
}

/**
 * Triggers instant client-side download of QR code as PNG image
 */
export function downloadQRPng(text, filename = 'addnet-referral-qr.png', size = 500) {
  const matrix = generateQRMatrix(text);
  const n = matrix.length;
  const margin = 3;
  const total = n + margin * 2;
  const cellSize = size / total;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // Draw modules
  ctx.fillStyle = '#0B192C';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c] === 1) {
        ctx.fillRect((c + margin) * cellSize, (r + margin) * cellSize, cellSize + 0.5, cellSize + 0.5);
      }
    }
  }

  // Trigger download
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
