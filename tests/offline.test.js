import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const worker = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
const scope = 'https://vineeth-pydi.github.io/DailyLingo/';
const activeKey = `dailylingo-v1:${scope}`;
function environment(seed = {}, network = async () => { throw new Error('Offline'); }) {
  const entries = new Map(Object.entries(seed).map(([key, urls]) => [key, new Map(urls.map(url => [url, new Response(key)]))]));
  const handlers = {};
  const urlOf = request => typeof request === 'string' ? new URL(request, scope).href : request.url;
  const caches = {
    keys: async () => [...entries.keys()],
    delete: async key => entries.delete(key),
    open: async key => {
      if (!entries.has(key)) entries.set(key, new Map());
      const values = entries.get(key);
      return {
        keys: async () => [...values.keys()].map(url => ({ url })),
        addAll: async paths => { for (const path of paths) values.set(urlOf(path), new Response('DailyLingo offline shell')); },
        match: async request => values.get(urlOf(request))?.clone(),
        put: async (request, response) => values.set(urlOf(request), response)
      };
    }
  };
  runInNewContext(worker, {
    caches, URL, Response, fetch: network,
    self: { registration: { scope }, location: { origin: new URL(scope).origin }, clients: { claim: async () => {} }, addEventListener: (name, handler) => { handlers[name] = handler; } }
  });
  async function fire(name, request) {
    const pending = [];
    let response;
    handlers[name]({ request, waitUntil: promise => pending.push(promise), respondWith: promise => { response = promise; } });
    const result = response ? await response : undefined;
    await Promise.all(pending);
    return result;
  }
  return { entries, fire };
}

test('activation replaces this scope cache and protects other apps and legacy installed paths', async () => {
  const oldScoped = `dailylingo-old:${scope}`;
  const otherScope = 'https://vineeth-pydi.github.io/AnotherApp/';
  const otherScoped = `dailylingo-old:${otherScope}`;
  const env = environment({
    [activeKey]: [scope + 'index.html'],
    [oldScoped]: [scope + 'index.html'],
    [otherScoped]: [otherScope + 'index.html'],
    'freelingo-v1': ['https://vineeth-pydi.github.io/FreeLingo/index.html'],
    'freelingo-012345abcdef': [scope + 'index.html'],
    unrelated: [scope + 'index.html']
  });
  await env.fire('activate');
  assert.equal(env.entries.has(oldScoped), false);
  assert.equal(env.entries.has('freelingo-012345abcdef'), false);
  assert.equal(env.entries.has(activeKey), true);
  assert.equal(env.entries.has(otherScoped), true);
  assert.equal(env.entries.has('freelingo-v1'), true);
  assert.equal(env.entries.has('unrelated'), true);
});

test('offline navigation returns only this installed app shell', async () => {
  const env = environment({ unrelated: [scope + 'index.html'] });
  await env.fire('install');
  const response = await env.fire('fetch', { method: 'GET', mode: 'navigate', url: scope + 'lesson' });
  assert.equal(await response.text(), 'DailyLingo offline shell');
  const foreign = await env.fire('fetch', { method: 'GET', mode: 'navigate', url: 'https://vineeth-pydi.github.io/AnotherApp/' });
  assert.equal(foreign, undefined, 'the worker must not intercept another app path');
  const arbitrary = await env.fire('fetch', { method: 'GET', mode: 'cors', url: scope + 'unlisted.json' });
  assert.equal(arbitrary, undefined, 'only declared app assets are cached');
});

test('a missing own cached asset never reads a matching response from another cache', async () => {
  const env = environment({ unrelated: [scope + 'styles.css'] });
  const response = await env.fire('fetch', { method: 'GET', mode: 'cors', url: scope + 'styles.css' });
  assert.equal(response.type, 'error');
});
