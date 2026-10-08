import test from 'node:test';
import assert from 'node:assert/strict';
import { languages, concepts } from '../src/content.js';

// Browser doubles expose capture events separately from stop(), matching the
// asynchronous lifecycle that caused the original repeated-stop/stale-event bugs.
class Events {
  listeners = new Map();
  addEventListener(name, handler) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(handler);
  }
  removeEventListener(name, handler) { this.listeners.get(name)?.delete(handler); }
  emit(name, event = {}) { for (const handler of this.listeners.get(name) ?? []) handler(event); }
  listenerCount() { return [...this.listeners.values()].reduce((sum, set) => sum + set.size, 0); }
}

class PracticeRoot extends Events {
  html = '';
  status = { textContent: '' };
  audio = { pauses: 0, pause() { this.pauses++; } };
  set innerHTML(value) {
    this.html = value;
    this.status.textContent = value.match(/id="speech-status"[^>]*>([^<]*)/)?.[1] ?? '';
  }
  get innerHTML() { return this.html; }
  contains() { return false; }
  querySelector(selector) {
    if (selector === '#speech-status') return this.status;
    if (selector === 'audio') return this.html.includes('<audio ') ? this.audio : null;
    return null;
  }
  button(action) {
    const tag = this.html.match(new RegExp(`<button\\b[^>]*data-speech="${action}"[^>]*>`))?.[0];
    assert.ok(tag, `missing ${action} button`);
    return { dataset: { speech: action }, disabled: /\bdisabled\b/.test(tag) };
  }
  click(action) {
    const button = this.button(action);
    this.emit('click', { target: { closest: () => button } });
  }
  change(id, checked, value = '') { this.emit('change', { target: { id, checked, value } }); }
}

let moduleId = 0;
async function setup(t, options = {}) {
  const keys = ['window', 'document', 'navigator', 'localStorage', 'MediaRecorder', 'SpeechSynthesisUtterance'];
  const originals = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const stored = new Map(Object.entries(options.storage ?? {}));
  const document = Object.assign(new Events(), { hidden: false, activeElement: null });
  const env = { document, stored, recorders: [], recognizers: [], streams: [], spoken: [], urls: [], revoked: [] };
  const createStream = () => {
    const track = { stops: 0, stop() { this.stops++; } };
    const stream = { track, getTracks: () => [track] };
    env.streams.push(stream);
    return stream;
  };
  env.createStream = createStream;
  class Recorder {
    static isTypeSupported(type) { return type.includes('webm'); }
    constructor(stream, config) {
      this.stream = stream;
      this.config = config;
      this.mimeType = config?.mimeType ?? 'audio/webm';
      this.state = 'inactive';
      this.stopCalls = 0;
      env.recorders.push(this);
    }
    start() { this.state = 'recording'; }
    stop() {
      if (this.state === 'inactive') throw new DOMException('Already stopped', 'InvalidStateError');
      this.state = 'inactive';
      this.stopCalls++;
    }
  }
  if (options.noMimeProbe) Recorder.isTypeSupported = undefined;
  class Recognition {
    constructor() {
      if (options.recognitionConstructorThrows) throw new Error('Unavailable speech service');
      this.starts = 0; this.stops = 0; this.aborts = 0;
      env.recognizers.push(this);
    }
    start() { this.starts++; }
    stop() { this.stops++; }
    abort() { this.aborts++; if (options.abortThrows) throw new Error('Already stopped'); }
  }
  const voices = [
    { name: 'Spanish Spain', lang: 'es-ES', voiceURI: 'local-spain', localService: true },
    { name: 'Spanish Latin America', lang: 'es-419', voiceURI: 'local-latin', localService: true },
    { name: 'Network Spanish', lang: 'es-419', voiceURI: 'network-spanish', localService: false }
  ];
  const synthesis = Object.assign(new Events(), {
    cancels: 0,
    getVoices: () => voices,
    cancel() { this.cancels++; },
    speak(utterance) {
      if (options.playbackThrows) throw new Error('Voice unavailable');
      env.spoken.push(utterance);
    }
  });
  class Utterance { constructor(text) { this.text = text; } }
  const window = {
    isSecureContext: options.secure !== false,
    MediaRecorder: options.noRecorder ? undefined : Recorder,
    SpeechRecognition: Recognition,
    SpeechSynthesisUtterance: options.noUtterance ? undefined : Utterance,
    speechSynthesis: synthesis
  };
  const globals = {
    window,
    MediaRecorder: window.MediaRecorder,
    SpeechSynthesisUtterance: window.SpeechSynthesisUtterance,
    document,
    navigator: { mediaDevices: { getUserMedia: options.getUserMedia ?? (() => Promise.resolve(createStream())) } },
    localStorage: { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) }
  };
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  const createUrl = URL.createObjectURL, revokeUrl = URL.revokeObjectURL;
  URL.createObjectURL = blob => { const url = `blob:dailylingo-test-${env.urls.length}`; env.urls.push({ url, blob }); return url; };
  URL.revokeObjectURL = url => env.revoked.push(url);
  const speech = await import(`../src/speech.js?test=${++moduleId}`);
  t.after(() => {
    speech.disposeSpeechPractice();
    URL.createObjectURL = createUrl; URL.revokeObjectURL = revokeUrl;
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  env.speech = speech; env.synthesis = synthesis; env.root = new PracticeRoot();
  env.mount = () => speech.mountSpeechPractice(env.root, languages.find(language => language.id === 'es'), languages.find(language => language.id === 'en'));
  env.finish = (recorder, data = 'recorded speech') => {
    if (data) recorder.ondataavailable({ data: new Blob([data], { type: recorder.mimeType }) });
    recorder.onstop();
  };
  return env;
}

const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

test('finishing a recording blocks repeated stop clicks until final audio arrives', async t => {
  const env = await setup(t); env.mount();
  env.root.click('record'); await flush();
  const recorder = env.recorders[0], staleButton = env.root.button('record');
  env.root.click('record');
  assert.equal(env.root.button('record').disabled, true);
  assert.equal(env.root.button('next').disabled, true);
  assert.match(env.root.html, /Saving recording/);
  assert.doesNotThrow(() => env.root.emit('click', { target: { closest: () => staleButton } }));
  assert.equal(recorder.stopCalls, 1);
  assert.equal(recorder.stream.track.stops, 1);
  env.finish(recorder);
  assert.equal(env.root.button('record').disabled, false);
  assert.match(env.root.html, /download="dailylingo-es-hello.webm"/);
  assert.equal(env.urls[0].blob.size, 'recorded speech'.length);
});

test('late errors and stop events from an abandoned recording cannot stop a new microphone session', async t => {
  const env = await setup(t); env.mount();
  env.root.click('record'); await flush();
  const abandoned = env.recorders[0];
  env.document.hidden = true; env.document.emit('visibilitychange');
  assert.equal(abandoned.stream.track.stops, 1);
  env.document.hidden = false; env.document.emit('visibilitychange');
  env.root.click('record'); await flush();
  const current = env.recorders[1];
  abandoned.onerror({ error: new Error('Late device error') }); env.finish(abandoned);
  assert.equal(current.state, 'recording');
  assert.equal(current.stream.track.stops, 0);
  assert.equal(env.urls.length, 0);
  assert.match(env.root.html, /Stop recording/);
});

test('a microphone permission promise resolved after disposal releases every acquired track', async t => {
  let resolveMedia;
  const env = await setup(t, { getUserMedia: () => new Promise(resolve => { resolveMedia = resolve; }) });
  env.mount(); env.root.click('record');
  assert.match(env.root.html, /Waiting for microphone/);
  env.speech.disposeSpeechPractice();
  const lateStream = env.createStream(); resolveMedia(lateStream); await flush();
  assert.equal(lateStream.track.stops, 1);
  assert.equal(env.recorders.length, 0);
  assert.equal(env.root.listenerCount(), 0);
  assert.equal(env.document.listenerCount(), 0);
  assert.equal(env.synthesis.listenerCount(), 0);
});

test('recordings use the browser default encoding when MIME probing is unavailable', async t => {
  const env = await setup(t, { noMimeProbe: true }); env.mount();
  env.root.click('record'); await flush();
  assert.equal(env.recorders[0].config, undefined);
  assert.equal(env.recorders[0].state, 'recording');
});

test('recording URLs are revoked when changing phrases and leaving the speaking page', async t => {
  const env = await setup(t); env.mount();
  env.root.click('record'); await flush(); env.root.click('record'); env.finish(env.recorders[0]);
  env.root.click('next');
  assert.deepEqual(env.revoked, [env.urls[0].url]);
  assert.equal(env.root.html.includes('<audio '), false);
  env.root.click('record'); await flush(); env.root.click('record'); env.finish(env.recorders[1]);
  env.speech.disposeSpeechPractice();
  assert.deepEqual(env.revoked, env.urls.map(item => item.url));
  assert.equal(env.root.audio.pauses > 0, true);
});

test('browser transcription requires explicit consent and tolerates an empty result', async t => {
  const env = await setup(t); env.mount();
  env.root.click('transcribe');
  assert.equal(env.recognizers.length, 0);
  env.root.change('speech-consent', true); env.root.click('transcribe');
  const recognizer = env.recognizers[0];
  assert.equal(recognizer.starts, 1);
  assert.equal(recognizer.lang, 'es-419');
  assert.doesNotThrow(() => recognizer.onresult({ resultIndex: 0, results: [] }));
  recognizer.onresult({ resultIndex: 1, results: [null, [{ transcript: '¡HOLA!' }]] });
  assert.match(env.root.html, /recognized words match/);
  recognizer.onend();
  assert.equal(env.root.button('record').disabled, false);
});

test('revoking transcription consent aborts capture and ignores subsequent speech events', async t => {
  const env = await setup(t, { abortThrows: true }); env.mount();
  env.root.change('speech-consent', true); env.root.click('transcribe');
  const recognizer = env.recognizers[0];
  assert.doesNotThrow(() => env.root.change('speech-consent', false));
  assert.equal(recognizer.aborts, 1);
  recognizer.onresult({ results: [[{ transcript: 'Hola' }]] }); recognizer.onend();
  assert.match(env.root.html, /Transcription stopped/);
  assert.equal(env.root.html.includes('You said:'), false);
  assert.equal(env.root.button('transcribe').disabled, true);
  assert.equal(env.root.button('record').disabled, false);
});

test('speech service failures are announced immediately and constructor failures remain usable', async t => {
  const env = await setup(t); env.mount();
  env.root.change('speech-consent', true); env.root.click('transcribe');
  env.recognizers[0].onerror({ error: 'network' });
  assert.match(env.root.status.textContent, /could not connect/);
  env.recognizers[0].onend();
  assert.equal(env.root.button('record').disabled, false);
});

test('unavailable transcription constructor and insecure capture show recoverable guidance', async t => {
  const env = await setup(t, { recognitionConstructorThrows: true }); env.mount();
  env.root.change('speech-consent', true);
  assert.doesNotThrow(() => env.root.click('transcribe'));
  assert.match(env.root.html, /Transcription could not start/);
  assert.equal(env.root.button('record').disabled, false);
  env.speech.disposeSpeechPractice();
  window.isSecureContext = false; env.mount();
  assert.equal(env.root.button('record').disabled, true);
  assert.equal(env.root.button('transcribe').disabled, true);
  assert.match(env.root.html, /Browser transcription requires HTTPS/);
});

test('legacy voice preferences migrate to DailyLingo and reset removes both names', async t => {
  const env = await setup(t, { storage: { 'freelingo-speech-v1': JSON.stringify({ localOnly: false, voices: { es: 'network-spanish' } }) } });
  assert.equal(env.stored.has('freelingo-speech-v1'), false);
  assert.deepEqual(JSON.parse(env.stored.get('dailylingo-speech-v1')), { localOnly: false, voices: { es: 'network-spanish' } });
  env.speech.speakPhrase(concepts[0], languages.find(language => language.id === 'es'));
  assert.equal(env.spoken[0].voice.voiceURI, 'network-spanish');
  env.stored.set('freelingo-speech-v1', '{}'); env.speech.resetSpeechPreferences();
  assert.equal(env.stored.has('dailylingo-speech-v1'), false);
  assert.equal(env.stored.has('freelingo-speech-v1'), false);
  env.speech.speakPhrase(concepts[0], languages.find(language => language.id === 'es'), true);
  assert.equal(env.spoken[1].voice.voiceURI, 'local-latin');
  assert.equal(env.spoken[1].rate, 0.6);
});

test('missing or failing speech playback reports guidance instead of throwing', async t => {
  const env = await setup(t, { playbackThrows: true });
  const messages = [];
  const language = languages.find(language => language.id === 'es');
  assert.doesNotThrow(() => env.speech.speakPhrase(concepts[0], language, false, message => messages.push(message)));
  assert.match(messages[0], /could not play/);
  window.SpeechSynthesisUtterance = undefined; globalThis.SpeechSynthesisUtterance = undefined;
  assert.doesNotThrow(() => env.speech.speakPhrase(concepts[0], language, false, message => messages.push(message)));
  assert.match(messages[1], /unavailable in this browser/);
});
