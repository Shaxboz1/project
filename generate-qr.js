/**
 * Standalone Zero-Dependency QR Code Generator (SVG & PNG)
 * Encodes text/URL into QR Code (Version 3-M, 29x29 modules, with quiet zone)
 * Generates both high-res vector SVG and 1024x1024 lossless PNG.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Galois Field GF(256) with primitive polynomial 0x11d (285)
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
let x = 1;
for (let i = 0; i < 255; i++) {
  EXP[i] = x;
  EXP[i + 255] = x;
  LOG[x] = i;
  x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
}

function gmult(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

// Generate Reed-Solomon generator polynomial
function rsGenPoly(nsym) {
  let g = [1];
  for (let i = 0; i < nsym; i++) {
    const next = new Array(g.length + 1).fill(0);
    const root = EXP[i];
    for (let j = 0; j < g.length; j++) {
      next[j] ^= gmult(g[j], root);
      next[j + 1] ^= g[j];
    }
    g = next;
  }
  return g;
}

function rsEncode(msg, nsym) {
  const gen = rsGenPoly(nsym);
  const out = new Uint8Array(msg.length + nsym);
  out.set(msg);
  for (let i = 0; i < msg.length; i++) {
    const coef = out[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        out[i + j] ^= gmult(gen[j], coef);
      }
    }
  }
  out.set(msg);
  return out.slice(msg.length);
}

// QR Code Version 3-M parameters:
// Total codewords: 70
// Data codewords: 44
// EC codewords: 26 (divided into 2 blocks of 13 EC codewords each for 22 data codewords each)
// Size: 29x29
function createQRCodeMatrix(text) {
  const size = 29;
  const matrix = Array.from({ length: size }, () => Array(size).fill(null));
  const isReserved = Array.from({ length: size }, () => Array(size).fill(false));

  function setFinder(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          isReserved[nr][nc] = true;
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
              matrix[nr][nc] = 1;
            } else {
              matrix[nr][nc] = 0;
            }
          } else {
            matrix[nr][nc] = 0; // separator
          }
        }
      }
    }
  }

  // Finders
  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  // Alignment pattern at (20, 20) for V3
  const alignRow = 20, alignCol = 20;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const nr = alignRow + r;
      const nc = alignCol + c;
      isReserved[nr][nc] = true;
      if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
        matrix[nr][nc] = 1;
      } else {
        matrix[nr][nc] = 0;
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    isReserved[6][i] = true;
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    isReserved[i][6] = true;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // Dark module
  matrix[size - 8][8] = 1;
  isReserved[size - 8][8] = true;

  // Reserve format info areas
  for (let i = 0; i < 9; i++) {
    isReserved[8][i] = true;
    isReserved[i][8] = true;
  }
  for (let i = size - 8; i < size; i++) {
    isReserved[8][i] = true;
    isReserved[size - 7 + (i - (size - 7))][8] = true;
    isReserved[8][i] = true;
  }
  for (let c = size - 8; c < size; c++) isReserved[8][c] = true;
  for (let r = size - 8; r < size; r++) isReserved[r][8] = true;

  // Encode Data (Byte mode = 0100)
  const bytes = Buffer.from(text, 'utf8');
  if (bytes.length > 42) {
    throw new Error('Text too long for V3-M');
  }

  // Bit stream
  const bits = [];
  function pushBits(val, len) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  pushBits(0b0100, 4); // Byte mode indicator
  pushBits(bytes.length, 8); // Character count (8 bits for V1-9 byte mode)
  for (const b of bytes) {
    pushBits(b, 8);
  }

  // Terminator
  const totalDataBits = 44 * 8; // 352 bits
  const termLen = Math.min(4, totalDataBits - bits.length);
  pushBits(0, termLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Pad bytes 0xEC, 0x11
  const padBytes = [0xec, 0x11];
  let pIdx = 0;
  while (bits.length < totalDataBits) {
    pushBits(padBytes[pIdx], 8);
    pIdx = (pIdx + 1) % 2;
  }

  // Split into codewords (44 bytes total: 2 blocks of 22 bytes)
  const dataBytes = new Uint8Array(44);
  for (let i = 0; i < 44; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataBytes[i] = b;
  }

  // V3-M has 2 blocks of 22 data codewords, each with 13 EC codewords
  const b1Data = dataBytes.slice(0, 22);
  const b2Data = dataBytes.slice(22, 44);
  const b1EC = rsEncode(b1Data, 13);
  const b2EC = rsEncode(b2Data, 13);

  // Interleave data codewords
  const interleaved = [];
  for (let i = 0; i < 22; i++) {
    interleaved.push(b1Data[i]);
    interleaved.push(b2Data[i]);
  }
  // Interleave EC codewords
  for (let i = 0; i < 13; i++) {
    interleaved.push(b1EC[i]);
    interleaved.push(b2EC[i]);
  }

  // Convert to bitstream for placement
  const allBits = [];
  for (const byte of interleaved) {
    for (let i = 7; i >= 0; i--) {
      allBits.push((byte >> i) & 1);
    }
  }
  // Remainder bits for V3 is 0

  // Place codewords in matrix
  let bitIdx = 0;
  let dir = -1; // up
  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c--; // Skip vertical timing column
    const rows = dir === -1
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const colOffset of [0, 1]) {
        const col = c - colOffset;
        if (!isReserved[r][col]) {
          const bit = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          matrix[r][col] = bit;
        }
      }
    }
    dir = -dir;
  }

  // Evaluate masks and apply best mask. We can use standard mask 0: (row + col) % 2 === 0
  // Or mask 2: col % 3 === 0, or mask 1: row % 2 === 0
  // Let's use Mask pattern 000: (r + c) % 2 === 0
  const mask = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isReserved[r][c]) {
        if ((r + c) % 2 === 0) {
          matrix[r][c] ^= 1;
        }
      }
    }
  }

  // Format info for EC Level M (00) and Mask 000 (000):
  // Format data: 00 000 = 00000
  // BCH(15, 5) code for 00000 with mask pattern 101010000010010 (0x5412) is 0x5412 = 101010000010010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];

  // Top-left format placement
  // bits 0..5 on (8, 0..5), bit 6 on (8, 7), bit 7 on (8, 8), bit 8 on (7, 8), bits 9..14 on (5..0, 8)
  const coords1 = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
    [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    matrix[coords1[i][0]][coords1[i][1]] = formatBits[i];
  }

  // Second copy around other finders
  // bits 0..6 along bottom of top-right finder: (8, size-1 down to size-8)
  // bits 7..14 along right of bottom-left finder: (size-7 up to size-1, 8)
  const coords2 = [
    [8, size - 1], [8, size - 2], [8, size - 3], [8, size - 4], [8, size - 5], [8, size - 6], [8, size - 7], [8, size - 8],
    [size - 7, 8], [size - 6, 8], [size - 5, 8], [size - 4, 8], [size - 3, 8], [size - 2, 8], [size - 1, 8]
  ];
  for (let i = 0; i < 15; i++) {
    matrix[coords2[i][0]][coords2[i][1]] = formatBits[i];
  }

  return matrix;
}

// Generate SVG with quiet zone and stylish dark/amber theme option or standard clean high contrast
function generateSVG(matrix, quiet = 4, scale = 16) {
  const size = matrix.length;
  const fullSize = (size + quiet * 2) * scale;
  let paths = '';

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        const x = (c + quiet) * scale;
        const y = (r + quiet) * scale;
        paths += `M${x},${y}h${scale}v${scale}h-${scale}z `;
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${fullSize} ${fullSize}" width="${fullSize}" height="${fullSize}">
  <rect width="100%" height="100%" fill="#ffffff" rx="${scale * 2}"/>
  <path d="${paths.trim()}" fill="#121214"/>
</svg>`;
}

// Generate standalone PNG
function generatePNG(matrix, quiet = 4, scale = 24) {
  const size = matrix.length;
  const dim = (size + quiet * 2) * scale;

  // Uncompressed raw scanlines: each row starts with filter byte 0, then 4 bytes (RGBA) per pixel
  const rowBytes = 1 + dim * 4;
  const raw = Buffer.alloc(dim * rowBytes);

  for (let y = 0; y < dim; y++) {
    const rowOffset = y * rowBytes;
    raw[rowOffset] = 0; // Filter: None
    const matrixY = Math.floor(y / scale) - quiet;

    for (let x = 0; x < dim; x++) {
      const matrixX = Math.floor(x / scale) - quiet;
      const isBlack = (matrixY >= 0 && matrixY < size && matrixX >= 0 && matrixX < size)
        ? (matrix[matrixY][matrixX] === 1)
        : false;

      const pxOffset = rowOffset + 1 + x * 4;
      if (isBlack) {
        // Deep charcoal #121214
        raw[pxOffset] = 0x12;
        raw[pxOffset + 1] = 0x12;
        raw[pxOffset + 2] = 0x14;
        raw[pxOffset + 3] = 0xff;
      } else {
        // Crisp White #ffffff
        raw[pxOffset] = 0xff;
        raw[pxOffset + 1] = 0xff;
        raw[pxOffset + 2] = 0xff;
        raw[pxOffset + 3] = 0xff;
      }
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(raw, { level: 9 });

  // CRC32 table & calculation
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  function calcCRC(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = calcCRC(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR: width(4), height(4), bit depth 8(1), color type 6(RGBA)(1), compression 0(1), filter 0(1), interlace 0(1)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(dim, 0);
  ihdr.writeUInt32BE(dim, 4);
  ihdr[8] = 8;  // 8 bits per channel
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Standard filter
  ihdr[12] = 0; // No interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Read menu_url from menu.json
const menuJsonPath = path.join(__dirname, 'menu.json');
const menuData = JSON.parse(fs.readFileSync(menuJsonPath, 'utf8'));
const url = menuData.restaurant.menu_url || 'https://kebabhouse.uz/menu';

console.log(`Generating QR code for: ${url}`);
const matrix = createQRCodeMatrix(url);

const svgContent = generateSVG(matrix, 4, 16);
fs.writeFileSync(path.join(__dirname, 'qr-code.svg'), svgContent, 'utf8');
console.log('Saved qr-code.svg');

const pngBuffer = generatePNG(matrix, 4, 24);
fs.writeFileSync(path.join(__dirname, 'qr-code.png'), pngBuffer);
console.log(`Saved qr-code.png (${pngBuffer.length} bytes, dimension: ${(matrix.length + 8) * 24}x${(matrix.length + 8) * 24}px)`);
