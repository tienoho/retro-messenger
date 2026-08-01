import { deflateSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const size = 512;
const pixels = Buffer.alloc((size * 4 + 1) * size);

function insideRoundedRect(x, y, left, top, right, bottom, radius) {
  const closestX = Math.max(left + radius, Math.min(x, right - radius));
  const closestY = Math.max(top + radius, Math.min(y, bottom - radius));
  const dx = x - closestX;
  const dy = y - closestY;
  return (
    x >= left &&
    x <= right &&
    y >= top &&
    y <= bottom &&
    dx * dx + dy * dy <= radius * radius
  );
}

function whiteMark(x, y) {
  const vertical = x >= 132 && x <= 174 && y >= 132 && y <= 370;
  const top = x >= 154 && x <= 272 && y >= 132 && y <= 172;
  const middle = x >= 154 && x <= 264 && y >= 232 && y <= 270;
  const bowl = x >= 246 && x <= 286 && y >= 158 && y <= 244;
  const legCenter = 228 + (y - 265) * 0.55;
  const leg = y >= 258 && y <= 370 && Math.abs(x - legCenter) <= 20;
  const bang = x >= 338 && x <= 378 && y >= 142 && y <= 300;
  const dot = (x - 358) ** 2 + (y - 352) ** 2 <= 24 ** 2;
  return vertical || top || middle || bowl || leg || bang || dot;
}

for (let y = 0; y < size; y++) {
  const row = y * (size * 4 + 1);
  pixels[row] = 0;
  for (let x = 0; x < size; x++) {
    const offset = row + 1 + x * 4;
    const bubble =
      insideRoundedRect(x, y, 28, 28, 484, 446, 104) ||
      (y >= 400 && y <= 484 && x >= 92 && x <= 220 && x + y <= 622);
    if (!bubble) continue;
    const mark = whiteMark(x, y);
    pixels[offset] = mark ? 255 : 100;
    pixels[offset + 1] = mark ? 255 : 53;
    pixels[offset + 2] = mark ? 255 : 160;
    pixels[offset + 3] = 255;
  }
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(size, 0);
header.writeUInt32BE(size, 4);
header[8] = 8;
header[9] = 6;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", header),
  chunk("IDAT", deflateSync(pixels, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);
const directory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../build",
);
await mkdir(directory, { recursive: true });
await writeFile(path.join(directory, "icon.png"), png);
