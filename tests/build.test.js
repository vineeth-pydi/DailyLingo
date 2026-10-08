import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

test('static output includes every declared offline asset and relative GitHub Pages paths', async () => {
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: resolve(import.meta.dirname, '..') });
  const worker = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8');
  const assets = [...worker.matchAll(/'\.\/([^']*)'/g)].map(match => match[1] || 'index.html');
  for (const asset of new Set(assets)) await readFile(new URL('../dist/' + asset, import.meta.url));
  assert.match(worker, /freelingo-[a-f0-9]{12}/);
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.equal(/(?:src|href)="\//.test(html), false, 'assets must work under /FreeLingo/');
  const manifest = JSON.parse(await readFile(new URL('../dist/manifest.webmanifest', import.meta.url)));
  assert.equal(manifest.start_url, './');
  for (const image of manifest.icons.filter(image => image.type === 'image/png')) {
    const bytes = await readFile(new URL('../dist/' + image.src, import.meta.url));
    assert.equal(bytes.readUInt32BE(16), Number(image.sizes.split('x')[0]));
    assert.equal(bytes.readUInt32BE(20), Number(image.sizes.split('x')[1]));
  }
});
