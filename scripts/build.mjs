import { cp, mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { deflateSync } from 'node:zlib';

const root = resolve(import.meta.dirname, '..');
const output = join(root, 'dist');
await mkdir(output, { recursive: true });
await cp(join(root, 'public'), output, { recursive: true });
await cp(join(root, 'src'), join(output, 'src'), { recursive: true });
await writeFile(join(output, '.nojekyll'), '');

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const kind = Buffer.from(type);
  const head = Buffer.alloc(4); head.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([kind, data])));
  return Buffer.concat([head, kind, data, crc]);
}
function distance(x, y, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.min(1, Math.max(0, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - ax - t * dx, y - ay - t * dy);
}
function icon(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const lines = [[48,59,99,59],[48,59,48,111],[48,111,72,135],[72,135,126,135],[126,135,126,84],[126,84,99,59],[72,80,105,80],[72,101,93,101],[139,47,139,72],[127,59,151,59]];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const px = (x + .5) * 192 / size, py = (y + .5) * 192 / size;
    const rounded = Math.hypot(Math.max(Math.abs(px - 96) - 49, 0), Math.max(Math.abs(py - 96) - 49, 0)) <= 47;
    const white = lines.some(line => distance(px, py, ...line) < 4.5);
    const offset = y * (size * 4 + 1) + 1 + x * 4;
    raw.set(white ? [255,249,239,255] : [236,107,66,rounded ? 255 : 0], offset);
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
await writeFile(join(output, 'icon-192.png'), icon(192));
await writeFile(join(output, 'icon-512.png'), icon(512));

// A new asset digest produces a new offline cache on every changed release.
const { createHash } = await import('node:crypto');
const hash = createHash('sha256');
async function hashFiles(directory) {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) await hashFiles(join(directory, entry.name));
    else if (entry.name !== 'sw.js') { hash.update(entry.name); hash.update(await readFile(join(directory, entry.name))); }
  }
}
await hashFiles(output);
const serviceWorker = (await readFile(join(output, 'sw.js'), 'utf8')).replace("'freelingo-v1'", `'freelingo-${hash.digest('hex').slice(0, 12)}'`);
await writeFile(join(output, 'sw.js'), serviceWorker);
console.log('Built FreeLingo in dist/ — no external dependencies or secrets required.');
