import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const build = () => execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root });

test('static output includes all offline assets and works under the DailyLingo Pages path', async () => {
  build();
  const firstWorker = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8');
  await writeFile(new URL('../dist/obsolete-release.txt', import.meta.url), 'must not ship');
  build();
  await assert.rejects(readFile(new URL('../dist/obsolete-release.txt', import.meta.url)), { code: 'ENOENT' });
  const worker = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8');
  assert.equal(worker, firstWorker, 'rebuilding the same source produces the same offline release');
  const assets = [...worker.matchAll(/'\.\/([^']*)'/g)].map(match => match[1] || 'index.html');
  for (const asset of new Set(assets)) await readFile(new URL('../dist/' + asset, import.meta.url));
  assert.match(worker, /dailylingo-[a-f0-9]{12}/);
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.equal(/(?:src|href)="\//.test(html), false, 'assets must work under /DailyLingo/');
  assert.match(html, /<title>DailyLingo/);
  const manifest = JSON.parse(await readFile(new URL('../dist/manifest.webmanifest', import.meta.url)));
  assert.equal(manifest.short_name, 'DailyLingo');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  for (const image of manifest.icons.filter(image => image.type === 'image/png')) {
    const bytes = await readFile(new URL('../dist/' + image.src, import.meta.url));
    assert.equal(bytes.readUInt32BE(16), Number(image.sizes.split('x')[0]));
    assert.equal(bytes.readUInt32BE(20), Number(image.sizes.split('x')[1]));
  }
});
